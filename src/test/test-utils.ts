import { container } from 'tsyringe';
import * as vscode from 'vscode';
import { EmbeddingService } from '../services/processing/EmbeddingService.js';
import { EnvironmentService } from '../services/utilities/EnvironmentService.js';
import { registerCommandHandlers } from '../command-handlers/index.js';
import { CommandRegistry } from '../services/ui/CommandRegistry.js';
import { LoggerService } from '../services/utilities/LoggerService.js';
import { VectorStoreService } from '../services/core/VectorStoreService.js';
import { SessionManager } from '../services/core/SessionManager.js';

// Global flag to ensure commands are only registered once across all test suites
let commandsRegistered = false;

// Mock implementation of vscode.window.withProgress that properly awaits async operations
export const mockWithProgress = <R>(
    options: vscode.ProgressOptions,
    task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Thenable<R>
): Thenable<R> => {
    return new Promise<R>((resolve, reject) => {
        // Log progress options in debug mode
        if (process.env.DEBUG_TEST_PROGRESS) {
            console.log(`Mock withProgress called with title: ${options.title || 'Untitled'}`);
        }

        // Create a mock progress object
        const progress: vscode.Progress<{ message?: string; increment?: number }> = {
            report: (value: { message?: string; increment?: number }) => {
                // In test environment, we can optionally log progress updates
                if (process.env.DEBUG_TEST_PROGRESS) {
                    console.log(`Progress: ${value.message || ''} ${value.increment ? `(${value.increment}%)` : ''}`);
                }
            }
        };

        // Execute the task and properly await its completion
        Promise.resolve(task(progress))
            .then(resolve)
            .catch(reject);
    });
};

// Mock VS Code APIs for testing
export const mockVSCodeAPIs = () => {
    // Mock vscode.window.withProgress
    const originalWithProgress = vscode.window.withProgress;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vscode.window as any).withProgress = mockWithProgress;

    // Return cleanup function
    return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (vscode.window as any).withProgress = originalWithProgress;
    };
};

// Enhanced test environment initialization
export async function initializeTestEnvironment(context: vscode.ExtensionContext): Promise<() => void> {
    container.register<vscode.ExtensionContext>("vscode.ExtensionContext", { useValue: context });

    const environmentService = container.resolve(EnvironmentService);
    environmentService.setTestEnvironment();

    // Mock VS Code APIs
    const cleanup = mockVSCodeAPIs();

    // Register command handlers only once across all test suites
    if (!commandsRegistered) {
        console.log('Test environment: Registering command handlers...');
        registerCommandHandlers();

        const logger = container.resolve(LoggerService);
        logger.info('Test environment: Extension activating.');

        const commandRegistry = container.resolve(CommandRegistry);
        commandRegistry.registerCommands(context);
        logger.info('Test environment: Commands registered.');

        commandsRegistered = true;
    } else {
        console.log('Test environment: Commands already registered, skipping...');
    }

    // Initialize embedding service (this will now use the mocked withProgress)
    const embeddingService = container.resolve(EmbeddingService);
    await embeddingService.init();
    console.log('Test environment: Embedding service initialized.');

    // Initialize VectorStoreService with SessionManager
    const sessionManager = container.resolve(SessionManager);
    const vectorStoreService = container.resolve(VectorStoreService);
    vectorStoreService.initialize(sessionManager);
    console.log('Test environment: VectorStoreService initialized.');

    return cleanup;
}
