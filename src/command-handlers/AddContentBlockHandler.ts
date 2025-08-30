import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { DataAccessService } from "../services/core/DataAccessService.js";
import { DestinationDocumentManager } from "../services/core/DestinationDocumentManager.js";
import { ContentBlock } from "../models/ContentBlock.js";
import { MarkdownASTParser } from "../services/processing/MarkdownASTParser.js";

@injectable()
export class AddContentBlockHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.addContentBlock';

    constructor(
        @inject(DataAccessService) private dataAccessService: DataAccessService,
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager,
        @inject(MarkdownASTParser) private markdownParser: MarkdownASTParser
    ) {}

    public async execute(params: { target: ContentBlock, newBlock: ContentBlock }) {
        const { target: targetItem, newBlock } = params;

        if (!targetItem || !targetItem.path) {
            return;
        }

        const targetDocUri = vscode.Uri.parse(targetItem.metadata.source);

        const document = this.documentManager.getActive();
        if (document && document.uri.toString() === targetDocUri.toString()) {
            // Parse the new block's content into an AST
            const newBlockAst = this.markdownParser.parse(newBlock.rawContent);
            if (newBlockAst.children.length === 0) {
                return; // Empty content
            }

            // Insert the new block after the target item
            const targetPath = [...targetItem.path.slice(0, -1), targetItem.path[targetItem.path.length - 1] + 1];
            const newAst = this.dataAccessService.computeAstWithNewBlock(document.ast, targetPath, newBlockAst);
            await this.documentManager.updateAst(targetDocUri, newAst);
        }
    }
}
