import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { DestinationDocumentManager } from '../core/DestinationDocumentManager.js';
import { ContentBlock } from '../models/ContentBlock.js';
import { DataAccessService } from '../core/DataAccessService.js';

@injectable()
export class DestinationDocumentOutlinerProvider implements vscode.TreeDataProvider<ContentBlock> {

    private _onDidChangeTreeData: vscode.EventEmitter<ContentBlock | undefined | null | void> = new vscode.EventEmitter<ContentBlock | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ContentBlock | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        @inject(DestinationDocumentManager) private documentManager: DestinationDocumentManager,
        @inject(DataAccessService) private dataAccessService: DataAccessService
    ) {
        this.documentManager.onActiveDocumentChanged(() => this.refresh());
        this.documentManager.onDestinationDocumentDidChange(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ContentBlock): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.rawContent);
        treeItem.id = element.path.join('.');
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

        const activeDocument = this.documentManager.getActive();
        if (!activeDocument) {
            return [];
        }

        return this.dataAccessService.getDocumentContent(activeDocument.uri);
    }
}
