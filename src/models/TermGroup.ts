import { GlossaryTerm } from './GlossaryTerm.js';

/**
 * Represents a group of two or more GlossaryTerms identified as
 * semantically similar. This is an aggregate model constructed by the service.
 */
export interface TermGroup {
  id:string; // A UUID corresponding to the 'groupId' in GlossaryTerm metadata
  memberTerms: GlossaryTerm[]; // The collection of terms in this group
  isResolved: boolean; // True only when all member terms are resolved
}
