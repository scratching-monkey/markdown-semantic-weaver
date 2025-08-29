import { LoggerService } from '../utilities/LoggerService.js';

/**
 * Centralized error handling for VectorStoreService operations
 */
export class VectorStoreErrorHandler {
    constructor(private logger: LoggerService) {}

    /**
     * Handles errors consistently across all vector store operations
     */
    public handleError(operation: string, error: unknown, context?: string): never {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const fullContext = context ? `${operation} (${context})` : operation;

        this.logger.error(`Error in ${fullContext}: ${errorMessage}`);
        throw error;
    }

    /**
     * Handles errors that should return a default value instead of throwing
     */
    public handleErrorWithDefault<T>(
        operation: string,
        error: unknown,
        defaultValue: T,
        context?: string
    ): T {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const fullContext = context ? `${operation} (${context})` : operation;

        this.logger.error(`Error in ${fullContext}: ${errorMessage}`);
        return defaultValue;
    }

    /**
     * Logs successful operations
     */
    public logSuccess(operation: string, details?: string): void {
        const message = details ? `${operation}: ${details}` : operation;
        this.logger.info(message);
    }
}
