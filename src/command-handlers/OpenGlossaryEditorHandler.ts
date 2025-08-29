import { injectable } from "tsyringe";
import * as vscode from "vscode";
import { ICommandHandler } from "./ICommandHandler.js";
import { SessionManager } from "../services/core/SessionManager.js";
import { DataAccessService } from "../services/core/DataAccessService.js";
import { LoggerService } from "../services/utilities/LoggerService.js";
import { GlossaryWebviewManager } from "../services/ui/GlossaryWebviewManager.js";

@injectable()
export class OpenGlossaryEditorHandler implements ICommandHandler {
    readonly command = "markdown-semantic-weaver.openGlossaryEditor";

    constructor(
        private sessionManager: SessionManager,
        private dataAccessService: DataAccessService,
        private logger: LoggerService,
        private glossaryWebviewManager: GlossaryWebviewManager
    ) {}

    async execute(): Promise<void> {
        try {
            this.logger.info("OpenGlossaryEditorHandler: Opening glossary editor");

            // Check if we have an active session
            if (!this.sessionManager.isSessionActive()) {
                vscode.window.showWarningMessage("No active weaving session. Please add source files first.");
                return;
            }

            // Get unique terms from the data access service
            const terms = await this.dataAccessService.getUniqueTerms();

            if (terms.length === 0) {
                vscode.window.showInformationMessage("No terms found. Try adding source files with definitions.");
                return;
            }

            // Open the glossary editor webview
            await this.glossaryWebviewManager.openGlossaryEditor(terms);

            this.logger.info(`OpenGlossaryEditorHandler: Opened glossary editor with ${terms.length} terms`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`OpenGlossaryEditorHandler: Failed to open glossary editor: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to open glossary editor: ${errorMessage}`);
        }
    }
}