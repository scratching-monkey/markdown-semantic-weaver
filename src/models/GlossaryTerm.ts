export interface GlossaryTerm {
    id: string; // UUID for unique identification
    sourceFileUri: string; // The URI of the source file
    term: string; // The extracted keyphrase or term
    definition: string; // The surrounding sentence or paragraph as a definition
    embedding: number[]; // The vector embedding of the definition for similarity search
    metadata: {
      termGroupId?: string; // The ID of the TermGroup this term belongs to, if any
      isResolved: boolean; // Flag indicating if the user has addressed this term
    };
  }
