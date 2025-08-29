import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { LoggerService } from './LoggerService.js';
import { ComparisonDocumentParser } from './ComparisonDocumentParser.js';

@singleton()
export class ComparisonCodeActionProvider implements vscode.CodeActionProvider {
    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(ComparisonDocumentParser) private documentParser: ComparisonDocumentParser
    ) {}

    /**
     * Provides CodeActions for comparison documents
     */
    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        _context: vscode.CodeActionContext /* eslint-disable-line @typescript-eslint/no-unused-vars */  //TODO: Temporary lint disable or switch to _?
    ): vscode.CodeAction[] {
        // Only provide actions for comparison documents
        if (!document.uri.scheme.startsWith('markdown-semantic-weaver-compare')) {
            return [];
        }

        const codeActions: vscode.CodeAction[] = [];

        // Check if multiple sections are selected using the parser service
        const sectionCount = this.documentParser.countSectionsInRange(document, range);

        // Only show merge action if multiple sections are selected
        if (sectionCount >= 2) {
            const mergeAction = new vscode.CodeAction(
                '🤖 Merge with AI',
                vscode.CodeActionKind.RefactorRewrite
            );

            mergeAction.command = {
                title: 'Merge with AI',
                command: 'markdown-semantic-weaver-comparison.mergeWithAI',
                arguments: [document.uri, range]
            };

            // Note: tooltip is not available on CodeAction, using title instead

            codeActions.push(mergeAction);
        }

        return codeActions;
    }
}