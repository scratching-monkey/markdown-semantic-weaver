import { injectable } from 'tsyringe';
import * as vscode from 'vscode';
import { GlossaryWebviewMessage, AcceptTermData, EditTermData, RejectTermData, GlossaryTerm } from './GlossaryWebviewConfig.js';
import { DataAccessService } from '../core/DataAccessService.js';
import { LoggerService } from '../utilities/LoggerService.js';

@injectable()
export class GlossaryMessageHandler {
    constructor(
        private dataAccessService: DataAccessService,
        private logger: LoggerService,
        private webview?: vscode.Webview
    ) {}

    setWebview(webview: vscode.Webview): void {
        this.webview = webview;
    }

    async handleMessage(message: GlossaryWebviewMessage): Promise<void> {
        try {
            switch (message.type) {
                case 'acceptTerm':
                    await this.handleAcceptTerm(message.data as AcceptTermData);
                    break;
                case 'editTerm':
                    await this.handleEditTerm(message.data as EditTermData);
                    break;
                case 'rejectTerm':
                    await this.handleRejectTerm(message.data as RejectTermData);
                    break;
                default:
                    this.logger.warn(`GlossaryMessageHandler: Unknown message type: ${message.type}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`GlossaryMessageHandler: Error handling message ${message.type}: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to process action: ${errorMessage}`);
        }
    }

    private async handleAcceptTerm(data: AcceptTermData): Promise<void> {
        const { termId } = data;
        this.logger.info(`GlossaryMessageHandler: Accepting term ${termId}`);

        // Mark the term as resolved/accepted in the data store
        await this.dataAccessService.markTermAsResolved(termId);

        // Notify the webview that the term was updated
        this.notifyWebview({
            type: 'termUpdated',
            data: { termId, action: 'accepted' }
        });

        vscode.window.showInformationMessage('Term accepted and added to glossary.');
    }

    private async handleEditTerm(data: EditTermData): Promise<void> {
        const { termId } = data;
        this.logger.info(`GlossaryMessageHandler: Editing term ${termId}`);

        // Get the term details
        const terms = await this.dataAccessService.getUniqueTerms();
        const term = terms.find(t => t.id === termId);

        if (!term) {
            vscode.window.showErrorMessage('Term not found.');
            return;
        }

        // Show input boxes for editing term and definition
        const newTerm = await vscode.window.showInputBox({
            prompt: 'Edit term',
            value: term.term
        });

        if (newTerm === undefined) {
            return; // User cancelled
        }

        const newDefinition = await vscode.window.showInputBox({
            prompt: 'Edit definition',
            value: term.definition
        });

        if (newDefinition === undefined) {
            return; // User cancelled
        }

        // Update the term in the data store
        await this.dataAccessService.updateTermDefinition(termId, newTerm, newDefinition);

        // Notify the webview that the term was updated
        this.notifyWebview({
            type: 'termUpdated',
            data: {
                termId,
                term: { ...term, term: newTerm, definition: newDefinition }
            }
        });

        vscode.window.showInformationMessage('Term updated successfully.');
    }

    private async handleRejectTerm(data: RejectTermData): Promise<void> {
        const { termId } = data;
        this.logger.info(`GlossaryMessageHandler: Rejecting term ${termId}`);

        // Remove the term from the data store
        await this.dataAccessService.removeTerm(termId);

        // Notify the webview that the term was removed
        this.notifyWebview({
            type: 'termRemoved',
            data: { termId }
        });

        vscode.window.showInformationMessage('Term rejected and removed.');
    }

    private notifyWebview(message: unknown): void {
        if (this.webview) {
            this.webview.postMessage(message);
        }
    }

    // Additional helper methods for future extensibility
    async validateTermData(termId: string): Promise<GlossaryTerm | null> {
        const terms = await this.dataAccessService.getUniqueTerms();
        return terms.find(t => t.id === termId) || null;
    }

    async getTermStatistics(): Promise<{ accepted: number; rejected: number; pending: number }> {
        const terms = await this.dataAccessService.getUniqueTerms();
        // This would need to be implemented based on term status tracking
        return {
            accepted: 0, // Placeholder
            rejected: 0, // Placeholder
            pending: terms.length // Placeholder
        };
    }
}
