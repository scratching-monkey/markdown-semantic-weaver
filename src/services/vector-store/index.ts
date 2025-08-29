/**
 * Vector Store Service Module
 *
 * This module provides a clean, well-structured interface for vector store operations
 * with proper error handling, type safety, and separation of concerns.
 */

// Supporting classes
export { VectorStoreErrorHandler } from './VectorStoreErrorHandler.js';
export { SessionUriManager } from './SessionUriManager.js';

// Types and constants
export type {
    VectorStoreMetadata,
    TypedIndexItem,
    VectorQueryResult
} from './VectorStoreTypes.js';

export { VECTOR_STORE_CONSTANTS } from './VectorStoreTypes.js';