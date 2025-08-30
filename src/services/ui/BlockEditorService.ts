import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import type { Root } from 'mdast';
import { LoggerService } from '../utilities/LoggerService.js';
import { SessionManager } from '../core/SessionManager.js';
import { DataAccessService } from '../core/DataAccessService.js';
import { DestinationDocumentManager } from '../core/DestinationDocumentManager.js';
import { MarkdownASTParser } from '../processing/MarkdownASTParser.js';
import { AstService } from '../core/AstService.js';

interface BlockEditorSession {
    documentUri: vscode.Uri;
    contentBlockId: string;
    documentUriString: string;
    originalContent: string;
}

@singleton()
export class BlockEditorService {
    private activeEditors = new Map<string, BlockEditorSession>();

    public constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(SessionManager) private sessionManager: SessionManager,
        @inject(DataAccessService) private dataAccessService: DataAccessService,
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager,
        @inject(MarkdownASTParser) private markdownParser: MarkdownASTParser,
        @inject(AstService) private astService: AstService
    ) {
        // Listen for document close events to save changes
        vscode.workspace.onDidCloseTextDocument(document => {
            this.handleDocumentClosed(document);
        });
    }

    /**
     * Opens a block editor for the specified content block
     */
    public async openBlockEditor(documentUri: vscode.Uri, contentBlockId: string): Promise<void> {
        try {
            // Get the content block from the document
            const contentBlocks = this.dataAccessService.getDocumentContent(documentUri);
            const contentBlock = contentBlocks.find(block => block.id === contentBlockId);

            if (!contentBlock) {
                throw new Error(`Content block ${contentBlockId} not found in document ${documentUri.toString()}`);
            }

            // Create a temporary document
            const document = await vscode.workspace.openTextDocument({
                content: contentBlock.rawContent,
                language: 'markdown'
            });

            // Track this editor session
            const session: BlockEditorSession = {
                documentUri,
                contentBlockId,
                documentUriString: documentUri.toString(),
                originalContent: contentBlock.rawContent
            };

            this.activeEditors.set(document.uri.toString(), session);

            // Show the document
            await vscode.window.showTextDocument(document);

            this.logger.info(`Opened block editor for content block ${contentBlockId}`);

        } catch (error) {
            this.logger.error(`Failed to open block editor: ${error}`);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to open block editor: ${errorMessage}`);
        }
    }

    /**
     * Handles when a temporary document is closed
     */
    private async handleDocumentClosed(document: vscode.TextDocument): Promise<void> {
        const session = this.activeEditors.get(document.uri.toString());
        if (!session) {
            return; // Not a block editor document
        }

        try {
            // Check if content has changed
            const currentContent = document.getText();
            if (currentContent !== session.originalContent) {
                // Content has changed, we need to update the AST
                await this.updateContentBlock(session, currentContent);
            }

            // Clean up the session
            this.activeEditors.delete(document.uri.toString());
            this.logger.info(`Closed block editor for content block ${session.contentBlockId}`);

        } catch (error) {
            this.logger.error(`Failed to save block editor changes: ${error}`);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to save changes: ${errorMessage}`);
        }
    }

    /**
     * Updates the content block in the AST
     */
    private async updateContentBlock(session: BlockEditorSession, newContent: string): Promise<void> {
        try {
            // Get the document
            const document = this.documentManager.getActive();
            if (!document) {
                throw new Error('No active destination document found');
            }

            // Get the content blocks to find the one we're updating
            const contentBlocks = this.dataAccessService.getDocumentContent(session.documentUri);
            const contentBlock = contentBlocks.find(block => block.id === session.contentBlockId);

            if (!contentBlock) {
                throw new Error(`Content block ${session.contentBlockId} not found`);
            }

            // Parse the new content as Markdown AST
            const newContentAst = this.markdownParser.parse(newContent);
            if (newContentAst.children.length === 0) {
                throw new Error('New content is empty or invalid');
            }

            // For now, we'll replace the entire content with the new content
            // In a more sophisticated implementation, we could try to preserve
            // the structure and only update the specific node
            const newAst: Root = {
                type: 'root',
                children: newContentAst.children
            };

            // Update the document AST
            await this.documentManager.updateAst(session.documentUri, newAst);

            this.logger.info(`Updated content block ${session.contentBlockId} with new content (length: ${newContent.length})`);
        } catch (error) {
            this.logger.error(`Failed to update content block: ${error}`);
            throw error;
        }
    }

    /**
     * Checks if a document is currently being edited in a block editor
     */
    public isBlockEditorDocument(documentUri: vscode.Uri): boolean {
        return this.activeEditors.has(documentUri.toString());
    }

    /**
     * Gets the session for a block editor document
     */
    public getBlockEditorSession(documentUri: vscode.Uri): BlockEditorSession | undefined {
        return this.activeEditors.get(documentUri.toString());
    }
}
