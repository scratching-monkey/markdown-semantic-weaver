import 'reflect-metadata';
import { singleton } from "tsyringe";
import * as vscode from 'vscode';

export type LogLevel = 'trace' | 'info' | 'warn' | 'error';

@singleton()
export class LoggerService {
    private static instance: LoggerService;
    private outputChannel: vscode.OutputChannel;

    public constructor() {
        this.outputChannel = vscode.window.createOutputChannel("Markdown Semantic Weaver");
    }



    private getLogLevel(): LogLevel {
        return vscode.workspace.getConfiguration('markdown-semantic-weaver').get('logging.level') || 'error';
    }

    private log(level: LogLevel, message: string): void {
        const configuredLevel = this.getLogLevel();
        const levels: LogLevel[] = ['trace', 'info', 'warn', 'error'];
        if (levels.indexOf(level) >= levels.indexOf(configuredLevel)) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${level.toUpperCase()}] [${timestamp}] ${message}`;
            this.outputChannel.appendLine(logMessage);

            if (process.env.VSCODE_TEST) {
                switch (level) {
                    case 'trace':
                        console.log(logMessage);
                        break;
                    case 'info':
                        console.info(logMessage);
                        break;
                    case 'warn':
                        console.warn(logMessage);
                        break;
                    case 'error':
                        console.error(logMessage);
                        break;
                }
            }
        }
    }

    public trace(message: string): void {
        this.log('trace', message);
    }

    public info(message: string): void {
        this.log('info', message);
    }

    public warn(message: string): void {
        this.log('warn', message);
    }

    public error(message: string): void {
        this.log('error', message);
    }
}
