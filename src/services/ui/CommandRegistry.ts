import { injectable, injectAll } from "tsyringe";
import * as vscode from 'vscode';
import { ICommandHandler, commandHandlerToken } from "../../command-handlers/ICommandHandler.js";
import { LoggerService } from "../utilities/LoggerService.js";

@injectable()
export class CommandRegistry {
    private disposables: vscode.Disposable[] = [];

    constructor(
        @injectAll(commandHandlerToken) private handlers: ICommandHandler[],
        private logger: LoggerService
    ) {}

    public registerCommands(context: vscode.ExtensionContext) {
        this.logger.info(`Registering ${this.handlers.length} commands.`);
        this.unregisterCommands(); // Ensure no old commands are lingering
        for (const handler of this.handlers) {
            const disposable = vscode.commands.registerCommand(handler.command, (...args) => handler.execute(...args));
            this.disposables.push(disposable);
            context.subscriptions.push(disposable);
            this.logger.info(`Registered command: ${handler.command}`);
        }
    }

    public unregisterCommands() {
        this.logger.info(`Unregistering ${this.disposables.length} commands.`);
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}
