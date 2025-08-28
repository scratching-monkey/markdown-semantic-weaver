import * as vscode from 'vscode';
import { SessionManager } from './SessionManager.js';
import { DataAccessService } from './DataAccessService.js';
import { LoggerService } from './LoggerService.js';

export class CommandHandlerService {
    private logger = LoggerService.getInstance();

    constructor(
        private sessionManager: SessionManager,
        private dataAccessService: DataAccessService
    ) {}

    public registerCommands(context: vscode.ExtensionContext) {
        const testCommand = vscode.commands.registerCommand('markdown-semantic-weaver.testCommand', () => {
            this.logger.info("Test command executed.");
            if (this.sessionManager.isSessionActive()) {
                this.logger.info("Session is active.");
                this.dataAccessService.getSimilarityGroups().then((groups: any) => {
                    this.logger.info(`Found ${groups.length} similarity groups.`);
                });
            } else {
                this.logger.info("Session is not active.");
            }
        });

        context.subscriptions.push(testCommand);
    }
}
