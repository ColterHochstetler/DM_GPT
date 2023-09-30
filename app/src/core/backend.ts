import EventEmitter from 'events';
import * as Y from 'yjs';
import { encode, decode } from '@msgpack/msgpack';
import { MessageTree } from './chat/message-tree';
import { TokenCount, Chat, SummaryMinimal, SummaryDetailed, StoryElement} from './chat/types';
import { AsyncLoop } from "./utils/async-loop";
import { ChatManager } from '.';
import { getRateLimitResetTimeFromResponse } from './utils';
import { importChat } from './chat/chat-persistance';

const endpoint = '/chatapi';

export let backend: {
    current?: Backend | null
} = {};

export interface User {
    id: string;
    email?: string;
    name?: string;
    avatar?: string;
    services?: string[];
}

export class Backend extends EventEmitter {
    public user: User | null = null;
    public services: string[] = [];
    private checkedSession = false;

    private sessionInterval = new AsyncLoop(() => this.getSession(), 1000 * 30);
    private syncInterval = new AsyncLoop(() => this.sync(), 1000 * 5);

    private pendingYUpdate: Uint8Array | null = null;
    private lastFullSyncAt = 0;
    private legacySync = false;
    private rateLimitedUntil = 0;

    public constructor(private context: ChatManager) {
        super();

        if ((window as any).AUTH_PROVIDER) {
            backend.current = this;

            this.sessionInterval.start();
            this.syncInterval.start();
        }
    }

    public isSynced() {
        return (this.checkedSession && !this.isAuthenticated) || this.lastFullSyncAt > 0;
    }

    public async getSession() {
        if (Date.now() < this.rateLimitedUntil) {
            console.log(`Waiting another ${this.rateLimitedUntil - Date.now()}ms to check session due to rate limiting.`);
            return;
        }

        const wasAuthenticated = this.isAuthenticated;
        const session = await this.get(endpoint + '/session');

        if (session?.authProvider) {
            (window as any).AUTH_PROVIDER = session.authProvider;
        }

        if (session?.authenticated) {
            this.user = {
                id: session.userID,
                email: session.email,
                name: session.name,
                avatar: session.picture,
                services: session.services,
            };
            this.services = session.services || [];
        } else {
            this.user = null;
            this.services = session?.services || [];
        }

        this.checkedSession = true;

        if (wasAuthenticated !== this.isAuthenticated) {
            this.emit('authenticated', this.isAuthenticated);
            this.lastFullSyncAt = 0;
        }
    }

    public async sync() {
        if (!this.isAuthenticated) {
            return;
        }

        if (Date.now() < this.rateLimitedUntil) {
            console.log(`Waiting another ${this.rateLimitedUntil - Date.now()}ms before syncing due to rate limiting.`);
            return;
        }

        const encoding = await import('lib0/encoding');
        const decoding = await import('lib0/decoding');
        const syncProtocol = await import('y-protocols/sync');

        const sinceLastFullSync = Date.now() - this.lastFullSyncAt;

        const pendingYUpdate = this.pendingYUpdate;
        if (pendingYUpdate && pendingYUpdate.length > 4) {
            this.pendingYUpdate = null;

            const encoder = encoding.createEncoder();
            syncProtocol.writeUpdate(encoder, pendingYUpdate);

            const response = await fetch(endpoint + '/y-sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
                body: encoding.toUint8Array(encoder),
            });

            if (response.status === 429) {
                this.rateLimitedUntil = getRateLimitResetTimeFromResponse(response);
            }
        } else if (sinceLastFullSync > 1000 * 60 * 1) {
            this.lastFullSyncAt = Date.now();

            const encoder = encoding.createEncoder();
            syncProtocol.writeSyncStep1(encoder, this.context.doc.root);

            const queue: Uint8Array[] = [
                encoding.toUint8Array(encoder),
            ];

            for (let i = 0; i < 4; i++) {
                if (!queue.length) {
                    break;
                }

                const buffer = queue.shift()!;

                const response = await fetch(endpoint + '/y-sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/octet-stream'
                    },
                    body: buffer,
                });

                if (!response.ok) {
                    this.rateLimitedUntil = getRateLimitResetTimeFromResponse(response);
                    throw new Error(response.statusText);
                }

                const responseBuffer = await response.arrayBuffer();
                const responseChunks = decode(responseBuffer) as Uint8Array[];

                for (const chunk of responseChunks) {
                    if (!chunk.byteLength) {
                        continue;
                    }

                    const encoder = encoding.createEncoder();
                    const decoder = decoding.createDecoder(chunk);

                    const messageType = decoding.readVarUint(decoder);
                    decoder.pos = 0;

                    syncProtocol.readSyncMessage(decoder, encoder, this.context.doc.root, 'sync');

                    if (encoding.length(encoder)) {
                        queue.push(encoding.toUint8Array(encoder));
                    }
                }
            }

            this.context.emit('update');
        }

        if (!this.legacySync) {
            this.legacySync = true;

            const chats = await this.get(endpoint + '/legacy-sync');

            this.context.doc.transact(() => {
                for (const chat of chats) {
                    try {
                        importChat(this.context.doc, chat);
                    } catch (e) {
                        console.error(e);
                    }
                }
            });
        }
    }

    public receiveYUpdate(update: Uint8Array) {
        if (!this.pendingYUpdate) {
            this.pendingYUpdate = update;
        } else {
            this.pendingYUpdate = Y.mergeUpdates([this.pendingYUpdate, update]);
        }
    }

    async signIn() {
        window.location.href = endpoint + '/login';
    }

    get isAuthenticated() {
        return this.user !== null;
    }

    async logout() {
        window.location.href = endpoint + '/logout';
    }

    async shareChat(chat: Chat): Promise<string | null> { //COMPLETENESS modify to send summaries of game data too
        try {
            const { id } = await this.post(endpoint + '/share', {
                ...chat,
                messages: chat.messages.serialize(),
            });
            if (typeof id === 'string') {
                return id;
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    async getSharedChat(id: string): Promise<Chat | null> { //COMPLETENESS modify to recieve summaries of game data too
        const format = process.env.REACT_APP_SHARE_URL || (endpoint + '/share/:id');
        const url = format.replace(':id', id);
        try {
            const chat = await this.get(url);
            if (chat?.messages?.length) {
                chat.messages = new MessageTree(chat.messages);
                return chat;
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    async deleteChatAndRelatedData(id: string) {
        if (!this.isAuthenticated) {
            return;
        }

        return this.post(endpoint + '/delete', { id });
    }

    async get(url: string) {
        const response = await fetch(url);
        if (response.status === 429) {
            this.rateLimitedUntil = getRateLimitResetTimeFromResponse(response);
        }
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return response.json();
    }

    async post(url: string, data: any) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (response.status === 429) {
            this.rateLimitedUntil = getRateLimitResetTimeFromResponse(response);
        }
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return response.json();
    }

    async saveSummary(summary: SummaryDetailed) {
        return this.post(endpoint + '/save-summary', summary);
    }

    async getSummaries(campaignID: string, chatID: string): Promise<SummaryMinimal[]> {
        const summaries = await this.get(`${endpoint}/get-summaries?chatID=${chatID}&campaignID=${campaignID}`);
        console.log("summaries from server:", summaries);
        return summaries;
    }
    
    async saveTokensSinceLastSummary(chatID: string, campaignID: string, tokenCount: number, lastSummarizedMessageID?: string) {
        const data = {
            chatID: chatID,
            campaignID: campaignID,
            tokenCount: tokenCount,
            lastSummarizedMessageID: lastSummarizedMessageID || null
        };
    
        return this.post(endpoint + '/save-tokens-since-last-summary', data);
    }
        
    async getTokensSinceLastSummary(campaignID: string, chatID: string): Promise<TokenCount> {
        const reply = await this.get(`${endpoint}/get-tokens-since-last-summary?chatID=${chatID}&campaignID=${campaignID}`);
        console.log("getTokensSinceLastSummary reply from server:", reply);
    
        return {
            tokenCount: reply.tokenCount,
            lastSummarizedMessageID: reply.lastSummarizedMessageID
        };
    }

    async saveStoryElement(storyElement: StoryElement) {
        return this.post(endpoint + '/save-story-element', storyElement);
    }
    
    async getStoryElements(campaignID: string): Promise<StoryElement[]> {
        const storyElements = await this.get(`${endpoint}/get-story-elements?campaignID=${campaignID}`);
        console.log("story elements from server:", storyElements);
        return storyElements;
    }
    
    async getTextFileContent(filename: string): Promise<string | null> {
        console.log("getTextFileContent called with filename: ", filename);
        try {
        const response = await fetch(`/textfile?filename=${filename}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text(); // Read the response as text
        return text;
        } catch (e) {
        console.error('Error fetching text file:', e);
        }
        return null;
    }

}