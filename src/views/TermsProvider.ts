import { injectable, inject } from "tsyringe";
import * as vscode from 'vscode';
import { DataAccessService } from '../services/DataAccessService.js';
import { TermGroup } from '../models/TermGroup.js';
import { GlossaryTerm } from '../models/GlossaryTerm.js';

@injectable()
export class TermsProvider implements vscode.TreeDataProvider<TermGroup | GlossaryTerm> {
    private _onDidChangeTreeData: vscode.EventEmitter<TermGroup | GlossaryTerm | undefined | null | void> = new vscode.EventEmitter<TermGroup | GlossaryTerm | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TermGroup | GlossaryTerm | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(@inject(DataAccessService) private dataAccessService: DataAccessService) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TermGroup | GlossaryTerm): vscode.TreeItem {
        if ('memberTerms' in element) { // TermGroup
            const item = new vscode.TreeItem(`Similar Terms (${element.memberTerms.length})`, vscode.TreeItemCollapsibleState.Collapsed);
            item.contextValue = 'termGroup';
            return item;
        } else { // GlossaryTerm
            const item = new vscode.TreeItem(element.term, vscode.TreeItemCollapsibleState.None);
            item.description = element.definition;
            item.contextValue = 'glossaryTerm';
            item.command = {
                command: 'vscode.open',
                title: 'Open Source',
                arguments: [vscode.Uri.parse(element.sourceFileUri)]
            };
            return item;
        }
    }

    async getChildren(element?: TermGroup | GlossaryTerm): Promise<(TermGroup | GlossaryTerm)[]> {
        if (element) {
            if ('memberTerms' in element) {
                return element.memberTerms;
            }
            return [];
        } else {
            const termGroups = await this.dataAccessService.getTermGroups();
            const uniqueTerms = await this.dataAccessService.getUniqueTerms();
            return [...termGroups, ...uniqueTerms];
        }
    }
}
