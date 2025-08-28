import * as path from 'path';
import * as vscode from 'vscode';
import { LocalIndex, IndexItem, QueryResult } from 'vectra';
import { SessionManager } from './SessionManager';
import { LoggerService } from './LoggerService';

export class VectorStoreService {
    private static instance: VectorStoreService;
    private logger: LoggerService;
    private sessionManager: SessionManager;
    private index: LocalIndex | undefined;

    private constructor(sessionManager: SessionManager, logger: LoggerService) {
        this.sessionManager = sessionManager;
        this.logger = logger;
        this.logger.info('VectorStoreService initialized.');
    }

    public static getInstance(sessionManager: SessionManager, logger: LoggerService): VectorStoreService {
        if (!VectorStoreService.instance) {
            VectorStoreService.instance = new VectorStoreService(sessionManager, logger);
        }
        return VectorStoreService.instance;
    }

    private async getIndex(): Promise<LocalIndex> {
        if (this.index) {
            return this.index;
        }

        const sessionUri = this.sessionManager.getSessionUri();
        if (!sessionUri) {
            const message = 'Session URI not available. Cannot initialize vector store.';
            this.logger.error(message);
            vscode.window.showErrorMessage(message);
            throw new Error(message);
        }

        const indexDir = path.join(sessionUri.fsPath, '.index');
        this.index = new LocalIndex(indexDir);

        if (!await this.index.isIndexCreated()) {
            await this.index.createIndex();
            this.logger.info(`Index created at ${indexDir}`);
        } else {
            this.logger.info(`Existing index found at ${indexDir}`);
        }

        return this.index;
    }

    public async addItems(items: IndexItem[]): Promise<void> {
        try {
            const index = await this.getIndex();
            for (const item of items) {
                await index.insertItem(item);
            }
            this.logger.info(`${items.length} items added to index.`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error adding items to index: ${errorMessage}`);
            throw error;
        }
    }

    public async query(vector: number[], topK: number): Promise<QueryResult[]> {
        try {
            const index = await this.getIndex();
            // The query parameter is not used in our case, so we pass an empty string.
            const results = await index.queryItems(vector, "", topK);
            this.logger.info(`Query returned ${results.length} results.`);
            return results;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error querying index: ${errorMessage}`);
            return [];
        }
    }

    public async getItem(id: string): Promise<IndexItem | undefined> {
        try {
            const index = await this.getIndex();
            const item = await index.getItem(id);
            return item;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error getting item ${id}: ${errorMessage}`);
            return undefined;
        }
    }

    public async updateItemMetadata(id: string, metadata: Partial<IndexItem['metadata']>): Promise<void> {
        try {
            const index = await this.getIndex();
            const item = await index.getItem(id);

            if (!item) {
                this.logger.warn(`Attempted to update non-existent item with id: ${id}`);
                return;
            }

            // Vectra doesn't support in-place metadata updates, so we delete and re-insert.
            await index.deleteItem(id);

            const updatedItem = {
                ...item,
                metadata: {
                    ...item.metadata,
                    ...metadata,
                }
            };

            await index.insertItem(updatedItem as IndexItem);
            this.logger.info(`Successfully updated metadata for item ${id}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error updating metadata for item ${id}: ${errorMessage}`);
            throw error;
        }
    }

    public async getAllItems(): Promise<IndexItem[]> {
        try {
            const index = await this.getIndex();
            const items = await index.listItems();
            return items as IndexItem[];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error getting all items: ${errorMessage}`);
            return [];
        }
    }
}
