import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { DataAccessService } from '../services/DataAccessService.js';
import { SimilarityGroup } from '../models/SimilarityGroup.js';
import { SourceSection } from '../models/SourceSection.js';

@injectable()
export class SectionsProvider implements vscode.TreeDataProvider<SimilarityGroup | SourceSection> {
    private _onDidChangeTreeData: vscode.EventEmitter<SimilarityGroup | SourceSection | undefined | null | void> = new vscode.EventEmitter<SimilarityGroup | SourceSection | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SimilarityGroup | SourceSection | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(@inject(DataAccessService) private dataAccessService: DataAccessService) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SimilarityGroup | SourceSection): vscode.TreeItem {
        if ('memberSections' in element) { // SimilarityGroup
            const item = new vscode.TreeItem(`Similar Sections (${element.memberSections.length})`, vscode.TreeItemCollapsibleState.Collapsed);
            item.contextValue = 'markdown-semantic-weaver:similarityGroup';
            item.tooltip = `Click to compare and resolve ${element.memberSections.length} similar sections`;
            item.command = {
                command: 'markdown-semantic-weaver.openComparisonEditor',
                title: 'Compare Similar Sections',
                arguments: [element.id]
            };
            return item;
        } else { // SourceSection
            const item = new vscode.TreeItem(element.content.substring(0, 100) + (element.content.length > 100 ? '...' : ''), vscode.TreeItemCollapsibleState.None);
            item.contextValue = 'markdown-semantic-weaver:section';
            item.tooltip = `From: ${element.sourceFileUri}\nLines: ${element.metadata.startLine}-${element.metadata.endLine}`;
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
