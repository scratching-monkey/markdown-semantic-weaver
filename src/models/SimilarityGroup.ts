import { SourceSection } from './SourceSection.js';

/**
 * Represents a group of two or more SourceSections identified as
 * semantically similar. This is an aggregate model constructed by the service.
 */
export interface SimilarityGroup {
  id: string; // A UUID corresponding to the 'groupId' in SourceSection metadata
  memberSections: SourceSection[]; // The collection of sections in this group
  isResolved: boolean; // True only when all member sections are resolved
}
