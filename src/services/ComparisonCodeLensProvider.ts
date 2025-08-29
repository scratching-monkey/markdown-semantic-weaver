import { singleton, inject } from "tsyringe";
import * as vscode from 'vscode';
import { LoggerService } from './LoggerService.js';
import { ComparisonVirtualProvider } from './ComparisonVirtualProvider.js';
import { ComparisonDocumentParser } from './ComparisonDocumentParser.js';

@singleton()
export class ComparisonCodeLensProvider implements vscode.CodeLensProvider {
    private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

    constructor(
        @inject(LoggerService) private logger: LoggerService,
        @inject(ComparisonVirtualProvider) private virtualProvider: ComparisonVirtualProvider,
        @inject(ComparisonDocumentParser) private documentParser: ComparisonDocumentParser
    ) {}

    /**
     * Provides CodeLens for comparison documents
     */
    public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        // Only provide CodeLens for comparison documents
        if (!document.uri.scheme.startsWith('markdown-semantic-weaver-compare')) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const sections = this.documentParser.parseSections(document);

        for (const section of sections) {
            // Create CodeLens for this section
            const range = new vscode.Range(section.startLine, 0, section.startLine, section.headerLine.length);

            // Insert CodeLens
            const insertCodeLens = new vscode.CodeLens(range, {
                title: "$(add) Insert",
                tooltip: "Insert this section into your document",
                command: "markdown-semantic-weaver-comparison.insertSection",
                arguments: [section.id, document.uri]
            });
            codeLenses.push(insertCodeLens);

            // Delete CodeLens
            const deleteCodeLens = new vscode.CodeLens(range, {
                title: "$(trash) Delete",
                tooltip: "Mark this section as resolved",
                command: "markdown-semantic-weaver-comparison.deleteSection",
                arguments: [section.id, document.uri]
            });
            codeLenses.push(deleteCodeLens);

            // Pop CodeLens
            const popCodeLens = new vscode.CodeLens(range, {
                title: "$(remove) Pop",
                tooltip: "Remove this section from the group",
                command: "markdown-semantic-weaver-comparison.popSection",
                arguments: [section.id, document.uri]
            });
            codeLenses.push(popCodeLens);
        }

        return codeLenses;
    }

    /**
     * Refreshes the CodeLens for a comparison document
     */
    public refresh(_uri: vscode.Uri): void {
        this._onDidChangeCodeLenses.fire();
    }
}