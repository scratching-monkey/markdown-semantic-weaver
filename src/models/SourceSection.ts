/**
 * Represents a logical block of content (e.g., paragraph, heading with content)
 * parsed from a source Markdown file and stored in the Vectra database.
 */
export interface SourceSection {
  id: string; // UUID for unique identification
  sourceFileUri: string; // The URI of the source file
  content: string; // The raw Markdown content of the section
  embedding: number[]; // The vector embedding for similarity search
  metadata: {
    startLine: number; // The starting line number in the source file
    endLine: number; // The ending line number in the source file
    groupId?: string; // The ID of the SimilarityGroup this section belongs to, if any
    isResolved: boolean; // Flag indicating if the user has addressed this section
    isPopped: boolean; // Flag indicating if this section was a false positive popped from a group
    [key: string]: any; // Allow other properties
  };
}
