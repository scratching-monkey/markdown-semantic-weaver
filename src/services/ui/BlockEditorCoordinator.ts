import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { LoggerService } from './LoggerService.js';
import { TemporaryDocumentManager, DocumentMetadata } from './TemporaryDocumentManager.js';
import { EditorCoordinator } from './EditorCoordinator.js';
import { ContentBlock } from '../models/ContentBlock.js';
import { GlossaryTerm } from '../models/GlossaryTerm.js';

@singleton()
export class BlockEditorCoordinator {
    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(TemporaryDocumentManager) private documentManager: TemporaryDocumentManager,
        @inject(EditorCoordinator) private editorCoordinator: EditorCoordinator
    ) {}

    /**
     * Opens a temporary document for editing a content block
     */
    public async openContentBlockEditor(contentBlock: ContentBlock): Promise<void> {
        try {
            // Open and show the temporary editor
            const document = await this.editorCoordinator.openAndShowTemporaryEditor(
                contentBlock.rawContent,
                'markdown'
            );

            // Track this document for auto-save
            const metadata: DocumentMetadata = {
                type: 'contentBlock',
                id: contentBlock.id,
                originalContent: contentBlock.rawContent
            };

            this.documentManager.trackDocument(document.uri, metadata);

            this.logger.info(`Opened content block editor for block ${contentBlock.id}`);
        } catch (error) {
            this.logger.error(`Failed to open content block editor: ${error}`);
            vscode.window.showErrorMessage('Failed to open content block editor');
        }
    }

    /**
     * Opens a temporary document for editing a glossary term definition
     */
    public async openGlossaryTermEditor(term: GlossaryTerm): Promise<void> {
        try {
            // Open and show the temporary editor
            const document = await this.editorCoordinator.openAndShowTemporaryEditor(
                term.definition,
                'markdown'
            );

            // Track this document for auto-save
            const metadata: DocumentMetadata = {
                type: 'glossaryTerm',
                id: term.id,
                originalContent: term.definition
            };

            this.documentManager.trackDocument(document.uri, metadata);

            this.logger.info(`Opened glossary term editor for term ${term.term}`);
        } catch (error) {
            this.logger.error(`Failed to open glossary term editor: ${error}`);
            vscode.window.showErrorMessage('Failed to open glossary term editor');
        }
    }

    /**
     * Checks if a document is currently being managed by the block editor
     */
    public isManagedDocument(uri: vscode.Uri): boolean {
        return this.documentManager.isManaged(uri);
    }

    /**
     * Gets information about a managed document
     */
    public getManagedDocumentInfo(uri: vscode.Uri): DocumentMetadata | undefined {
        return this.documentManager.getMetadata(uri);
    }
}