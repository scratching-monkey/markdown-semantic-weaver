/**
 * Core Services Module
 *
 * This module contains the fundamental services that manage the application's
 * core state, data access, and session management.
 */

// Session and State Management
export { SessionManager, DestinationDocumentModel, WeavingSessionState } from './SessionManager.js';
export { DestinationDocumentManager } from './DestinationDocumentManager.js';
export { SourceFileManager } from './SourceFileManager.js';

// Data Access and Storage
export { DataAccessService } from './DataAccessService.js';
export { VectorStoreService, type VectorStoreMetadata, type TypedIndexItem } from './VectorStoreService.js';
export { AstService } from './AstService.js';
export { DocumentSerializationService, type PublishResult } from './DocumentSerializationService.js';

// Query Services
export { SectionQueryService } from './SectionQueryService.js';
export { TermQueryService } from './TermQueryService.js';
export { SectionResolutionService } from './SectionResolutionService.js';

// Re-export vector-store module
export * from '../vector-store/index.js';
