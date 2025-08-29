import { singleton } from "tsyringe";
import * as vscode from 'vscode';

@singleton()
export class EditorCoordinator {
    /**
     * Opens a temporary text document with the specified content and language
     */
    public async openTemporaryEditor(content: string, language: string): Promise<vscode.TextDocument> {
        const document = await vscode.workspace.openTextDocument({
            content,
            language
        });
        return document;
    }

    /**
     * Shows a text document in the editor
     */
    public async showDocument(document: vscode.TextDocument, options?: vscode.TextDocumentShowOptions): Promise<void> {
        const defaultOptions: vscode.TextDocumentShowOptions = {
            preview: false,
            preserveFocus: false,
            ...options
        };

        await vscode.window.showTextDocument(document, defaultOptions);
    }

    /**
     * Opens and shows a temporary editor in one operation
     */
    public async openAndShowTemporaryEditor(content: string, language: string, options?: vscode.TextDocumentShowOptions): Promise<vscode.TextDocument> {
        const document = await this.openTemporaryEditor(content, language);
        await this.showDocument(document, options);
        return document;
    }
}