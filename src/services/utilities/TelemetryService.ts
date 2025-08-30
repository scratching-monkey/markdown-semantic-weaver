import 'reflect-metadata';
import { singleton } from "tsyringe";
import * as vscode from 'vscode';
import { TelemetryReporter } from '@vscode/extension-telemetry';

@singleton()
export class TelemetryService {
    private reporter: TelemetryReporter | null = null;
    private isTelemetryEnabled = false;

    constructor() {
        this.initializeTelemetry();
    }

    private initializeTelemetry(): void {
        // Check if telemetry is enabled globally
        const telemetryLevel = vscode.workspace.getConfiguration('telemetry').get('telemetryLevel', 'all') as string;
        this.isTelemetryEnabled = telemetryLevel !== 'off';

        if (this.isTelemetryEnabled) {
            // Initialize telemetry reporter
            // Note: In a real extension, you would use your actual instrumentation key
            // For development/demo purposes, we'll use a placeholder
            const instrumentationKey = process.env.TELEMETRY_INSTRUMENTATION_KEY || '00000000-0000-0000-0000-000000000000';

            this.reporter = new TelemetryReporter(instrumentationKey);
        }
    }

    /**
     * Send a telemetry event
     */
    public sendEvent(eventName: string, properties?: Record<string, string>, measurements?: Record<string, number>): void {
        if (!this.isTelemetryEnabled || !this.reporter) {
            return;
        }

        try {
            this.reporter.sendTelemetryEvent(eventName, properties, measurements);
        } catch (error) {
            // Silently fail if telemetry fails
            console.warn('Telemetry event failed:', error);
        }
    }

    /**
     * Send telemetry for command execution
     */
    public trackCommand(commandName: string, properties?: Record<string, string>): void {
        this.sendEvent('commandExecuted', {
            command: commandName,
            ...properties
        });
    }

    /**
     * Send telemetry for session events
     */
    public trackSessionEvent(eventType: 'started' | 'ended', properties?: Record<string, string>): void {
        this.sendEvent('sessionEvent', {
            eventType,
            ...properties
        });
    }

    /**
     * Send telemetry for document operations
     */
    public trackDocumentOperation(operation: 'preview' | 'publish' | 'mergeWithAI', properties?: Record<string, string>): void {
        this.sendEvent('documentOperation', {
            operation,
            ...properties
        });
    }

    /**
     * Send telemetry for errors
     */
    public trackError(errorType: string, errorMessage: string, properties?: Record<string, string>): void {
        this.sendEvent('error', {
            errorType,
            errorMessage,
            ...properties
        });
    }

    /**
     * Dispose of the telemetry reporter
     */
    public dispose(): void {
        if (this.reporter) {
            this.reporter.dispose();
            this.reporter = null;
        }
    }
}