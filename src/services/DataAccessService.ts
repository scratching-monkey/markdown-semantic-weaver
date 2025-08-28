import * as vscode from 'vscode';
import { SessionManager } from './SessionManager';

export class DataAccessService {
    private static instance: DataAccessService;

    private constructor(private sessionManager: SessionManager) {}

    public static getInstance(sessionManager: SessionManager): DataAccessService {
        if (!DataAccessService.instance) {
            DataAccessService.instance = new DataAccessService(sessionManager);
        }
        return DataAccessService.instance;
    }

    // Placeholder for future implementation
    public async getSimilarityGroups(): Promise<any[]> {
        console.log("DataAccessService: getSimilarityGroups called");
        return [];
    }
}
