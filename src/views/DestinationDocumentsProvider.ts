import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import * as path from 'path';
import { DestinationDocumentManager } from '../services/DestinationDocumentManager.js';
import { DestinationDocument } from '../models/DestinationDocument.js';

@injectable()
export class DestinationDocumentsProvider implements vscode.TreeDataProvider<DestinationDocument> {
    private _onDidChangeTreeData: vscode.EventEmitter<DestinationDocument | undefined | null | void> = new vscode.EventEmitter<DestinationDocument | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DestinationDocument | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(@inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager) {
        this.documentManager.onDestinationDocumentsDidChange(() => {
            this.refresh();
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: DestinationDocument): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(path.basename(element.uri.fsPath), vscode.TreeItemCollapsibleState.None);
        treeItem.id = element.uri.toString();
        treeItem.resourceUri = element.uri;
        treeItem.tooltip = element.uri.fsPath;
        treeItem.iconPath = new vscode.ThemeIcon('markdown');
        treeItem.contextValue = 'markdown-semantic-weaver:destinationDocument';
        // TODO: Implement setActiveDocument command
        // treeItem.command = {
        //     command: 'markdown-semantic-weaver.setActiveDocument',
        //     title: 'Set Active Document',
        //     arguments: [element.uri],
        // };
        return treeItem;
    }

    getChildren(element?: DestinationDocument): vscode.ProviderResult<DestinationDocument[]> {
        if (element) {
            // Destination documents are flat, no children
            return Promise.resolve([]);
        }

        const destinationDocuments = Array.from(this.documentManager.getAll().values()).map(doc => new DestinationDocument(doc.uri, doc.ast));
        return Promise.resolve(destinationDocuments);
    }
}
