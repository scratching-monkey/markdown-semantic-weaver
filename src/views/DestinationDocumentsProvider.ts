import * as vscode from 'vscode';
import * as path from 'path';
import { SessionManager, WeavingSessionState } from '../services/SessionManager.js';
import { DestinationDocument } from '../models/DestinationDocument.js';

export class DestinationDocumentsProvider implements vscode.TreeDataProvider<DestinationDocument> {
    private _onDidChangeTreeData: vscode.EventEmitter<DestinationDocument | undefined | null | void> = new vscode.EventEmitter<DestinationDocument | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DestinationDocument | undefined | null | void> = this._onDidChangeTreeData.event;

    private sessionManager: SessionManager;

    constructor(sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
        this.sessionManager.onDestinationDocumentsDidChange(() => {
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

        const session: WeavingSessionState = this.sessionManager.getState();
        if (session.status !== 'Active') {
            return Promise.resolve([]);
        }

        const destinationDocuments = Array.from(session.destinationDocuments.values()).map(doc => new DestinationDocument(doc.uri, doc.ast));
        return Promise.resolve(destinationDocuments);
    }
}
