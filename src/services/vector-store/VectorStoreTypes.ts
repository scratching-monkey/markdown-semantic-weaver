import type { IndexItem } from 'vectra';

/**
 * Strongly typed metadata for vector store items
 */
export interface VectorStoreMetadata {
    sourceFile: string;
    contentType: 'section' | 'term';
    text: string;
    termText?: string; // Only present for term items
    resolved: boolean;
    similarityGroupId: string | null;
    [key: string]: string | boolean | null | undefined;
}

/**
 * Extended IndexItem with strongly typed metadata
 */
export interface TypedIndexItem extends Omit<IndexItem, 'metadata'> {
    metadata: VectorStoreMetadata;
}

/**
 * Constants for vector store operations
 */
export const VECTOR_STORE_CONSTANTS = {
    INDEX_DIR_NAME: '.index',
    BASE_DIR_NAME: 'markdown-semantic-weaver',
    ERROR_MESSAGES: {
        SESSION_URI_NOT_AVAILABLE: 'Session URI not available. Cannot initialize vector store.',
        ITEM_NOT_FOUND: 'Attempted to update non-existent item with id: {id}',
        DIRECTORY_NOT_FOUND: 'Vector store directory not found at {path}, nothing to clear.'
    }
} as const;

/**
 * Utility type for query results
 */
export type VectorQueryResult = {
    item: TypedIndexItem;
    score: number;
};