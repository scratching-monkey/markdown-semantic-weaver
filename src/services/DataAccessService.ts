import * as vscode from 'vscode';
import { SessionManager } from './SessionManager.js';
import { VectorStoreService } from './VectorStoreService.js';

export class DataAccessService {
    private static instance: DataAccessService;

    private constructor(private sessionManager: SessionManager, private vectorStore: VectorStoreService) {}

    public static getInstance(sessionManager: SessionManager, vectorStore: VectorStoreService): DataAccessService {
        if (!DataAccessService.instance) {
            DataAccessService.instance = new DataAccessService(sessionManager, vectorStore);
        }
        return DataAccessService.instance;
    }

    // Placeholder for future implementation
    public async getSimilarityGroups(): Promise<any[]> {
        console.log("DataAccessService: getSimilarityGroups called");
        return [];
    }
}
