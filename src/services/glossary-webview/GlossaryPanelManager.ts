import { injectable } from 'tsyringe';
import * as vscode from 'vscode';
import * as path from 'path';
import { GlossaryWebviewConfig, GlossaryWebviewMessage } from './GlossaryWebviewConfig.js';
import { GlossaryMessageHandler } from './GlossaryMessageHandler.js';
import { LoggerService } from '../LoggerService.js';

@injectable()
export class GlossaryPanelManager {
    private disposables: vscode.Disposable[] = [];

    constructor(private logger: LoggerService) {}

    createPanel(): vscode.WebviewPanel {
        const panel = vscode.window.createWebviewPanel(
            GlossaryWebviewConfig.PANEL_CONFIG.viewType,
            GlossaryWebviewConfig.PANEL_CONFIG.title,
            {
                viewColumn: vscode.ViewColumn.One,
                preserveFocus: false
            },
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(
                        vscode.extensions.getExtension('undefined_publisher.markdown-semantic-weaver')!.extensionPath,
                        'resources'
                    ))
                ]
            }
        );

        this.logger.info('GlossaryPanelManager: Created new webview panel');
        return panel;
    }

    setupMessageHandling(panel: vscode.WebviewPanel, messageHandler: GlossaryMessageHandler): void {
        // Set up message handler for the webview
        messageHandler.setWebview(panel.webview);

        panel.webview.onDidReceiveMessage(
            (message: GlossaryWebviewMessage) => messageHandler.handleMessage(message),
            undefined,
            this.disposables
        );

        this.logger.info('GlossaryPanelManager: Set up message handling');
    }

    setupDisposalHandling(panel: vscode.WebviewPanel, onDispose?: () => void): void {
        panel.onDidDispose(
            () => {
                this.logger.info('GlossaryPanelManager: Panel disposed, cleaning up resources');

                // Execute custom disposal callback if provided
                if (onDispose) {
                    onDispose();
                }

                // Clean up disposables
                this.disposables.forEach(disposable => disposable.dispose());
                this.disposables = [];
            },
            undefined,
            this.disposables
        );
    }

    revealPanel(panel: vscode.WebviewPanel): void {
        panel.reveal(vscode.ViewColumn.One);
        this.logger.info('GlossaryPanelManager: Revealed existing panel');
    }

    updatePanelContent(panel: vscode.WebviewPanel, html: string): void {
        panel.webview.html = html;
        this.logger.info('GlossaryPanelManager: Updated panel content');
    }

    dispose(): void {
        this.logger.info('GlossaryPanelManager: Disposing panel manager');
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }

    // Utility methods for panel management
    isPanelVisible(panel: vscode.WebviewPanel): boolean {
        return panel.visible;
    }

    getPanelViewColumn(panel: vscode.WebviewPanel): vscode.ViewColumn | undefined {
        return panel.viewColumn;
    }

    setPanelTitle(panel: vscode.WebviewPanel, title: string): void {
        panel.title = title;
    }

    showPanel(panel: vscode.WebviewPanel): void {
        panel.reveal(vscode.ViewColumn.One, false);
    }

    hidePanel(panel: vscode.WebviewPanel): void {
        // Note: VS Code doesn't have a direct "hide" method, but we can move to a different column
        panel.reveal(vscode.ViewColumn.Beside, true);
    }
}