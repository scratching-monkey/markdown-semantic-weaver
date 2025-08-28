import * as vscode from 'vscode';

export type LogLevel = 'trace' | 'info' | 'warn' | 'error';

export class LoggerService {
    private static instance: LoggerService;
    private outputChannel: vscode.OutputChannel;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Markdown Semantic Weaver');
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    private getLogLevel(): LogLevel {
        return vscode.workspace.getConfiguration('markdown-semantic-weaver').get('logging.level') || 'error';
    }

    private log(level: LogLevel, message: string): void {
        const configuredLevel = this.getLogLevel();
        const levels: LogLevel[] = ['trace', 'info', 'warn', 'error'];
        if (levels.indexOf(level) >= levels.indexOf(configuredLevel)) {
            const timestamp = new Date().toISOString();
            this.outputChannel.appendLine(`[${level.toUpperCase()}] [${timestamp}] ${message}`);
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
