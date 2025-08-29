/* eslint-disable @typescript-eslint/no-explicit-any */ //TODO: Refactor use of any
import { injectable } from "tsyringe";
import * as vscode from "vscode";
import * as path from "path";
import { LoggerService } from "./LoggerService.js";
import { DataAccessService } from "./DataAccessService.js";
import { TemplateEngine } from "./TemplateEngine.js";

interface GlossaryTerm {
    id: string;
    term: string;
    definition: string;
    sourceFileUri: string;
    scope?: string;
    confidence?: number;
    pattern?: string;
}

interface WebviewMessage {
    type: string;
    data?: any;
}

@injectable()
export class GlossaryWebviewManager {
    private panel: vscode.WebviewPanel | undefined;
    private disposables: vscode.Disposable[] = [];

    constructor(
        private logger: LoggerService,
        private dataAccessService: DataAccessService,
        private templateEngine: TemplateEngine
    ) {}

    async openGlossaryEditor(terms: GlossaryTerm[]): Promise<void> {
        if (this.panel) {
            // If panel already exists, just reveal it
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        // Create the webview panel
        this.panel = vscode.window.createWebviewPanel(
            'markdown-semantic-weaver.glossaryEditor',
            'Glossary Editor',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(vscode.extensions.getExtension('undefined_publisher.markdown-semantic-weaver')!.extensionPath, 'resources'))
                ]
            }
        );

        // Set up the webview content
        this.panel.webview.html = this.getWebviewContent(terms);

        // Set up message handling
        this.panel.webview.onDidReceiveMessage(
            this.handleWebviewMessage.bind(this),
            undefined,
            this.disposables
        );

        // Handle panel disposal
        this.panel.onDidDispose(
            () => {
                this.panel = undefined;
                this.disposables.forEach(disposable => disposable.dispose());
                this.disposables = [];
            },
            undefined,
            this.disposables
        );

        this.logger.info(`GlossaryWebviewManager: Opened glossary editor with ${terms.length} terms`);
    }

    private getWebviewContent(terms: GlossaryTerm[]): string {
        const nonce = this.getNonce();

        // Load templates
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const htmlTemplate = this.templateEngine.render('glossary-editor.html', {});
        const cssContent = this.templateEngine.render('glossary-editor.css', {});
        const jsContent = this.templateEngine.render('glossary-editor.js', {
            TERMS_DATA: JSON.stringify(terms)
        });

        // Calculate statistics
        const highConfidenceCount = terms.filter(t => (t.confidence || 0) >= 0.8).length;
        const mediumConfidenceCount = terms.filter(t => (t.confidence || 0) >= 0.6 && (t.confidence || 0) < 0.8).length;
        const lowConfidenceCount = terms.filter(t => (t.confidence || 0) < 0.6).length;
        const patternCount = new Set(terms.map(t => t.pattern)).size;

        // Generate terms content
        const termsContent = terms.length === 0
            ? `<div class="empty-state">
                <h2>No Terms Found</h2>
                <p>Add source files with definitions to populate the glossary.</p>
            </div>`
            : terms.map(term => this.renderTermCard(term)).join('');

        // Render final HTML with all data
        return this.templateEngine.render('glossary-editor.html', {
            NONCE: nonce,
            CSS_CONTENT: cssContent,
            JS_CONTENT: jsContent,
            TOTAL_TERMS: terms.length,
            HIGH_CONFIDENCE_COUNT: highConfidenceCount,
            MEDIUM_CONFIDENCE_COUNT: mediumConfidenceCount,
            LOW_CONFIDENCE_COUNT: lowConfidenceCount,
            PATTERN_COUNT: patternCount,
            TERMS_CONTENT: termsContent
        });
    }

    private renderTermCard(term: GlossaryTerm): string {
        const confidence = term.confidence || 0;
        const confidenceClass = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';
        const confidenceLabel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low';

        return `
            <div class="term-card" data-term-id="${term.id}">
                <div class="term-header">
                    <div>
                        <div class="term-title">${term.term}</div>
                        <div class="term-meta">
                            <span>From: ${term.sourceFileUri.split('/').pop()}</span>
                            ${term.scope ? `<span> • Scope: ${term.scope}</span>` : ''}
                            <span class="confidence-badge confidence-${confidenceClass}">${confidenceLabel}</span>
                            ${term.pattern ? `<span class="pattern-badge">${term.pattern}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="term-definition">${term.definition}</div>
                <div class="term-actions">
                    <button class="action-button primary" onclick="acceptTerm('${term.id}')">Accept</button>
                    <button class="action-button secondary" onclick="editTerm('${term.id}')">Edit</button>
                    <button class="action-button danger" onclick="rejectTerm('${term.id}')">Reject</button>
                </div>
            </div>
        `;
    }

    private async handleWebviewMessage(message: WebviewMessage): Promise<void> {
        try {
            switch (message.type) {
                case 'acceptTerm':
                    await this.handleAcceptTerm(message.data.termId);
                    break;
                case 'editTerm':
                    await this.handleEditTerm(message.data.termId);
                    break;
                case 'rejectTerm':
                    await this.handleRejectTerm(message.data.termId);
                    break;
                default:
                    this.logger.warn(`GlossaryWebviewManager: Unknown message type: ${message.type}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`GlossaryWebviewManager: Error handling message ${message.type}: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to process action: ${errorMessage}`);
        }
    }

    private async handleAcceptTerm(termId: string): Promise<void> {
        this.logger.info(`GlossaryWebviewManager: Accepting term ${termId}`);

        // Mark the term as resolved/accepted in the data store
        await this.dataAccessService.markTermAsResolved(termId);

        // Notify the webview that the term was updated
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'termUpdated',
                data: { termId, action: 'accepted' }
            });
        }

        vscode.window.showInformationMessage('Term accepted and added to glossary.');
    }

    private async handleEditTerm(termId: string): Promise<void> {
        this.logger.info(`GlossaryWebviewManager: Editing term ${termId}`);

        // Get the term details
        const terms = await this.dataAccessService.getUniqueTerms();
        const term = terms.find(t => t.id === termId);

        if (!term) {
            vscode.window.showErrorMessage('Term not found.');
            return;
        }

        // Show input boxes for editing term and definition
        const newTerm = await vscode.window.showInputBox({
            prompt: 'Edit term',
            value: term.term
        });

        if (newTerm === undefined) {
            return; // User cancelled
        }

        const newDefinition = await vscode.window.showInputBox({
            prompt: 'Edit definition',
            value: term.definition
        });

        if (newDefinition === undefined) {
            return; // User cancelled
        }

        // Update the term in the data store
        await this.dataAccessService.updateTermDefinition(termId, newTerm, newDefinition);

        // Notify the webview that the term was updated
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'termUpdated',
                data: {
                    termId,
                    term: { ...term, term: newTerm, definition: newDefinition }
                }
            });
        }

        vscode.window.showInformationMessage('Term updated successfully.');
    }

    private async handleRejectTerm(termId: string): Promise<void> {
        this.logger.info(`GlossaryWebviewManager: Rejecting term ${termId}`);

        // Remove the term from the data store
        await this.dataAccessService.removeTerm(termId);

        // Notify the webview that the term was removed
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'termRemoved',
                data: { termId }
            });
        }

        vscode.window.showInformationMessage('Term rejected and removed.');
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}