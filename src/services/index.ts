/**
 * Services Module
 *
 * This is the main entry point for all services in the Markdown Semantic Weaver.
 * Services are organized into logical modules for better maintainability.
 */

// Core Services - Session management, data access, state management
export * from './core/index.js';

// UI Services - Editors, webviews, providers, command handling
export * from './ui/index.js';

// Processing Services - Content processing, embeddings, parsing
export * from './processing/index.js';

// Utility Services - Logging, templates, environment management
export * from './utilities/index.js';

// Re-export existing specialized modules
export * from './vector-store/index.js';
export * from './glossary-webview/index.js';
export * from './term-extraction/index.js';