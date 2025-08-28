# **Design Specification: Data Access & Services Layer for the Markdown Semantic Weaver Visual Studio Code extension**

## **1\. Component Charter and Architectural Principles**

This document provides the formal design specification for the Data Access & Services Layer, a core component of the Markdown Semantic Weaver Visual Studio Code extension. This layer is responsible for **orchestrating all data-related operations** within a weaving session, acting as the definitive bridge between the user interface components and the underlying data persistence mechanisms.

### **1.1. Core Mandate: The Abstraction Layer**

The primary mandate of the Data Access & Services Layer is to serve as a strict abstraction layer over the application's data sources.1 The extension manages two fundamentally different types of data: the content and vector embeddings of source documents persisted in a session-specific
Vectra vector database, and the in-memory Abstract Syntax Tree (AST) representations of the destination documents being authored.1
This component entirely encapsulates the logic required to query, manipulate, and update these data stores. By doing so, it decouples all consumer components—such as the UI Views in the sidebar, the custom editors, and the command handlers—from the implementation details of data storage. Consumers interact with a clean, stable, and domain-specific API, eliminating the need for them to understand raw database query syntax or complex in-memory tree traversal logic. This separation of concerns is critical for the maintainability and testability of the overall application.

### **1.2. Architectural Pattern: The Mediator**

The Data Access & Services Layer is designed to function as a Mediator. It centralizes and manages all data-related communication between the application's presentation layer (the UI) and its data persistence layer. UI components do not directly access the Vectra database or the in-memory ASTs; instead, they submit requests to the Data Access Layer, which then orchestrates the necessary operations and returns the results.1
This pattern prevents a tightly coupled architecture where numerous UI components might independently manage data access, leading to duplicated logic, inconsistent state management, and increased fragility. By channeling all data interactions through this single, well-defined service, the system ensures a consistent and predictable approach to state management. While this layer mediates data-related communication, it operates under the authority of the Session and State Management component. It computes state changes but relies on the SSM to commit them, strictly adhering to the Read-Compute-Commit pattern.

### **1.3. Guiding Principles**

The design and implementation of this layer are governed by the following core principles:

* **Centralized State Orchestration**: This layer is the central point for executing high-level data operations. It coordinates with the **Session and State Management** component, which is the definitive source of truth for session state, to ensure all state transitions are consistent and valid.
* **Immutability for Source Data**: All data parsed from the source files and stored in the Vectra database is treated as immutable with respect to its original content. A weaving session is conceptually a "snapshot" of the source files at a particular moment in time.2 State changes, such as marking a section as resolved, are managed by updating metadata flags associated with the data, not by altering the original text content. This ensures a stable and predictable analysis environment throughout the session.
* **Transactional State Changes**: Public API methods that modify the system's state are designed to be atomic. A single API call to perform an action, such as resolving a similarity group member or adding a new content block, will result in a complete and consistent state transition. This prevents the system from entering partial or inconsistent states.
* **Clear API Contracts**: The public API is defined with strong types and comprehensive documentation. This interface serves as a formal contract between the Data Access & Services Layer and the rest of the application, ensuring predictable interactions and facilitating parallel development of different components.

The functional requirements of the system present a significant architectural consideration: the need to manage two distinct forms of state. The first is the collection of source content—sections and terms—which is relatively static, stored in a flat structure, and optimized for vector-based similarity searches within the Vectra database.2 The second is the highly dynamic, hierarchical tree structure of destination documents, which must be held in memory to support rapid and interactive authoring operations like drag-and-drop reordering, addition, and deletion of content blocks.1
The Data Access & Services Layer is architected to bridge these two worlds. Its central design challenge is to provide a single, cohesive API that conceals this underlying complexity. A UI component requesting the structure of a destination document should not need to be aware that it is interacting with a complex in-memory AST. Likewise, a component displaying similarity groups should not need to know that this data originates from a query against a Vectra vector index. To address this, the layer's internal structure will be composed of two distinct sub-modules: a "Source Data Provider" for interfacing with Vectra, and a "Destination Document Model Manager" for managing the in-memory ASTs. The public API will then compose functions from these two modules to fulfill requests from the rest of the application, presenting a unified and simplified interface.

## **2\. Core Data Models and State Representation**

This section provides the canonical TypeScript definitions for all data structures managed by and exposed from the Data Access & Services Layer. These interfaces form the basis of the API contracts and ensure type safety throughout the application.

### **2.1. Database Entity Models (Vectra Schema)**

These models define the structure of data as it is stored in the session-specific Vectra vector database. These entities are generated by the Source Processing Pipeline.1

TypeScript

/\*\*
 \* Represents a logical block of content (e.g., paragraph, heading with content)
 \* parsed from a source Markdown file and stored in the Vectra database.
 \*/
interface SourceSection {
  id: string; // UUID for unique identification
  sourceFileUri: string; // The URI of the source file
  content: string; // The raw Markdown content of the section
  embedding: number; // The vector embedding for similarity search
  metadata: {
    startLine: number; // The starting line number in the source file
    endLine: number; // The ending line number in the source file
    groupId?: string; // The ID of the SimilarityGroup this section belongs to, if any
    isResolved: boolean; // Flag indicating if the user has addressed this section
    isPopped: boolean; // Flag indicating if this section was a false positive popped from a group
  };
}

TypeScript

/\*\*
 \* Represents a potential glossary term and its definition, extracted from a
 \* source file and stored in the Vectra database.
 \*/
interface GlossaryTerm {
  id: string; // UUID for unique identification
  sourceFileUri: string; // The URI of the source file
  term: string; // The extracted keyphrase or term
  definition: string; // The surrounding sentence or paragraph as a definition
  embedding: number; // The vector embedding of the definition for similarity search
  metadata: {
    groupId?: string; // The ID of the TermGroup this term belongs to, if any
    isResolved: boolean; // Flag indicating if the user has addressed this term
  };
}

### **2.2. In-Memory State Models (Destination Document AST)**

This model represents the hierarchical structure of a destination document. It is held in memory to facilitate efficient real-time manipulation by the user through the Destination Document Outliner.2

TypeScript

/\*\*
 \* Represents a single node in the hierarchical structure of a destination document.
 \* This corresponds to a block element in the Markdown AST.
 \*/
interface ContentBlock {
  id: string; // A session-stable UUID for the block
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'blockquote'; // The type of Markdown block
  content: string; // The raw Markdown content for this block
  summary: string; // An AI-generated summary for display in the outliner view
  children: ContentBlock; // Child blocks, forming the document tree
  metadata: {
    sourceSectionId?: string; // If inserted from a source, this links back to the original SourceSection
  };
}

### **2.3. Service-Level Aggregate Models**

These models are constructed on-the-fly by the Data Access & Services Layer. They represent logical groupings of the underlying database entities and are returned to the UI to populate views like the Sections View and Terms View.2

TypeScript

/\*\*
 \* Represents a group of two or more SourceSections identified as
 \* semantically similar. This is an aggregate model constructed by the service.
 \*/
interface SimilarityGroup {
  id: string; // A UUID corresponding to the 'groupId' in SourceSection metadata
  memberSections: SourceSection; // The collection of sections in this group
  isResolved: boolean; // True only when all member sections are resolved
}

TypeScript

/\*\*
 \* Represents a group of two or more GlossaryTerms identified as
 \* semantically similar. This is an aggregate model constructed by the service.
 \*/
interface TermGroup {
  id: string; // A UUID corresponding to the 'groupId' in GlossaryTerm metadata
  memberTerms: GlossaryTerm; // The collection of terms in this group
  isResolved: boolean; // True only when all member terms are resolved
}

### **2.4. Canonical Glossary Model**

This model represents a final, resolved glossary definition. The collection of these definitions is managed centrally by the service and is used during the document publishing phase.1

TypeScript

/\*\*
 \* Represents a single, authoritative glossary definition that has been
 \* resolved by the user through the Glossary Editor.
 \*/
interface CanonicalDefinition {
  term: string; // The canonical term, possibly including a user-provided qualifier
  definition: string; // The final, authoritative definition text
  source: 'selected' | 'merged' | 'qualified'; // The method by which this definition was created
}

The following table provides a high-level summary of these core data models for quick reference.

| Model Name | Purpose | Persistence | Key Properties |
| :---- | :---- | :---- | :---- |
| SourceSection | A logical block of content from a source file. | Vectra DB | id, content, embedding, isResolved |
| ContentBlock | A node in the destination document's structural tree. | In-Memory AST | id, type, content, children |
| SimilarityGroup | A collection of semantically similar SourceSections. | Service Aggregate | id, memberSections, isResolved |
| CanonicalDefinition | A resolved, authoritative glossary entry. | In-Memory List | term, definition |

## **3\. Public API Specification**

This section defines the complete public interface for the DataAccessService. This API serves as the formal contract between this layer and all other components of the extension. The design of this API prioritizes clarity and intent, with method names reflecting user workflows rather than generic data operations. For instance, a method is named popSectionFromSimilarityGroup instead of a more generic updateRecord. This approach encapsulates the business logic associated with a user's action directly within the service layer. This simplifies the logic within the Command Handlers, reducing them to simple orchestrators that translate UI events into high-level service calls, thereby improving the maintainability and readability of the entire application.

### **3.1. Source Analysis Queries**

These methods provide read-only access to the analyzed source document data stored in the Vectra database. They are primarily used to populate the various TreeViews in the "Weaving View" sidebar.1

| Method Signature | Description |
| :---- | :---- |
| getSimilarityGroups(): Promise\<SimilarityGroup\> | Fetches all currently unresolved SimilarityGroups. This method is used to populate the "Similarity Groups" section of the Sections View. |
| getUniqueSections(): Promise\<SourceSection\> | Fetches all SourceSections that are not part of any group and are currently unresolved. Used to populate the "Unique Sections" part of the Sections View. |
| getTermGroups(): Promise\<TermGroup\> | Fetches all unresolved TermGroups for display in the Terms View. |
| getUniqueTerms(): Promise\<GlossaryTerm\> | Fetches all GlossaryTerms that are not part of any group and are currently unresolved, for display in the Terms View. |

### **3.2. Destination Document CRUD Operations**

These methods provide comprehensive control over the in-memory AST of a destination document. They power the interactive functionality of the Destination Document Outliner, including adding, editing, deleting, and reordering content.1

| Method Signature | Description |
| :---- | :---- |
| getDestinationDocumentRoot(docUri: string): Promise\<ContentBlock\> | Retrieves the root ContentBlock of the specified destination document's AST, allowing the UI to render the entire document structure. |
| addContentBlock(docUri: string, parentId: string, block: Partial\<ContentBlock\>, index?: number): Promise\<ContentBlock\> | Adds a new ContentBlock as a child of the block specified by parentId. If the index is omitted, the new block is appended. Returns the fully created block, including its new system-generated ID. |
| updateContentBlock(docUri: string, blockId: string, updates: Partial\<ContentBlock\>): Promise\<void\> | Calculates the result of updating a specific ContentBlock and returns the newly computed AST. The calling service (typically a Command Handler) is responsible for committing this new AST to the Session Manager..2 |
| deleteContentBlock(docUri: string, blockId: string): Promise\<void\> | Calculates the result of removing a ContentBlock and its descendants, then returns the newly computed AST. The calling service (typically a Command Handler) is responsible for committing this new AST to the Session Manager. |
| moveContentBlock(docUri: string, blockId: string, newParentId: string, newIndex: number): Promise\<void\> | Calculates the result of moving a ContentBlock to a new parent and position, then returns the newly computed AST. The calling service (typically a Command Handler) is responsible for committing this new AST to the Session Manager. |

### **3.3. State Mutation Services**

These methods are responsible for modifying the state of entities within the Vectra database, typically as a result of user actions within the Comparison Editor or Terms View.2

| Method Signature | Description |
| :---- | :---- |
| resolveSourceSection(sectionId: string): Promise\<void\> | Marks a single, unique SourceSection as resolved in the database. This is typically called after a unique section is inserted into a destination document. |
| resolveSimilarityGroupMember(groupId: string, sectionId:string, resolution: 'inserted' | 'deleted'): Promise\<void\> | Marks a member of a SimilarityGroup as resolved. The resolution parameter tracks the user's action (e.g., "Insert" or "Delete" in the Comparison Editor). The service will internally check if this action resolves the entire group. |
| popSectionFromSimilarityGroup(groupId: string, sectionId: string): Promise\<SourceSection\> | Handles a false positive by removing a section from its group (the "Pop" command 2). This method updates the metadata for both the section and the group, potentially dissolving the group if fewer than two members remain. It returns the newly unique section so the UI can update accordingly. |
| removeTerm(termId: string): Promise\<void\> | Handles a false positive for a glossary term by effectively removing the GlossaryTerm from the session. This is triggered by the "Remove Term" context menu command.2 |

### **3.4. Glossary Management Services**

This set of methods manages the creation and retrieval of the session's central list of canonical glossary definitions.1

| Method Signature | Description |
| :---- | :---- |
| addCanonicalDefinition(definition: CanonicalDefinition): Promise\<void\> | Adds a new resolved definition to the central glossary list. This is called by the Glossary Editor after the user chooses to "Select This One," "Qualify," or "Merge with AI".2 |
| getCanonicalGlossary(): Promise\<CanonicalDefinition\> | Retrieves the entire list of canonical definitions for the current session. |
| getScopedGlossaryForDocument(docUri: string): Promise\<CanonicalDefinition\> | Performs the final glossary scoping pass required by the "Publish" command.2 It scans the content of a specific destination document and returns only the canonical definitions for terms that are actually present in that document's text. |

## **4\. Internal Logic and Data Source Interactions**

This section details the internal implementation strategies for the public API, focusing on how the service will interact with its primary dependencies: the Vectra vector database and the in-memory destination document ASTs.

### **4.1. Interfacing with the Vectra Vector Database**

* **Querying for Groups**: The getSimilarityGroups method will not perform a new vector search on every call, as this would be computationally expensive. Instead, it will rely on the groupId metadata assigned during the initial Source Processing Pipeline.1 The implementation will involve scanning all
  SourceSection items in the Vectra index, collecting the set of unique groupIds, and then constructing the SimilarityGroup aggregate objects by fetching all sections associated with each ID. This approach efficiently reconstructs the groups from the persisted flat data structure.
* **Updating State**: State mutation methods such as resolveSimilarityGroupMember will execute targeted metadata updates. The service will find the Vectra item corresponding to the sectionId and modify its metadata.isResolved property. This avoids rewriting the entire data object and ensures efficient state changes.
* **Handling "Pop" Operation**: The popSectionFromSimilarityGroup method represents a complex transaction that must be executed atomically. The sequence of operations is as follows:
  1. Locate the SourceSection item matching the provided sectionId.
  2. Update its metadata by setting metadata.isPopped to true and metadata.groupId to undefined.
  3. Query the database for all other sections that share the original groupId.
  4. If the number of remaining, un-popped members in the group is less than two, the group is no longer valid. The service will then iterate through these remaining members and set their metadata.groupId to undefined, effectively dissolving the group and converting its former members into unique sections.

**4.2. Orchestrating Destination Document AST Modifications**

The Data Access & Services Layer does not directly own or maintain the in-memory ASTs. That is the sole responsibility of the Session and State Management component. Instead, this layer's CRUD methods orchestrate modifications by following a strict read-compute-commit flow:

1. **Read:** The method first retrieves the current, authoritative AST for the relevant destination document from the Session Manager.
2. **Compute:** It performs the necessary tree traversal and manipulation logic (e.g., finding and removing a node for `deleteContentBlock`) on a *copy* of the AST to produce a new, modified AST. This logic includes generating UUIDs for new blocks created via `addContentBlock`.
3. **Commit:** The method then calls the `SessionManager.updateDestinationDocumentAst(uri, newAst)` method, passing the URI and the newly computed AST. The Session Manager performs the actual state mutation and emits the necessary `onDestinationDocumentDidChange` event.

This pattern ensures that the DASL contains the complex business logic for tree manipulation while respecting the SSM as the single source of truth for the application's state.

## **5\. Key Workflow Implementation Sequences**

This section provides concrete, step-by-step sequences for key user workflows. These examples illustrate how the public API is orchestrated by Command Handlers to deliver the features specified for the extension.2

### **5.1. Sequence: Resolving a Section Similarity Group in the Comparison Editor**

This sequence describes the flow when a user clicks the "Insert" CodeLens on a source section within the Comparison Editor.

1. **UI Action**: The CodeLensProvider associated with the Comparison Editor's virtual document executes a command. This command is passed the necessary context: the groupId of the similarity group, the sectionId of the section being inserted, and the destinationBlockId of the target ContentBlock in the outliner.
2. **Command Handler**: The registered command handler receives these arguments. It first calls dataService.getSimilarityGroups() and filters the results to find the full SourceSection object corresponding to the sectionId to retrieve its content.
3. **Command Handler**: The handler then calls dataService.updateContentBlock(docUri, destinationBlockId, { content: sourceSection.content }). This updates the in-memory AST of the destination document, inserting the new content.
4. **Command Handler**: Finally, the handler calls dataService.resolveSimilarityGroupMember(groupId, sectionId, 'inserted') to record the resolution.
5. Data Service Logic: Inside the resolveSimilarityGroupMember method, the service performs the following:
   a. It updates the corresponding SourceSection's metadata in Vectra, setting isResolved: true.
   b. It checks if all other members of the group with the given groupId are now resolved. If they are, the service marks the entire group as resolved.
   c. This action ultimately results in the Session Manager emitting an `onSourceDataDidChange` event, signaling the UI to refresh.
6. **UI Refresh**: The Sections View, which subscribes to the onSourceDataDidChange event, receives the notification. Its event listener triggers a re-fetch of data by calling dataService.getSimilarityGroups() and dataService.getUniqueSections(). The UI then re-renders, showing the resolved group or section in a visually distinct state (e.g., grayed out or removed from the list of actionable items).

### **5.2. Sequence: Resolving a Term Group in the Glossary Editor**

This sequence details the workflow when a user selects multiple definitions in the Glossary Editor and clicks "Merge with AI."

1. **UI Action**: The JavaScript running within the Glossary Editor's Webview gathers the text content of the selected definitions and the termId for each. It then sends a message containing this data to the extension host.
2. **Command Handler**: A message handler receives this data. It invokes an external AI service (whose implementation is outside the scope of this layer) to perform the text merge.
3. **Command Handler**: Upon receiving the merged definition string from the AI service, the handler constructs a new CanonicalDefinition object: { term: '...', definition: mergedText, source: 'merged' }.
4. **Command Handler**: It then calls dataService.addCanonicalDefinition(newDefinition) to add the merged result to the session's central glossary.
5. **Command Handler**: To mark the source terms as resolved, the handler iterates through the termIds of the definitions that were part of the merge and calls a method such as dataService.resolveTerm(termId) for each one.
6. **Data Service Logic**: The service adds the new definition to its internal list of canonical definitions and updates the isResolved metadata for the source GlossaryTerm items in Vectra. This update to the session's canonical glossary and the resolution of the source terms will ultimately cause the Session Manager to emit an event, signaling the Terms View to refresh.
7. **UI Refresh**: The Terms View, subscribed to the event, refreshes its data. The now-resolved term group is removed from the list of unresolved items.

### **5.3. Sequence: Publishing a Document**

This sequence outlines the process for the "Publish" command, which generates the final Markdown file output.

1. **Command Handler**: The "Publish" command handler iterates through each destination document URI (docUri) managed by the session. For each document:
2. It calls dataService.getDestinationDocumentRoot(docUri) to retrieve the complete in-memory AST for the document.
3. It passes this AST to an internal ASTSerializer utility, which traverses the ContentBlock tree and serializes it into a single Markdown string (mainContent).
4. Crucially, it then calls dataService.getScopedGlossaryForDocument(docUri) to get the specific glossary for this document.
5. **Data Service Logic**: The getScopedGlossaryForDocument method executes the final scoping logic 2:

   a. It internally serializes the document's AST to get the full text content.
   b. It calls its internal getCanonicalGlossary() method to retrieve all resolved definitions for the session.
   c. It iterates through the list of canonical definitions and, for each one, checks if its term is present in the document's text.
   d. It returns a new, filtered array containing only the definitions for terms found within that specific document.
6. **Command Handler**: The handler receives the scoped glossary. It formats this list of definitions into a Markdown section (glossaryContent).
7. **Command Handler**: It concatenates mainContent and glossaryContent and writes the final string to a new physical file in the user's workspace.
8. After this process is repeated for all destination documents, the handler notifies the central SessionManager to terminate the current weaving session, completing the workflow.