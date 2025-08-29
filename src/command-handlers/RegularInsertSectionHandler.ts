import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { LoggerService } from '../services/LoggerService.js';
import { DataAccessService } from '../services/DataAccessService.js';
import { DestinationDocumentManager } from '../services/DestinationDocumentManager.js';
import { AstService } from '../services/AstService.js';
import { MarkdownASTParser } from '../services/MarkdownASTParser.js';
import type { Root } from 'mdast';

@injectable()
export class RegularInsertSectionHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.insertSection';

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(DataAccessService) private dataAccessService: DataAccessService,
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager,
        @inject(AstService) private astService: AstService,
        @inject(MarkdownASTParser) private markdownParser: MarkdownASTParser
    ) {}

    public async execute(section: any): Promise<void> {
        try {
            if (!section) {
                vscode.window.showErrorMessage('No section selected for insertion');
                return;
            }

            // Get the active destination document
            const activeDocument = this.documentManager.getActive();
            if (!activeDocument) {
                vscode.window.showErrorMessage('No active destination document found');
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

            vscode.window.showInformationMessage(`Section inserted into ${activeDocument.uri.toString()}`);
            this.logger.info(`Inserted section into document ${activeDocument.uri.toString()}`);

        } catch (error) {
            this.logger.error(`Failed to insert section: ${error}`);
            vscode.window.showErrorMessage('Failed to insert section');
        }
    }
}