/**
 * UI Services Module
 *
 * This module contains all services related to user interface components,
 * including editors, webviews, and VS Code UI providers.
 */

// Command and Registry
export { CommandRegistry } from './CommandRegistry.js';

// Tree View Providers
export { DestinationDocumentsProvider } from './DestinationDocumentsProvider.js';
export { DestinationDocumentOutlinerProvider } from './DestinationDocumentOutlinerProvider.js';
export { SectionsProvider } from './SectionsProvider.js';
export { TermsProvider } from './TermsProvider.js';

// Editor Services
export { BlockEditorCoordinator } from './BlockEditorCoordinator.js';
export { BlockEditorService } from './BlockEditorService.js';
export { EditorCoordinator } from './EditorCoordinator.js';

// Webview Services
export { GlossaryWebviewManager } from './GlossaryWebviewManager.js';
export { ComparisonVirtualProvider } from './ComparisonVirtualProvider.js';

// Code Lens and Code Action Providers
export { ComparisonCodeLensProvider } from './ComparisonCodeLensProvider.js';
export { ComparisonCodeActionProvider } from './ComparisonCodeActionProvider.js';
export { ComparisonDocumentParser } from './ComparisonDocumentParser.js';

// Re-export existing modules
export * from '../glossary-webview/index.js';