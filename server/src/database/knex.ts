import { validate as validateEmailAddress } from 'email-validator';
import { Knex, knex as KnexClient } from 'knex';
import Database from "./index";
import { config } from '../config';

const tableNames = {
    authentication: 'authentication',
    chats: 'chats',
    deletedChats: 'deleted_chats',
    messages: 'messages',
    shares: 'shares',
    yjsUpdates: 'updates',
    summaries: 'summaries',
    tokenCount: 'token_count'
};

export default class KnexDatabaseAdapter extends Database {
    private knex = KnexClient(this.knexConfig);

    constructor(private knexConfig: Knex.Config = config.database) {
        super();
    }

    public async initialize() {
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

        await this.createTableIfNotExists(tableNames.chats, (table) => {
            table.text('id').primary();
            table.text('user_id');
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
            table.text('chat_id'); // STABILITY: add foreign key stuff here
            table.text('message_ids'); 
            table.text('summary'); 
        });

        await this.createTableIfNotExists(tableNames.tokenCount, (table) => {
            table.text('user_id');
            table.text('chat_id'); // STABILITY: add foreign key stuff here
            table.integer('token_count'); 
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

    public async deleteChat(userID: string, chatID: string): Promise<any> {
        await this.knex.transaction(async (trx) => {
            await trx(tableNames.chats).where({ id: chatID, user_id: userID }).delete();
            await trx(tableNames.messages).where({ chat_id: chatID, user_id: userID }).delete();
            await trx(tableNames.summaries).where({ chat_id: chatID }).delete();
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

    public async saveSummary(summaryID: string, userID: string, chatID: string, messageIDs: string[], summary: string): Promise<void> {
        console.log("save summary api called by knex.ts. Input parameters: ", summaryID, userID, chatID, messageIDs, summary)
        await this.knex(tableNames.summaries).insert({
            id: summaryID,
            user_id: userID, 
            chat_id: chatID, 
            message_ids: JSON.stringify(messageIDs), 
            summary
        });  
    }
    

    public async getSummaries(userID: string, chatID: string): Promise<{ userID: string, chatID: string, messageIDs: string[], summary: string}[]> {
        const rows = await this.knex(tableNames.summaries)
            .where('user_id', userID) 
            .andWhere('chat_id', chatID); 
        for (let row of rows) {
            row.messageIDs = JSON.parse(row.message_ids);
        }
        return rows;
    }
    
    public async saveTokensSinceLastSummary(userID: string, chatID: string, tokenCount: number): Promise<void> {
        const existingRecord = await this.knex(tableNames.tokenCount)
            .where('user_id', userID)
            .andWhere('chat_id', chatID)
            .first();
        
        if (existingRecord) {
            // Update the existing record's token_count
            await this.knex(tableNames.tokenCount)
                .where('user_id', userID)
                .andWhere('chat_id', chatID)
                .update({
                    token_count: tokenCount
                });
        } else {
            // Insert a new record
            await this.knex(tableNames.tokenCount).insert({
                user_id: userID,
                chat_id: chatID,
                token_count: tokenCount
            });
        }  
    }
    

    public async getTokensSinceLastSummary(userID: string, chatID: string): Promise<number> {
        const rows = await this.knex(tableNames.tokenCount)
            .select('token_count')  // Select only the 'token_count' column
            .where('user_id', userID) 
            .andWhere('chat_id', chatID)
            .first();  // Get the first matching row
    
            return rows.token_count;
    }
    
}