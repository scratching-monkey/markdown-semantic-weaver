import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { DestinationDocumentManager } from "../services/core/DestinationDocumentManager.js";

@injectable()
export class AddNewDestinationDocumentHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.addNewDestinationDocument';

    constructor(
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager
    ) {}

    public execute(): void {
        console.log('AddNewDestinationDocumentHandler: execute() called');
        this.documentManager.createNew();

        // Set the newly created document as active
        const allDocs = this.documentManager.getAll();
        const newDocUri = Array.from(allDocs.keys()).pop(); // Get the last added document
        if (newDocUri) {
            this.documentManager.setActive(vscode.Uri.parse(newDocUri));
        }

        console.log('AddNewDestinationDocumentHandler: createNew() completed');
    }
}
