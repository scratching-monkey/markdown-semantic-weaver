import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { DataAccessService } from "../services/DataAccessService.js";
import { DestinationDocumentManager } from "../services/DestinationDocumentManager.js";
import { ContentBlock } from "../models/ContentBlock.js";

@injectable()
export class AddContentBlockHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.addContentBlock';

    constructor(
        @inject(DataAccessService) private dataAccessService: DataAccessService,
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager
    ) {}

    public async execute(params: { target: ContentBlock, newBlock: any }) {
        const { target: targetItem, newBlock } = params;

        if (!targetItem || !targetItem.path) {
            return;
        }

        const targetDocUri = vscode.Uri.parse(targetItem.metadata.source);

        const document = this.documentManager.getActive();
        if (document && document.uri.toString() === targetDocUri.toString()) {
            // Insert the new block after the target item
            const targetPath = [...targetItem.path.slice(0, -1), targetItem.path[targetItem.path.length - 1] + 1];
            const newAst = this.dataAccessService.computeAstWithNewBlock(document.ast, targetPath, newBlock);
            await this.documentManager.updateAst(targetDocUri, newAst);
        }
    }
}
