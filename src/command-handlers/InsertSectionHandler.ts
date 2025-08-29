import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { DataAccessService } from "../services/DataAccessService.js";
import { DestinationDocumentManager } from "../services/DestinationDocumentManager.js";
import { MarkdownASTParser } from "../services/MarkdownASTParser.js";
import { SourceSection } from "../models/SourceSection.js";

@injectable()
export class InsertSectionHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.insertSection';

    constructor(
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager,
        @inject(DataAccessService) private dataAccessService: DataAccessService,
        @inject(MarkdownASTParser) private markdownASTParser: MarkdownASTParser
    ) {}

    public async execute(item: SourceSection) {
        const activeDocumentUri = this.documentManager.getActiveUri();
        if (!activeDocumentUri) {
            vscode.window.showErrorMessage("No active destination document.");
            return;
        }

        const document = this.documentManager.getActive();
        if (!document) {
            vscode.window.showErrorMessage("Could not find the active document's data.");
            return;
        }

        const newBlock = this.markdownASTParser.parse(item.content).children[0];
        const newAst = this.dataAccessService.computeAstWithNewBlock(document.ast, [document.ast.children.length], newBlock);
        await this.documentManager.updateAst(activeDocumentUri, newAst);
    }
}
