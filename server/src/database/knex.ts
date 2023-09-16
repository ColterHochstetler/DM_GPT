import { validate as validateEmailAddress } from 'email-validator';
import { Knex, knex as KnexClient } from 'knex';
import Database from "./index";
import { config } from '../config';

const tableNames = {
    authentication: 'authentication',
    campaigns: 'campaigns',
    storyElements: 'story_elements',
    chats: 'chats',
    deletedChats: 'deleted_chats',
    messages: 'messages',
    shares: 'shares',
    yjsUpdates: 'updates',
    summaries: 'summaries',
    tokenCount: 'tokenCount'
};

export default class KnexDatabaseAdapter extends Database {
    private knex = KnexClient(this.knexConfig);

    constructor(private knexConfig: Knex.Config = config.database) {
        super();
    }

    public async initialize() { //STABILITY: add foreign key stuff here
        console.log(`Initializing database adapter for ${this.knexConfig.client}.`);
        await this.createTables();
    }

    private async createTables() {
        await this.createTableIfNotExists(tableNames.authentication, (table) => {
            table.text('id').primary();
            table.text('email');
            table.binary('password_hash');
            table.binary('salt');
        });

        await this.createTableIfNotExists(tableNames.campaigns, (table) => {
            table.text('id').primary();
            table.text('user_id');
            table.text('title');
            table.text('description');
            table.text('data');

            table.index('user_id');
        });

        await this.createTableIfNotExists(tableNames.storyElements, (table) => {
            table.text('id').primary();
            table.text('user_id');
            table.text('campaign_id');
            table.text('type');
            table.text('name');
            table.text('description');
            table.json('associations').defaultTo('[]');

            table.index('user_id');
        });

        await this.createTableIfNotExists(tableNames.chats, (table) => { //"scenes"
            table.text('id').primary();
            table.text('user_id');
            table.text('campaign_id');
            table.text('title');
        });

        await this.createTableIfNotExists(tableNames.deletedChats, (table) => {
            table.text('id').primary();
            table.text('user_id');
            table.dateTime('deleted_at');
        });

        await this.createTableIfNotExists(tableNames.messages, (table) => {
            table.text('id').primary();
            table.text('user_id');
            table.text('chat_id');
            table.text('data');
        });

        await this.createTableIfNotExists(tableNames.shares, (table) => {
            table.text('id').primary();
            table.text('user_id');
            table.dateTime('created_at');
        });

        await this.createTableIfNotExists(tableNames.yjsUpdates, (table) => {
            table.increments('id').primary();
            table.text('user_id');
            table.binary('update');

            table.index('user_id');
        });

        await this.createTableIfNotExists(tableNames.summaries, (table) => {
            table.text('id').primary(); 
            table.text('user_id'); 
            table.text('campaign_id');
            table.text('chat_id');
            table.text('message_ids'); 
            table.text('summary'); 
            

            table.index('user_id');
        });

        await this.createTableIfNotExists(tableNames.tokenCount, (table) => {
            table.text('user_id');
            table.text('campaign_id');
            table.text('chat_id');
            table.integer('token_count'); 
            table.text('last_summarized_message_id');

            table.index('user_id');
        });
        
    }

    private async createTableIfNotExists(tableName: string, tableBuilderCallback: (tableBuilder: Knex.CreateTableBuilder) => any) {
        const exists = await this.knex.schema.hasTable(tableName);
        if (!exists) {
            await this.knex.schema.createTable(tableName, tableBuilderCallback);
        }
    }

    public async createUser(email: string, passwordHash: Buffer): Promise<void> {
        if (!validateEmailAddress(email)) {
            throw new Error('invalid email address');
        }

        await this.knex(tableNames.authentication).insert({
            id: email,
            email,
            password_hash: passwordHash,
        });
    }

    public async getUser(email: string): Promise<any> {
        const row = await this.knex(tableNames.authentication)
            .where('email', email)
            .first();

        if (!row) {
            return null;
        }

        return {
            ...row,
            passwordHash: Buffer.from(row.password_hash),
            salt: row.salt ? Buffer.from(row.salt) : null,
        };
    }

    public async getChats(userID: string): Promise<any[]> {
        return await this.knex(tableNames.chats)
            .where('user_id', userID).select();
    }

    public async getMessages(userID: string): Promise<any[]> {
        const rows = await this.knex(tableNames.messages)
            .where('user_id', userID).select();

        return rows.map((row: any) => {
            // row.data = JSON.parse(row.data);
            return row;
        });
    }

    public async insertMessages(userID: string, messages: any[]): Promise<void> {
        // deprecated
    }

    public async createShare(userID: string | null, id: string): Promise<boolean> {
        await this.knex(tableNames.shares)
            .insert({
                id,
                user_id: userID,
                created_at: new Date(),
            });

        return true;
    }

    public async setTitle(userID: string, chatID: string, title: string): Promise<void> {
        // deprecated
    }

    public async deleteChatAndRelatedData(userID: string, chatID: string): Promise<any> {
        await this.knex.transaction(async (trx) => {
            await trx(tableNames.chats).where({ id: chatID, user_id: userID }).delete();
            await trx(tableNames.messages).where({ chat_id: chatID, user_id: userID }).delete();
            await trx(tableNames.summaries).where({ chat_id: chatID }).delete();
            await trx(tableNames.tokenCount).where({ chat_id: chatID }).delete();
            await trx(tableNames.deletedChats)
                .insert({ id: chatID, user_id: userID, deleted_at: new Date() });
        });
    }

    public async getDeletedChatIDs(userID: string): Promise<string[]> {
        const rows = await this.knex(tableNames.deletedChats)
            .where('user_id', userID)
            .select();
        return rows.map((row: any) => row.id);
    }

    protected async loadYDoc(userID: string) {
        const Y = await import('yjs');

        const ydoc = new Y.Doc();

        const updates = await this.knex(tableNames.yjsUpdates)
            .where('user_id', userID)
            .select();

        updates.forEach((updateRow: any) => {
            try {
                const update = new Uint8Array(updateRow.update);
                if (update.byteLength > 4) {
                    Y.applyUpdate(ydoc, update);
                }
            } catch (e) {
                console.error('failed to apply update', updateRow, e);
            }
        });

        const merged = Y.encodeStateAsUpdate(ydoc);

        if (updates.length) {
            // In a transaction, insert the merged update, then delete all previous updates (lower ID).
            // This needs to be done together in a transaction to avoid consistency errors or data loss!
            await this.knex.transaction(async (trx) => {
                await trx(tableNames.yjsUpdates)
                    .insert({
                        user_id: userID,
                        update: Buffer.from(merged),
                    });

                await trx(tableNames.yjsUpdates)
                    .where('user_id', userID)
                    .where('id', '<', updates[updates.length - 1].id)
                    .delete();
            });
        }
        
        return ydoc;
    }

    public async saveYUpdate(userID: string, update: Uint8Array): Promise<void> {
        if (update.byteLength <= 4) {
            return;
        }
        await this.knex(tableNames.yjsUpdates)
            .insert({
                user_id: userID,
                update: Buffer.from(update),
            });
    }

    public async saveSummary(summaryID: string, userID: string, campaignID: string, chatID: string, messageIDs: string[], summary: string): Promise<void> {
        await this.knex(tableNames.summaries).insert({
            id: summaryID,
            user_id: userID,
            campaign_id: campaignID,
            chat_id: chatID, 
            message_ids: JSON.stringify(messageIDs), 
            summary
        });  
    }
    

    public async getSummaries(userID: string, campaignID: string, chatID: string): Promise<{chatID: string, messageIDs: string[], summary: string}[]> {
        try {
            const rows = await this.knex(tableNames.summaries)
                .where('user_id', userID)
                .andWhere('campaign_id', campaignID) 
                .andWhere('chat_id', chatID);
            for (let row of rows) {
                row.messageIDs = JSON.parse(row.message_ids);
            }
            return rows;
        } catch (error) {
            console.error("Error fetching summaries:", error);
            throw new Error("Unable to fetch summaries due to an internal error");
        }
    }

    public async saveTokensSinceLastSummary(userID: string, campaignID: string, chatID: string, tokenCount: number, lastSummarizedMessageID?: string | null): Promise<void> {
        const existingRecord = await this.knex(tableNames.tokenCount)
            .where('user_id', userID)
            .andWhere('campaign_id', campaignID)
            .andWhere('chat_id', chatID)
            .first();
        
        const data: {
            user_id: string;
            campaign_id: string;
            chat_id: string;
            token_count: number;
            last_summarized_message_id?: string;
        } = {
            user_id: userID,
            campaign_id: campaignID,
            chat_id: chatID,
            token_count: tokenCount,
        };
    
        if (lastSummarizedMessageID !== undefined && lastSummarizedMessageID !== null) {
            data.last_summarized_message_id = lastSummarizedMessageID;
        }
        
        if (existingRecord) {
            console.log("saveTokensSinceLastSummary existing record found")
            await this.knex(tableNames.tokenCount)
                .where('user_id', userID)
                .andWhere('campaign_id', campaignID)
                .andWhere('chat_id', chatID)
                .update(data);
        } else {
            console.log("saveTokensSinceLastSummary existing record not found, inserting")
            await this.knex(tableNames.tokenCount).insert(data);
        }  
    }
    

    public async getTokensSinceLastSummary(userID: string, campaignID: string, chatID: string): Promise<{ tokenCount: number | undefined, lastSummarizedMessageID: string | undefined}> {
        const row = await this.knex(tableNames.tokenCount)
            .where('user_id', userID)
            .andWhere('campaign_id', campaignID)
            .andWhere('chat_id', chatID)
            .first();  // Get the first matching row
    
        // Check if there's no matching row
        if (!row) {
            return {
                tokenCount: undefined, 
                lastSummarizedMessageID: undefined
            };
        }
        console.log("row found: ", row)
    
        return {
            tokenCount: row.token_count,
            lastSummarizedMessageID: row.last_summarized_message_id
        };
    }
    
    public async saveCampaign(userID: string, campaignID: string, title: string, description: string): Promise<void> {
        await this.knex(tableNames.campaigns).insert({
            id: campaignID,
            user_id: userID,
            title,
            description,
            data: JSON.stringify({}),
        });
    }

    public async getCampaigns(userID: string): Promise<{ id: string; title: string; description: string }[]> {
        const rows = await this.knex(tableNames.campaigns)
            .where('user_id', userID)
            .select();
        return rows.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description,
        }));
    }

    public async getCampaign(userID: string, campaignID: string): Promise<{ id: string; title: string; description: string; data: string }> {
        const row = await this.knex(tableNames.campaigns)
            .where('user_id', userID)
            .andWhere('id', campaignID)
            .first();
        if (!row) {
            throw new Error('campaign not found');
        }
        return {
            id: row.id,
            title: row.title,
            description: row.description,
            data: row.data,
        };
    }

    public async deleteCampaign(userID: string, campaignID: string): Promise<void> {
        // TODO: delete all chats, messages, etc. associated with this campaign
        await this.knex(tableNames.campaigns)
            .where('user_id', userID)
            .andWhere('id', campaignID)
            .delete();

        await this.knex(tableNames.storyElements)
            .where('user_id', userID)
            .andWhere('campaign_id', campaignID)
            .delete();

        await this.knex(tableNames.summaries)
            .where('user_id', userID)
            .andWhere('campaign_id', campaignID)
            .delete();
        
 /*        const chatsToDelete: string[] = await this.knex(tableNames.chats)
            .where('user_id', userID)
            .andWhere('campaign_id', campaignID)

        for (let chatID of chatsToDelete) {
            await this.deleteChatAndRelatedData(userID, chatID);
        }   */ 

    }

    public async saveStoryElement(userID: string, campaignID: string, storyElementID: string, type: string, name: string, description: string, associations: string[]): Promise<void> {
        try {
            const existingElement = await this.knex(tableNames.storyElements)
                .where('id', storyElementID)
                .first();
    
            if (existingElement) {
                // Update existing story element
                await this.knex(tableNames.storyElements)
                    .where('id', storyElementID)
                    .update({
                        user_id: userID,
                        campaign_id: campaignID,
                        type: type,
                        name: name,
                        description: description,
                        associations: JSON.stringify(associations)
                    });
            } else {
                // Insert new story element
                await this.knex(tableNames.storyElements)
                    .insert({
                        id: storyElementID,
                        user_id: userID,
                        campaign_id: campaignID,
                        type: type,
                        name: name,
                        description: description,
                        associations: JSON.stringify(associations)
                    });
            }
        } catch (error) {
            console.error("Error saving story element:", error);
            throw new Error("Unable to save story element due to an internal error");
        }
    }
    
    
    public async getStoryElements(userID: string, campaignID: string): Promise<{id: string, userID: string, campaignID: string, type: string, name: string, description: string, associations: any[]}[]> {
        try {
            const rows = await this.knex(tableNames.storyElements)
                .where('user_id', userID)
                .andWhere('campaign_id', campaignID);
            
            for (let row of rows) {
                row.associations = JSON.parse(row.associations);
            }
            
            return rows;
        } catch (error) {
            console.error("Error fetching story elements:", error);
            throw new Error("Unable to fetch story elements due to an internal error");
        }
    }
    
    
}