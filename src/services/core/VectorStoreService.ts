import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { LocalIndex, QueryResult } from 'vectra';
import type { IndexItem } from 'vectra';
import { SessionManager } from './SessionManager.js';
import { LoggerService } from '../utilities/LoggerService.js';
import {
    VectorStoreErrorHandler,
    SessionUriManager,
    VECTOR_STORE_CONSTANTS,
    type VectorStoreMetadata,
    type TypedIndexItem
} from '../vector-store/index.js';

export type { IndexItem, VectorStoreMetadata, TypedIndexItem };

@singleton()
export class VectorStoreService {
    private index: LocalIndex | undefined;
    private sessionUriManager: SessionUriManager | undefined;
    private errorHandler: VectorStoreErrorHandler;

    public constructor(
        @inject(LoggerService) private logger: LoggerService
    ) {
        this.errorHandler = new VectorStoreErrorHandler(logger);
        this.logger.info('VectorStoreService initialized.');
    }

    public initialize(sessionManager: SessionManager): void {
        this.sessionUriManager = new SessionUriManager(sessionManager);
        sessionManager.onSessionWillEnd(this.clear.bind(this));
        this.logger.info('VectorStoreService is subscribed to sessionWillEnd event.');
    }

    private async getIndex(): Promise<LocalIndex> {
        if (this.index) {
            return this.index;
        }

        try {
            const sessionUri = this.sessionUriManager?.validateSessionUri();
            if (!sessionUri) {
                throw new Error(VECTOR_STORE_CONSTANTS.ERROR_MESSAGES.SESSION_URI_NOT_AVAILABLE);
            }

            const indexPath = this.sessionUriManager?.getIndexPath();
            if (!indexPath) {
                throw new Error(VECTOR_STORE_CONSTANTS.ERROR_MESSAGES.SESSION_URI_NOT_AVAILABLE);
            }

            this.index = new LocalIndex(indexPath);

            if (!await this.index.isIndexCreated()) {
                await this.index.createIndex();
                this.errorHandler.logSuccess('Index created', `at ${indexPath}`);
            } else {
                this.errorHandler.logSuccess('Existing index found', `at ${indexPath}`);
            }

            return this.index;
        } catch (error) {
            this.errorHandler.handleError('getIndex', error);
            throw error; // Re-throw the error to ensure the promise is rejected
        }
    }

    public getSessionUri(): vscode.Uri | null {
        return this.sessionUriManager?.getSessionUri() ?? null;
    }

    public async addItems(items: IndexItem[]): Promise<void> {
        try {
            const index = await this.getIndex();
            for (const item of items) {
                await index.insertItem(item);
            }
            this.errorHandler.logSuccess('Items added to index', `${items.length} items`);
        } catch (error) {
            this.errorHandler.handleError('addItems', error);
        }
    }

    public async query(vector: number[], topK: number): Promise<QueryResult[]> {
        try {
            const index = await this.getIndex();
            const results = await index.queryItems(vector, "", topK);
            this.errorHandler.logSuccess('Query completed', `${results.length} results`);
            return results;
        } catch (error) {
            return this.errorHandler.handleErrorWithDefault('query', error, [], `vector length: ${vector.length}, topK: ${topK}`);
        }
    }

    public async getItem(id: string): Promise<IndexItem | undefined> {
        try {
            const index = await this.getIndex();
            const item = await index.getItem(id);
            return item;
        } catch (error) {
            return this.errorHandler.handleErrorWithDefault('getItem', error, undefined, `id: ${id}`);
        }
    }

    public async updateItemMetadata(id: string, metadata: Partial<VectorStoreMetadata>): Promise<void> {
        try {
            const index = await this.getIndex();
            const item = await index.getItem(id);

            if (!item) {
                const message = VECTOR_STORE_CONSTANTS.ERROR_MESSAGES.ITEM_NOT_FOUND.replace('{id}', id);
                this.logger.warn(message);
                return;
            }

            const updatedMetadata = { ...item.metadata, ...metadata };
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ //Vectra's type system is restrictive, OK to use any
            await index.upsertItem({ ...item, metadata: updatedMetadata as any });
            this.errorHandler.logSuccess('Updated metadata', `for item ${id}`);
        } catch (error) {
            this.errorHandler.handleError('updateItemMetadata', error, `id: ${id}`);
        }
    }

    public async getAllItems(): Promise<IndexItem[]> {
        try {
            const index = await this.getIndex();
            const items = await index.listItems();
            this.errorHandler.logSuccess('Retrieved items', `${items.length} items`);
            return items;
        } catch (error) {
            return this.errorHandler.handleErrorWithDefault('getAllItems', error, []);
        }
    }

    public async updateItem(item: IndexItem): Promise<void> {
        try {
            const index = await this.getIndex();
            await index.upsertItem(item);
            this.errorHandler.logSuccess('Updated item', item.id);
        } catch (error) {
            this.errorHandler.handleError('updateItem', error, `id: ${item.id}`);
        }
    }

    public async deleteItem(id: string): Promise<void> {
        try {
            const index = await this.getIndex();
            await index.deleteItem(id);
            this.errorHandler.logSuccess('Deleted item', id);
        } catch (error) {
            this.errorHandler.handleError('deleteItem', error, `id: ${id}`);
        }
    }

    public async clear(): Promise<void> {
        const sessionUri = this.getSessionUri();
        if (sessionUri) {
            try {
                await vscode.workspace.fs.delete(sessionUri, { recursive: true });
                this.errorHandler.logSuccess('Cleared vector store', `at ${sessionUri.fsPath}`);
            } catch (error) {
                // It's possible the directory doesn't exist, which is fine.
                if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
                    const message = VECTOR_STORE_CONSTANTS.ERROR_MESSAGES.DIRECTORY_NOT_FOUND.replace('{path}', sessionUri.fsPath);
                    this.logger.info(message);
                } else {
                    this.errorHandler.handleError('clear', error, `path: ${sessionUri.fsPath}`);
                }
            }
        }

        this.index = undefined;
        this.logger.info('In-memory index instance cleared.');
    }
}
