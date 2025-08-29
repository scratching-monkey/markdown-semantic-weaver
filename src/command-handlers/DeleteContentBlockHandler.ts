import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { DataAccessService } from "../services/core/DataAccessService.js";
import { DestinationDocumentManager } from "../services/core/DestinationDocumentManager.js";
import { ContentBlock } from "../models/ContentBlock.js";

@injectable()
export class DeleteContentBlockHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.deleteContentBlock';

    constructor(
        @inject(DataAccessService) private dataAccessService: DataAccessService,
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager
    ) {}

    public async execute(item: ContentBlock): Promise<void> {
        if (item && item.path && item.metadata && item.metadata.source) {
            const documentUri = vscode.Uri.parse(item.metadata.source);
            const document = this.documentManager.getActive();
            if (document && document.uri.toString() === documentUri.toString()) {
                const newAst = this.dataAccessService.computeAstWithBlockDeleted(document.ast, item.path);
                await this.documentManager.updateAst(documentUri, newAst);
            }
        }
    }
}
