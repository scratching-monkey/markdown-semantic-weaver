import * as vscode from 'vscode';
import { DataAccessService } from '../services/DataAccessService.js';
import { SimilarityGroup } from '../models/SimilarityGroup.js';
import { SourceSection } from '../models/SourceSection.js';

export class SectionsProvider implements vscode.TreeDataProvider<SimilarityGroup | SourceSection> {
    private _onDidChangeTreeData: vscode.EventEmitter<SimilarityGroup | SourceSection | undefined | null | void> = new vscode.EventEmitter<SimilarityGroup | SourceSection | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SimilarityGroup | SourceSection | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private dataAccessService: DataAccessService) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SimilarityGroup | SourceSection): vscode.TreeItem {
        if ('memberSections' in element) { // SimilarityGroup
            const item = new vscode.TreeItem(`Similar Sections (${element.memberSections.length})`, vscode.TreeItemCollapsibleState.Collapsed);
            item.contextValue = 'similarityGroup';
            return item;
        } else { // SourceSection
            const item = new vscode.TreeItem(element.content, vscode.TreeItemCollapsibleState.None);
            item.contextValue = 'sourceSection';
            item.command = {
                command: 'vscode.open',
                title: 'Open Source',
                arguments: [vscode.Uri.parse(element.sourceFileUri), { selection: new vscode.Range(element.metadata.startLine, 0, element.metadata.endLine, 0) }]
            };
            return item;
        }
    }

    async getChildren(element?: SimilarityGroup | SourceSection): Promise<(SimilarityGroup | SourceSection)[]> {
        if (element) {
            if ('memberSections' in element) {
                return element.memberSections;
            }
            return [];
        } else {
            const similarityGroups = await this.dataAccessService.getSimilarityGroups();
            const uniqueSections = await this.dataAccessService.getUniqueSections();
            return [...similarityGroups, ...uniqueSections];
        }
    }
}
