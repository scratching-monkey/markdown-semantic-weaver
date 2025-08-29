import { injectable } from "tsyringe";
import * as vscode from "vscode";
import {
    GlossaryTerm
} from '../../models/GlossaryTerm.js';
import { TermStatisticsCalculator } from '../glossary-webview/TermStatisticsCalculator.js';
import { GlossaryHtmlRenderer } from '../glossary-webview/GlossaryHtmlRenderer.js';
import { GlossaryMessageHandler } from '../glossary-webview/GlossaryMessageHandler.js';
import { GlossaryPanelManager } from '../glossary-webview/GlossaryPanelManager.js';
import { LoggerService } from "../utilities/LoggerService.js";
import { DataAccessService } from "../core/DataAccessService.js";
import { TemplateEngine } from "../utilities/TemplateEngine.js";

@injectable()
export class GlossaryWebviewManager {
    private panel: vscode.WebviewPanel | undefined;
    private messageHandler: GlossaryMessageHandler | undefined;

    constructor(
        private logger: LoggerService,
        private dataAccessService: DataAccessService,
        private templateEngine: TemplateEngine,
        private statisticsCalculator: TermStatisticsCalculator,
        private htmlRenderer: GlossaryHtmlRenderer,
        private panelManager: GlossaryPanelManager
    ) {}

    async openGlossaryEditor(terms: GlossaryTerm[]): Promise<void> {
        if (this.panel) {
            // If panel already exists, just reveal it
            this.panelManager.revealPanel(this.panel);
            return;
        }

        // Create the webview panel
        this.panel = this.panelManager.createPanel();

        // Calculate statistics
        const statistics = TermStatisticsCalculator.calculateStatistics(terms);

        // Generate HTML content
        const htmlContent = this.htmlRenderer.renderWebviewContent(terms, statistics);

        // Set up the webview content
        this.panelManager.updatePanelContent(this.panel, htmlContent);

        // Create and setup message handler
        this.messageHandler = new GlossaryMessageHandler(
            this.dataAccessService,
            this.logger
        );

        // Set up message handling
        this.panelManager.setupMessageHandling(this.panel, this.messageHandler);

        // Handle panel disposal
        this.panelManager.setupDisposalHandling(this.panel, () => {
            this.panel = undefined;
            this.messageHandler = undefined;
        });

        this.logger.info(`GlossaryWebviewManager: Opened glossary editor with ${terms.length} terms`);
    }

    // Public methods for external interaction
    getPanel(): vscode.WebviewPanel | undefined {
        return this.panel;
    }

    isPanelOpen(): boolean {
        return this.panel !== undefined;
    }

    closePanel(): void {
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
            this.messageHandler = undefined;
        }
    }

    // Method to refresh the panel content with new data
    async refreshContent(terms: GlossaryTerm[]): Promise<void> {
        if (!this.panel) {
            return;
        }

        const statistics = TermStatisticsCalculator.calculateStatistics(terms);
        const htmlContent = this.htmlRenderer.renderWebviewContent(terms, statistics);
        this.panelManager.updatePanelContent(this.panel, htmlContent);
    }

    // Method to send messages to the webview
    sendMessage(): void {
        if (this.panel && this.messageHandler) {
            this.messageHandler.setWebview(this.panel.webview);
            // Note: This would need to be implemented based on the message structure
        }
    }
}
