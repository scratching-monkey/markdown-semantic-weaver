import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { LoggerService } from '../services/utilities/LoggerService.js';
import { DataAccessService } from '../services/core/DataAccessService.js';
import { DestinationDocumentManager } from '../services/core/DestinationDocumentManager.js';
import { AstService } from '../services/core/AstService.js';
import { MarkdownASTParser } from '../services/processing/MarkdownASTParser.js';
import type { Root } from 'mdast';

@injectable()
export class ComparisonInsertSectionHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver-comparison.insertSection';

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(DataAccessService) private dataAccessService: DataAccessService,
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager,
        @inject(AstService) private astService: AstService,
        @inject(MarkdownASTParser) private markdownParser: MarkdownASTParser
    ) {}

    public async execute(sectionId: string, _comparisonUri: vscode.Uri): Promise<void> { // eslint-disable-line @typescript-eslint/no-unused-vars
        try {
            if (!sectionId) {
                vscode.window.showErrorMessage('No section selected for insertion');
                return;
            }

            // Get the active destination document
            const activeDocument = this.documentManager.getActive();
            if (!activeDocument) {
                vscode.window.showErrorMessage('No active destination document found');
                return;
            }

            // Get the section content from the data access service
            const uniqueSections = await this.dataAccessService.getUniqueSections();
            const section = uniqueSections.find(s => s.id === sectionId);

            if (!section) {
                vscode.window.showErrorMessage('Section not found');
                return;
            }

            // Parse the section content into an AST
            const sectionAst = this.markdownParser.parse(section.content);
            if (sectionAst.children.length === 0) {
                vscode.window.showErrorMessage('Section content is empty');
                return;
            }

            // Get the current document AST
            const currentAst = activeDocument.ast;

            // For now, append the section to the end of the document
            // In a more sophisticated implementation, we could insert at a specific position
            const newAst: Root = {
                type: 'root',
                children: [...currentAst.children, ...sectionAst.children]
            };

            // Update the document AST
            await this.documentManager.updateAst(activeDocument.uri, newAst);

            // Mark the section as resolved in the vector store
            // TODO: Implement this when we have the resolution methods

            // Refresh the comparison view
            vscode.commands.executeCommand('markdown-semantic-weaver-comparison.refresh');

            vscode.window.showInformationMessage(`Section inserted into ${activeDocument.uri.toString()}`);
            this.logger.info(`Inserted section ${sectionId} into document ${activeDocument.uri.toString()}`);

        } catch (error) {
            this.logger.error(`Failed to insert section: ${error}`);
            vscode.window.showErrorMessage('Failed to insert section');
        }
    }
}