import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from './ICommandHandler.js';
import { BlockEditorService } from '../services/ui/BlockEditorService.js';
import { LoggerService } from '../services/utilities/LoggerService.js';
import { SessionManager } from '../services/core/SessionManager.js';

@singleton()
export class EditContentBlockHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.editContentBlock';

    public constructor(
        @inject(BlockEditorService) private blockEditorService: BlockEditorService,
        @inject(LoggerService) private logger: LoggerService,
        @inject(SessionManager) private sessionManager: SessionManager
    ) {}

    public async execute(contentBlockId: string, documentUri?: vscode.Uri): Promise<void> {
        try {
            this.logger.info(`Executing editContentBlock command for block: ${contentBlockId}`);

            // Get the active document
            const activeDocument = documentUri || this.getActiveDocument();

            if (!activeDocument) {
                vscode.window.showErrorMessage('No active destination document found. Please select a document in the Destination Documents view.');
                return;
            }

            // Open the block editor
            await this.blockEditorService.openBlockEditor(activeDocument, contentBlockId);

        } catch (error) {
            this.logger.error(`Failed to execute editContentBlock command: ${error}`);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to open block editor: ${errorMessage}`);
        }
    }

    /**
     * Gets the active destination document URI
     */
    private getActiveDocument(): vscode.Uri | null {
        // Get from session manager's active document
        const sessionState = this.sessionManager.getState();
        if (sessionState.activeDestinationDocumentUri) {
            return sessionState.activeDestinationDocumentUri;
        }

        // Fallback: try to get from active text editor
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            return activeEditor.document.uri;
        }

        return null;
    }
}
