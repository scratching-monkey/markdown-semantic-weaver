
import * as vscode from 'vscode';
import { SessionManager } from '../services/SessionManager.js';
import { ContentBlock } from '../models/ContentBlock.js';
import { DataAccessService } from '../services/DataAccessService.js';

export class DestinationDocumentOutlinerProvider implements vscode.TreeDataProvider<ContentBlock> {

    private _onDidChangeTreeData: vscode.EventEmitter<ContentBlock | undefined | null | void> = new vscode.EventEmitter<ContentBlock | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ContentBlock | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private sessionManager: SessionManager, private dataAccessService: DataAccessService) {
        this.sessionManager.onActiveDocumentChanged(() => this.refresh());
        this.sessionManager.onDestinationDocumentDidChange(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ContentBlock): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.rawContent);
        treeItem.id = element.id;
        treeItem.collapsibleState = element.children && element.children.length > 0
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;
        treeItem.contextValue = 'markdown-semantic-weaver:contentBlock';
        treeItem.iconPath = new vscode.ThemeIcon('symbol-text');
        return treeItem;
    }

    async getChildren(element?: ContentBlock): Promise<ContentBlock[]> {
        if (element) {
            return element.children || [];
        }

        const activeDocument = this.sessionManager.getActiveDestinationDocument();
        if (!activeDocument) {
            return [];
        }

        return this.dataAccessService.getDocumentContent(activeDocument.uri);
    }
}
