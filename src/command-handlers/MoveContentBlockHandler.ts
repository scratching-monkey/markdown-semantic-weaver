import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { DataAccessService } from "../services/core/DataAccessService.js";
import { DestinationDocumentManager } from "../services/core/DestinationDocumentManager.js";
import { ContentBlock } from "../models/ContentBlock.js";

@injectable()
export class MoveContentBlockHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.moveContentBlock';

    constructor(
        @inject(DataAccessService) private dataAccessService: DataAccessService,
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager
    ) {}

    public async execute(params: { source: ContentBlock, target: ContentBlock }) {
        const { source: sourceItem, target: targetItem } = params;

        if (!sourceItem || !sourceItem.path || !targetItem || !targetItem.path) {
            return;
        }

        const sourceDocUri = vscode.Uri.parse(sourceItem.metadata.source);
        const targetDocUri = vscode.Uri.parse(targetItem.metadata.source);

        if (sourceDocUri.toString() !== targetDocUri.toString()) {
            vscode.window.showErrorMessage("Moving content between different documents is not supported.");
            return;
        }

        const document = this.documentManager.getActive();
        if (document && document.uri.toString() === sourceDocUri.toString()) {
            // Adjust destination path to be after the target item
            const destinationPath = [...targetItem.path.slice(0, -1), targetItem.path[targetItem.path.length - 1] + 1];
            const newAst = this.dataAccessService.computeAstWithBlockMoved(document.ast, sourceItem.path, destinationPath);
            await this.documentManager.updateAst(sourceDocUri, newAst);
        }
    }
}
