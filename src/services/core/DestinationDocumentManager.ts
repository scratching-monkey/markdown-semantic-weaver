import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import type { Root } from 'mdast';
import { AstService } from './AstService.js';

import { DestinationDocumentModel } from '../models/DestinationDocumentModel.js';

export { DestinationDocumentModel };

@singleton()
export class DestinationDocumentManager {
    private _documents: Map<string, DestinationDocumentModel> = new Map();
    private _activeDocumentUri: vscode.Uri | null = null;

    private readonly _onActiveDocumentChanged = new vscode.EventEmitter<vscode.Uri | null>();
    public readonly onActiveDocumentChanged = this._onActiveDocumentChanged.event;

    private readonly _onDestinationDocumentDidChange = new vscode.EventEmitter<{ documentUri: vscode.Uri, ast: Root }>();
    public readonly onDestinationDocumentDidChange = this._onDestinationDocumentDidChange.event;

    private readonly _onDestinationDocumentsDidChange = new vscode.EventEmitter<void>();
    public readonly onDestinationDocumentsDidChange = this._onDestinationDocumentsDidChange.event;

    public constructor(@inject(AstService) private astService: AstService) {}

    public getAll(): Readonly<Map<string, DestinationDocumentModel>> {
        return this._documents;
    }

    public getActive(): DestinationDocumentModel | undefined {
        if (!this._activeDocumentUri) {
            return undefined;
        }
        return this._documents.get(this._activeDocumentUri.toString());
    }

    public getActiveUri(): vscode.Uri | null {
        return this._activeDocumentUri;
    }

    public setActive(uri: vscode.Uri | null) {
        const uriString = uri ? uri.toString() : null;
        const currentUriString = this._activeDocumentUri ? this._activeDocumentUri.toString() : null;

        if (uriString !== currentUriString) {
            this._activeDocumentUri = uri;
            this._onActiveDocumentChanged.fire(uri);
        }
    }

    public createNew(): void {
        const ast: Root = { type: 'root', children: [] };
        this.astService.addPathsToAst(ast);
        const newDoc: DestinationDocumentModel = {
            uri: vscode.Uri.parse(`untitled:NewDocument-${this._documents.size + 1}.md`),
            isNew: true,
            ast: ast
        };
        this._documents.set(newDoc.uri.toString(), newDoc);
        console.log(`DestinationDocumentManager: Created new document ${newDoc.uri.toString()}, total documents: ${this._documents.size}`);
        this._onDestinationDocumentsDidChange.fire();
        console.log('DestinationDocumentManager: Fired onDestinationDocumentsDidChange event');
    }

    public remove(uri: vscode.Uri): void {
        if (this._documents.delete(uri.toString())) {
            this._onDestinationDocumentsDidChange.fire();
            if (this._activeDocumentUri?.toString() === uri.toString()) {
                this.setActive(null);
            }
        }
    }

    public async updateAst(uri: vscode.Uri, newAst: Root): Promise<void> {
        this.astService.addPathsToAst(newAst);
        const doc = this._documents.get(uri.toString());
        if (doc) {
            this._documents.set(uri.toString(), { ...doc, ast: newAst });
            this._onDestinationDocumentDidChange.fire({ documentUri: uri, ast: newAst });
        }
    }

    public reset(): void {
        this._documents.clear();
        this._activeDocumentUri = null;
        this._onDestinationDocumentsDidChange.fire();
        this._onActiveDocumentChanged.fire(null);
    }
}
