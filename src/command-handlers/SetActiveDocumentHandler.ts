import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { DestinationDocumentManager } from "../services/core/DestinationDocumentManager.js";

@injectable()
export class SetActiveDocumentHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.setActiveDocument';

    constructor(
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager
    ) {}

    public async execute(uri: vscode.Uri): Promise<void> {
        try {
            // Set the active document
            this.documentManager.setActive(uri);

            vscode.window.showInformationMessage(`Active document set to: ${vscode.workspace.asRelativePath(uri)}`);
        } catch {
            vscode.window.showErrorMessage('Failed to set active document');
        }
    }
}