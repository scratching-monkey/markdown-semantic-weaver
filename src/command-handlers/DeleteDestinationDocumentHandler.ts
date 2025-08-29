import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { DestinationDocumentManager } from "../services/DestinationDocumentManager.js";

@injectable()
export class DeleteDestinationDocumentHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.deleteDestinationDocument';

    constructor(
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager
    ) {}

    public execute(item: { uri: vscode.Uri }): void {
        if (item && item.uri) {
            this.documentManager.remove(item.uri);
        }
    }
}
