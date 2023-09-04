import ExpiryMap from "expiry-map";

// @ts-ignore
import type { Doc } from "yjs";

// const documents = new ExpiryMap<string, Doc>(60 * 60 * 1000);
const documents = new ExpiryMap<string, Doc>(48 * 60 * 60 * 1000);

export default abstract class Database {
    public async initialize() {}
    public abstract createUser(email: string, passwordHash: Buffer): Promise<void>;
    public abstract getUser(email: string): Promise<{
        id: string;
        email: string;
        passwordHash: Buffer;
        salt: Buffer | null;
    }>;
    public abstract getChats(userID: string): Promise<any[]>;
    public abstract getMessages(userID: string): Promise<any[]>;
    public abstract insertMessages(userID: string, messages: any[]): Promise<void>;
    public abstract createShare(userID: string|null, id: string): Promise<boolean>;
    public abstract setTitle(userID: string, chatID: string, title: string): Promise<void>;
    public abstract deleteChatAndRelatedData(userID: string, chatID: string): Promise<any>;
    public abstract getDeletedChatIDs(userID: string): Promise<string[]>;

    public abstract saveSummary(summaryID: string, userID: string, campaignID: string, chatID: string, messageIDs: string[], summary: string): Promise<void>;
    public abstract getSummaries(userID: string, campaignID: string, chatID: string): Promise<{ chatID: string, messageIDs: string[], summary: string}[]>;
    public abstract saveTokensSinceLastSummary(userID: string, campaignID: string, chatID: string, tokenCount: number, lastSummarizedMessageID?: string): Promise<void>;
    public abstract getTokensSinceLastSummary(userID: string, campaignID: string, chatID: string): Promise<{tokenCount: number | undefined, lastSummarizedMessageID: string | undefined}>;

    public abstract saveCampaign(userID: string, campaignID: string, title: string, description: string): Promise<void>;
    public abstract getCampaigns(userID: string): Promise<{id: string, title: string, description: string}[]>;
    public abstract getCampaign(userID: string, campaignID: string): Promise<{id: string, title: string, description: string, data: string}>;
    public abstract deleteCampaign(userID: string, campaignID: string): Promise<void>;

    protected abstract loadYDoc(userID: string): Promise<Doc>;
    public abstract saveYUpdate(userID: string, update: Uint8Array): Promise<void>;

    public async getYDoc(userID: string): Promise<Doc> {
        const doc = documents.get(userID);
        if (doc) {
            return doc;
        }
        const newDoc = await this.loadYDoc(userID);
        documents.set(userID, newDoc);
        return newDoc;
    }
}