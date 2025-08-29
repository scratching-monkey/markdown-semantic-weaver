/* eslint-disable @typescript-eslint/no-explicit-any */ //TODO: Refactor use of any
import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler } from "./ICommandHandler.js";
import { DestinationDocumentManager } from "../services/core/DestinationDocumentManager.js";
import { MarkdownASTParser } from "../services/processing/MarkdownASTParser.js";
import { AstService } from "../services/core/AstService.js";

@injectable()
export class AddDestinationHandler implements ICommandHandler {
    public readonly command = 'markdown-semantic-weaver.addDestination';

    constructor(
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager,
        @inject(MarkdownASTParser) private markdownParser: MarkdownASTParser,
        @inject(AstService) private astService: AstService
    ) {}

    public async execute(uri: vscode.Uri): Promise<void> {
        if (!uri) {
            throw new Error("No URI provided for AddDestination command");
        }

        try {
            // Read the file content
            const content = await vscode.workspace.fs.readFile(uri);
            const text = new TextDecoder().decode(content);

            // Parse the markdown into AST
            const ast = this.markdownParser.parse(text);
            this.astService.addPathsToAst(ast);

            // Create the destination document model
            const destinationDoc = {
                uri: uri,
                isNew: false,
                ast: ast
            };

            // Add to the document manager (we'll need to add this method)
            // For now, we'll access the private _documents map directly
            (this.documentManager as any)._documents.set(uri.toString(), destinationDoc);
            (this.documentManager as any)._onDestinationDocumentsDidChange.fire();

            console.log(`AddDestinationHandler: Added existing document ${uri.toString()}`);
        } catch (error) {
            console.error(`AddDestinationHandler: Failed to add destination document ${uri.toString()}:`, error);
            throw error;
        }
    }
}
