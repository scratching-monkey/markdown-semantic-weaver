import { singleton, inject, container } from "tsyringe";
import * as path from 'path';
import * as vscode from 'vscode';
import { LocalIndex, QueryResult } from 'vectra';
import type { IndexItem } from 'vectra';
import { SessionManager } from './SessionManager.js';
import { LoggerService } from './LoggerService.js';

export type { IndexItem };

@singleton()
export class VectorStoreService {
    private index: LocalIndex | undefined;
    private sessionManager: SessionManager | undefined;

    public constructor(
        @inject(LoggerService) private logger: LoggerService
    ) {
        this.logger.info('VectorStoreService initialized.');
    }

    public initialize(sessionManager: SessionManager): void {
        this.sessionManager = sessionManager;
        this.sessionManager.onSessionWillEnd(this.clear.bind(this));
        this.logger.info('VectorStoreService is subscribed to sessionWillEnd event.');
    }

    private async getIndex(): Promise<LocalIndex> {
        if (this.index) {
            return this.index;
        }

        const sessionUri = this.getSessionUri();
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

    public getSessionUri(): vscode.Uri | null {
        if (!this.sessionManager || !this.sessionManager.isSessionActive()) {
            return null;
        }
        const tempDir = require('os').tmpdir();
        const path = require('path');
        return vscode.Uri.file(path.join(tempDir, 'markdown-semantic-weaver', this.sessionManager.getState().sessionId));
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

            const updatedMetadata = { ...item.metadata, ...metadata };
            await index.upsertItem({ ...item, metadata: updatedMetadata as Record<string, any> });
            this.logger.info(`Updated metadata for item ${id}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error updating item metadata for ${id}: ${errorMessage}`);
            throw error;
        }
    }

    public async getAllItems(): Promise<IndexItem[]> {
        try {
            const index = await this.getIndex();
            const items = await index.listItems();
            this.logger.info(`Retrieved ${items.length} items from index.`);
            return items;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error getting all items from index: ${errorMessage}`);
            return [];
        }
    }

    public async clear(): Promise<void> {
        const sessionUri = this.getSessionUri();
        if (sessionUri) {
            try {
                await vscode.workspace.fs.delete(sessionUri, { recursive: true });
                this.logger.info(`Cleared vector store at ${sessionUri.fsPath}`);
            } catch (error) {
                // It's possible the directory doesn't exist, which is fine.
                if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
                    this.logger.info(`Vector store directory not found at ${sessionUri.fsPath}, nothing to clear.`);
                } else {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Error clearing vector store at ${sessionUri.fsPath}: ${errorMessage}`);
                }
            }
        }
        this.index = undefined;
        this.logger.info('In-memory index instance cleared.');
    }
}
