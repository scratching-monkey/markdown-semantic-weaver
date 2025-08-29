import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { LoggerService } from './LoggerService.js';
import { TemporaryDocumentManager } from './TemporaryDocumentManager.js';
import { ContentPersistenceService } from './ContentPersistenceService.js';

@singleton()
export class AutoSaveManager {
    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(TemporaryDocumentManager) private documentManager: TemporaryDocumentManager,
        @inject(ContentPersistenceService) private persistenceService: ContentPersistenceService
    ) {
        // Listen for document close events to auto-save changes
        vscode.workspace.onDidCloseTextDocument(this.handleDocumentClosed.bind(this));
    }

    /**
     * Handles document close events to auto-save changes
     */
    private async handleDocumentClosed(document: vscode.TextDocument): Promise<void> {
        const metadata = this.documentManager.getMetadata(document.uri);
        if (!metadata) {
            return; // Not a managed document
        }

        try {
            const currentContent = document.getText();

            // Check if content has changed
            if (currentContent !== metadata.originalContent) {
                await this.persistenceService.saveContent(metadata, currentContent);
                this.logger.info(`Auto-saved changes for ${metadata.type} ${metadata.id}`);
            }

            // Clean up tracking
            this.documentManager.untrackDocument(document.uri);
        } catch (error) {
            this.logger.error(`Failed to auto-save changes: ${error}`);
            vscode.window.showErrorMessage('Failed to save changes');
        }
    }

    /**
     * Manually trigger save for a specific document
     */
    public async saveDocument(uri: vscode.Uri): Promise<void> {
        const document = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri.toString());
        if (!document) {
            throw new Error('Document not found');
        }

        await this.handleDocumentClosed(document);
    }
}
