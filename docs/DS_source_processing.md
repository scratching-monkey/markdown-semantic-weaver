

# **Design Specification: Source Processing Module**

## **1.0 System Overview and Architecture**

This document provides a comprehensive design specification for the Source Processing Module of the Markdown Semantic Weaver VS Code Extension. It details the module's architecture, data models, processing pipeline, and non-functional requirements. The intended audience for this document is the software engineering team responsible for the implementation of this module.

### **1.1 Module Purpose and Core Responsibilities**

The primary directive of the Source Processing Module is to ingest user-selected Markdown source files and transform their content into a structured, semantically indexed format. This processed data serves as the foundation for all subsequent analysis and content weaving features within the extension.1
The module's core responsibilities are enumerated as follows:

1. **Parsing**: To deconstruct the syntactic structure of source Markdown files into an Abstract Syntax Tree (AST).
2. **Segmentation**: To partition the parsed content into discrete, logical blocks, such as headings, paragraphs, and lists.
3. **Keyphrase Extraction**: To identify and extract potential glossary terms and their definitions from the text.
4. **Vectorization**: To generate high-dimensional vector embeddings for all content blocks and extracted terms, capturing their semantic meaning.
5. **Persistence**: To store the processed content, metadata, and vector embeddings in a local, on-disk vector database for the duration of a weaving session.
6. **Analysis**: To query the persisted data to identify and group semantically similar content blocks and terms.

All operations performed by this module are executed as background tasks, initiated by the user's "Add as source" action. To ensure a non-blocking user experience, the module must provide clear and continuous progress feedback to the main UI thread.1

### **1.2 Architectural Model: An Asynchronous, Local-First Pipeline**

The module is architected as a multi-stage, asynchronous data processing pipeline. Each stage is a discrete, modular unit that performs a specific transformation on the data before passing its output to the subsequent stage. This design promotes high cohesion, low coupling, and enhances the testability and maintainability of the codebase.
A foundational principle of this architecture is its "local-first" approach. The entire technology stack has been deliberately selected to operate exclusively on the user's local machine, with no reliance on external cloud services or APIs for its core processing tasks. This design choice guarantees user data privacy, enables full offline functionality, and minimizes processing latency. The cohesion of the selected technologies is central to this principle. The use of remark, a powerful JavaScript-based Markdown processor 2,
fastembed-js, a lightweight, CPU-first embedding engine built on the ONNX Runtime 4, and
Vectra, a file-system-based local vector database 6, forms a self-contained toolchain. This stack is specifically engineered to deliver sophisticated NLP capabilities within the resource constraints of a standard VS Code extension environment, a decision that informs numerous design trade-offs and non-functional requirements detailed later in this document.

### **1.3 System Boundaries and External Interactions**

The Source Processing Module operates within well-defined boundaries and interacts with a limited set of external systems and APIs.

* **Inputs**: The module's sole input is a set of one or more file Uniform Resource Identifiers (URIs) provided by the VS Code workspace API upon user invocation of the "Add as source" command.1
* **Outputs**: The primary output is the side effect of populating and persisting a Vectra vector index on the local file system. The module also exposes a query interface (API) that allows other components of the extension, such as the UI views, to retrieve the processed and analyzed data from this index.
* **Dependencies**:
  * **Visual Studio Code API**: Utilized for file system access (vscode.workspace.fs), user notifications (vscode.window.showInformationMessage), and progress indication (vscode.window.withProgress).
  * **Node.js fs Module**: Required for direct interaction with the file system, particularly for managing the Vectra index directory.
  * **Third-Party Libraries**: The module is fundamentally dependent on remark, fastembed-js, and Vectra for its core functionality.

### **1.4 High-Level Data Flow Diagram**

The following diagram illustrates the sequential flow of data through the various stages of the Source Processing Module's pipeline, from the initial ingestion of a Markdown file to the final population of the Vectra vector index.

Code snippet

graph TD
    A \--\> B{Stage 1: File Ingestion & Parsing};
    B \-- Raw Markdown String \--\> C\[remark Processor\];
    C \-- mdast (AST) \--\> D{Stage 2: Content Segmentation};
    D \-- Segmented Content Blocks \--\> E{Stage 3: Keyphrase Extraction};
    E \-- Content Blocks & Potential Terms \--\> F{Stage 4: Vector Embedding};
    F \-- Text for Batching \--\> G\[fastembed-js Engine\];
    G \-- 384-dim Vectors \--\> H\[Attach Vectors to Objects\];
    H \-- Populated Objects \--\> I{Stage 5: Data Indexing};
    I \-- Items with Metadata \--\> J\[Vectra LocalIndex\];
    J \-- Persisted to Disk \--\> K{Stage 6: Similarity Group Identification};
    K \-- Query New Items \--\> J;
    J \-- Nearest Neighbors \--\> K;
    K \-- Update Items with Group ID \--\> J;
    J \-- Final Populated Index \--\> L;

## **2.0 Data Models and Persistence Schema**

This section provides a canonical definition of the data structures used throughout the module. These models dictate the in-memory representation of data as well as the schema for its persistence on disk.

### **2.1 Core Data Entities**

The module operates on two primary data entities: ContentBlock and GlossaryTerm. These are grouped into SimilarityGroups.

* **ContentBlock**: Represents an atomic, semantically distinct unit of content derived from the source document. This corresponds to elements like a paragraph, a list, a code block, or a heading.
  * id: string (UUID v4) \- A unique identifier for the block.
  * sourceFile: string \- The workspace-relative path of the origin file.
  * blockType: string \- The type of Markdown element as identified by the AST (e.g., 'paragraph', 'heading', 'list', 'code').
  * rawContent: string \- The original, unmodified Markdown text of the block.
  * vector: number \- A 384-dimension floating-point array representing the semantic embedding of rawContent.7
  * metadata: object \- A flexible container for additional contextual information, such as start and end line numbers or the parent heading.
* **GlossaryTerm**: Represents a potential definition candidate extracted from the source text.
  * id: string (UUID v4) \- A unique identifier for the term instance.
  * term: string \- The extracted keyphrase or term itself.
  * definition: string \- The sentence or phrase identified as the definition of the term.
  * sourceFile: string \- The workspace-relative path of the origin file.
  * vector: number \- A 384-dimension floating-point array representing the semantic embedding of the definition.
* **SimilarityGroup**: Represents a collection of ContentBlock or GlossaryTerm entities that have been identified as semantically similar through vector analysis.
  * groupId: string (UUID v4) \- A unique identifier for the group.
  * memberIds: string \- An array of ids belonging to the member ContentBlock or GlossaryTerm objects.
  * groupType: 'section' | 'term' \- A discriminator indicating the type of members in the group.

### **2.2 Vectra Vector Store Schema and Metadata Strategy**

A single Vectra index will be maintained per weaving session. This index will store items representing both ContentBlocks and GlossaryTerms, facilitating cross-document similarity searches. The design of the metadata schema is of paramount importance, as it directly enables the core functionality of the application's user interface. Vectra's architecture, which allows for efficient metadata-based filtering prior to executing a vector similarity search, will be fully leveraged.6
This pre-filtering capability is not merely an optimization but a critical feature. For instance, a query from the UI will not be a simple request for "all similar vectors." Instead, it will be a more complex, state-aware query such as, "find all vectors similar to the selected item, of type 'section', that have not yet been marked as resolved by the user." Storing contentType allows the application to populate the "Sections View" and "Terms View" correctly. The resolved flag is the key mechanism for tracking user progress and filtering the views to show only actionable items. The similarityGroupId links related items together, forming the basis of the comparison and merge editors. Therefore, the metadata schema is a foundational component of the application's logic, acting as the bridge between the raw data processing and the interactive user workflow.
The following table defines the canonical schema for each item stored in the Vectra index. This schema serves as a strict contract between the data-writing pipeline and the data-reading UI layer, ensuring consistency and preventing integration errors.

| Field Name | Data Type | Description | Indexed |
| :---- | :---- | :---- | :---- |
| id | string | Unique identifier (UUID v4) for the item. Serves as the primary key for retrieval. | No |
| vector | number | The 384-dimension floating-point vector generated by fastembed-js for the item's content.8 | Yes |
| metadata.sourceFile | string | The workspace-relative path of the source Markdown file. Used for display and context. | Yes |
| metadata.contentType | 'section' | 'term' | Discriminator field to distinguish between a general content block and an extracted glossary term. Essential for UI view population.1 | Yes |
| metadata.text | string | The raw Markdown content of the section or the definition of the term. Stored for retrieval and display. | No |
| metadata.termText | string | For contentType: 'term', this stores the term itself. This field is null for sections. | Yes |
| metadata.resolved | boolean | A flag indicating if the user has addressed this item (e.g., inserted, merged, or deleted it). Defaults to false. | Yes |
| metadata.similarityGroupId | string | null | The ID of the SimilarityGroup this item belongs to. This field is null if the item is considered unique. | Yes |

### **2.3 Session State Management and On-Disk Persistence**

A "Weaving Session," as defined in the functional requirements, corresponds directly to a single Vectra index directory on the local file system.1 A central
SessionManager service will be responsible for creating, managing, and cleaning up this directory. The session is initiated implicitly upon the addition of the first source or destination file and persists until the user explicitly publishes the final documents or closes the VS Code workspace.1
The choice of Vectra introduces a significant architectural constraint that must be addressed by the design. The Vectra documentation explicitly states that the "entire Vectra index is loaded into memory" during query operations.6 While this enables extremely fast, near-instantaneous queries, it also imposes a practical limit on the total size of the session's data corpus. If a user attempts to add an exceptionally large number of source files, or a few very large files, the resulting
index.json file could grow to a size that, when loaded, exhausts the memory allocated to the VS Code extension host process. This would lead to a hard crash of the extension, providing a poor user experience. This risk must be actively mitigated. The design will incorporate a mechanism to monitor the cumulative size of source files added to a session and warn the user if a predefined threshold is exceeded, thereby managing expectations and preventing catastrophic failures.

## **3.0 The Source Processing Pipeline: A Stage-by-Stage Breakdown**

This section provides a granular, implementation-level description of each stage in the processing pipeline, from file ingestion to final similarity analysis, as outlined in the system's functional requirements.1

### **3.1 Stage 1: File Ingestion and Markdown Parsing**

* **3.1.1 Interfacing with the VS Code Workspace**: The pipeline is initiated with a file URI passed from the user action. The module will utilize the vscode.workspace.fs.readFile method to asynchronously read the file's content into a Buffer, which is then decoded into a UTF-8 string.
* **3.1.2 Parsing Markdown to AST with remark**: The raw Markdown string is fed into a remark processor instance. The core remark library, part of the unified ecosystem, is used to parse the string into a compliant mdast (Markdown Abstract Syntax Tree).2 This tree structure provides a complete and traversable representation of the document's syntax.
* **3.1.3 AST Traversal and Node Identification**: To process the document's structure, the generated AST will be traversed. The unified ecosystem provides robust utilities for this purpose, such as unist-util-visit. This utility allows for programmatic iteration over specific node types within the tree (e.g., heading, paragraph, list). The plugin-based architecture of remark offers a particularly elegant implementation path.11 Rather than performing parsing and traversal as two separate, sequential steps, a custom
  unified plugin can be developed. This plugin would hook directly into the remark processing chain, performing content segmentation (Stage 2\) as the AST is being built. This approach encapsulates the segmentation logic cleanly and aligns with the idiomatic usage of the unified toolchain.

### **3.2 Stage 2: Content Segmentation**

* **3.2.1 Defining "Logical Sections"**: For the purpose of this module, a "logical section" is formally defined as a heading node and all of its subsequent sibling content nodes, up to but not including the next heading node of the same or a higher level (e.g., an h2 section ends at the next h2 or h1). Any content that appears before the first heading in a document is aggregated into a virtual "preamble" section.
* **3.2.2 Segmentation Heuristics**: During the AST traversal, heading nodes serve as delimiters. Upon encountering a heading node, a new logical section is initiated. All subsequent sibling nodes (paragraph, list, code, blockquote, etc.) are collected and associated with this heading. This collection continues until another heading node of an appropriate level is found, which signals the start of the next section.
* **3.2.3 Generating ContentBlock Objects**: For each distinct element identified during segmentation (e.g., a paragraph, a list item, a code block), a corresponding ContentBlock object, as defined in Section 2.1, will be instantiated. A unique UUID will be generated for each object, and its rawContent and blockType will be populated directly from the AST node.

### **3.3 Stage 3: Definition and Keyphrase Extraction**

* **3.3.1 Designing the "RAST" Hybrid Extraction Algorithm**: The project specification refers to a "RAST" algorithm for keyphrase extraction.1 As this is not a publicly known algorithm, it is hereby formally defined for this project as
  **R**ule-based **A**nd **S**tatistical **T**erm-extraction. This definition is informed by established research in the field of automatic keyphrase extraction, which categorizes methods into linguistic, statistical, and hybrid approaches.12 The ambiguity in the specification provides an opportunity to engineer a tailored, two-pass hybrid algorithm that precisely fits the project's needs. This approach leverages the strengths of both methodologies: the high precision of linguistic pattern matching and the broad recall of statistical analysis.
* **3.3.2 Implementation of Linguistic Heuristics (Pass 1\)**: The first pass focuses on high-precision candidate generation using linguistic patterns. This stage will employ a series of regular expressions, and potentially a lightweight Part-of-Speech (POS) tagging library, to scan the text for common definitional sentence structures. Patterns to be targeted include:
  * \[Noun Phrase\] is defined as
  * \[Noun Phrase\], a type of
  * (stands for|is short for) \[Full Phrase\]
  * \[Acronym\]: \[Full Phrase\]
    This pass will generate a list of high-confidence GlossaryTerm candidates but may miss definitions that do not conform to these rigid patterns.
* **3.3.3 Implementation of Statistical Extraction (Pass 2\)**: The second pass focuses on high-recall candidate ranking using statistical properties of the text. The process is as follows:
  1. **Tokenization**: The entire document text is tokenized into words.
  2. **Stop Word Removal**: Common, low-information words (e.g., "the", "a", "is") are removed.
  3. **N-gram Generation**: Sequences of 2, 3, and 4 words (n-grams) are generated from the remaining tokens. These form the pool of potential keyphrases.
  4. **Scoring**: Each n-gram is assigned a score based on a simple TF-IDF (Term Frequency-Inverse Document Frequency) model. Term Frequency is the count of the n-gram within the current document. Inverse Document Frequency is calculated based on its rarity across all documents currently in the weaving session. This ensures that terms that are frequent in one document but rare overall receive a higher score.
  5. **Combination**: The final list of keyphrases is generated by combining the results of both passes. Candidates identified in the linguistic pass are given a significant score bonus. All candidates are then ranked by their final score, and the top N are selected as the extracted terms.

### **3.4 Stage 4: Vector Embedding Generation**

* **3.4.1 Integration with fastembed-js**: The module will integrate the fastembed-js library to perform vectorization. A singleton instance of the TextEmbedding class will be initialized, configured to use the BAAI/bge-small-en-v1.5 model as specified.1 To ensure a smooth user experience, the model files will either be bundled directly with the extension or downloaded and cached on the first run.
* **3.4.2 Configuring the Model**: The selected BAAI/bge-small-en-v1.5 model generates 384-dimensional vectors.8 Research on this specific model version indicates that it achieves strong performance for retrieval tasks without requiring the use of special prefixes (like "query:" or "passage:"), which simplifies the implementation logic.13
* **3.4.3 Batch Processing**: To maximize performance and efficiently utilize system resources, vectorization will be performed in batches. All rawContent strings from the collected ContentBlock and GlossaryTerm objects will be aggregated into a single array. This array will be passed to the embed method of the TextEmbedding instance in a single call. This batching strategy is significantly more performant than embedding each piece of text individually.5

### **3.5 Stage 5: Data Indexing in Vectra**

* **3.5.1 Initializing the Session Index**: A LocalIndex instance from the Vectra library will be instantiated, pointing to a unique, session-specific directory on the file system.6 The module will first check if the index already exists using
  index.isIndexCreated() and will call index.createIndex() if necessary.
* **3.5.2 Data Serialization and insertItem Operations**: The array of ContentBlock and GlossaryTerm objects, now populated with their vector embeddings, will be transformed to conform to the Vectra Item Schema defined in Section 2.2. Each transformed object will then be added to the index using the asynchronous index.insertItem() method.6
* **3.5.3 Metadata Indexing**: During the insertion process, it is critical that the metadata fields designated as "Indexed" in Table 1 (e.g., sourceFile, contentType, resolved) are correctly structured within the metadata property of the item object. This ensures that Vectra correctly indexes these fields, enabling its powerful and efficient metadata pre-filtering capabilities.6

### **3.6 Stage 6: Similarity Group Identification**

* **3.6.1 Vector Query Strategy**: After all items from a newly added source file have been successfully indexed, a similarity analysis process is initiated. For each newly added item (both sections and terms), the module will query the index to find its nearest neighbors using the index.queryItems(vector, k) method, where k is a configurable integer representing the number of neighbors to retrieve (e.g., 10).6
* **3.6.2 Post-Query Grouping Logic**: The results from the nearest neighbor query, which are returned with a similarity score, will be post-processed. A similarity score threshold must be applied to filter out irrelevant results. The BGE family of models has a known similarity distribution where scores are typically compressed into the upper range (e.g., 0.6 to 1.0).13 Therefore, a relatively high threshold (e.g., a cosine similarity score
  \>0.85) will be established empirically to identify genuinely similar items. Items that are found to be mutually similar to each other above this threshold will be clustered into a new SimilarityGroup.
* **3.6.3 Updating the Vector Store**: Once a SimilarityGroup is formed, the module must persist this relationship. This will be achieved by iterating through each member item of the group and updating its entry in the Vectra index. The similarityGroupId metadata field for each member will be set to the newly created group's unique ID. This update operation ensures that the group relationship is durably stored and can be efficiently queried by the UI layer.

## **4.0 Component Design and Responsibilities**

To ensure a modular and maintainable codebase, the Source Processing Module will be implemented as a collection of distinct classes or services, each with a single, well-defined responsibility.

* **4.1 SourceProcessingOrchestrator**: This is the high-level controller and entry point for the module. It is responsible for managing the overall execution of the processing pipeline, invoking each service in the correct sequence, handling top-level error conditions, and managing progress reporting to the VS Code UI.
* **4.2 MarkdownASTParser**: This component acts as a wrapper around the remark library. Its sole responsibility is to accept a string of Markdown text as input and return a fully parsed mdast tree. It encapsulates the specifics of remark initialization and configuration.
* **4.3 ContentSegmenter**: This service takes an mdast tree as input and implements the segmentation heuristics described in Section 3.2. Its output is an array of ContentBlock objects, populated with their content and metadata but not yet with vector embeddings.
* **4.4 TermExtractor**: This service implements the two-pass RAST algorithm defined in Section 3.3. It accepts the raw text content of a document and returns an array of GlossaryTerm objects, also without their vector embeddings.
* **4.5 EmbeddingService**: This component manages the lifecycle and configuration of the fastembed-js model. It abstracts the embedding logic by exposing a single primary method, embedBatch(texts: string): Promise\<number\>, which takes an array of strings and returns a corresponding array of vector embeddings.
* **4.6 VectorStoreInterface**: This class serves as an abstraction layer (a repository or data access object) for all interactions with the Vectra database. It handles index creation, item insertion, item updates, and all query operations. This design isolates the rest of the application from the specific implementation details of Vectra, making the system more modular and easier to adapt if the underlying vector database technology were to change in the future.

## **5.0 Interfaces and API Contracts**

This section defines the public-facing Application Programming Interface (API) of the Source Processing Module. This API serves as the contract for how other parts of the extension, particularly the UI components, will interact with the module and consume its data.

### **5.1 Public API for the Source Processing Module**

The module will expose the following asynchronous functions through a central service:

* processSourceFile(uri: vscode.Uri): Promise\<void\>: The main function that initiates the entire processing pipeline for a given source file. It returns a promise that resolves when processing is complete or rejects if a fatal error occurs.
* getSections(): Promise\<SectionUIData\>: A query function that retrieves all unique sections and section-based similarity groups from the Vectra index, formatted for consumption by the "Sections View" TreeView.
* getTerms(): Promise\<TermUIData\>: A query function that retrieves all unique terms and term-based similarity groups from the Vectra index, formatted for consumption by the "Terms View" TreeView.

### **5.2 Data Contracts for UI Consumption**

The data transfer objects (DTOs) returned by the query functions will have the following structures:

* **SectionUIData**:
  TypeScript
  interface SectionUIData {
    id: string; // For a unique item, this is the ContentBlock ID. For a group, this is the SimilarityGroup ID.
    label: string; // A truncated or summarized version of the content for display.
    isGroup: boolean; // Flag to indicate if this node represents a single section or a group.
    sourceFiles: string; // Array of source file paths involved.
    resolved: boolean; // Indicates if the group/item has been fully resolved by the user.
  }

* **TermUIData**:
  TypeScript
  interface TermUIData {
    id: string; // For a unique item, this is the GlossaryTerm ID. For a group, this is the SimilarityGroup ID.
    label: string; // The term text itself.
    isGroup: boolean; // Flag to indicate if this node represents a single term or a group.
    sourceFiles: string; // Array of source file paths where the term(s) were found.
    resolved: boolean; // Indicates if the group/item has been fully resolved by the user.
  }

## **6.0 Non-Functional Requirements and Considerations**

This section addresses critical aspects of the module's behavior that are not part of its core functionality but are essential for a robust, reliable, and user-friendly implementation.

### **6.1 Performance and Resource Management**

* **Identified Bottlenecks**: The two most computationally intensive stages of the pipeline are anticipated to be (1) vector embedding generation, which is CPU-bound, and (2) Vectra index operations, which are I/O-bound.
* **Mitigation Strategies**: To mitigate these bottlenecks, batch processing will be strictly enforced for the embedding stage, as this is the most efficient method of using the fastembed-js library.5 All file I/O operations, including reading source files and interacting with the
  Vectra index, will be performed asynchronously to prevent blocking the main VS Code extension host thread.
* **Memory Usage Constraint**: As previously discussed, the in-memory nature of the Vectra database is the most significant resource constraint.6 The
  SourceProcessingOrchestrator will implement a monitoring mechanism. It will track the cumulative file size of all source documents added to the current session. If this total size exceeds a configurable threshold (e.g., 50 MB), a warning notification will be displayed to the user, informing them of potential performance degradation or instability with very large corpora.

### **6.2 Error Handling and Recovery Strategy**

A comprehensive error-handling strategy is required to ensure the extension remains stable and responsive, even when encountering problematic input.

* **Pipeline Stage Robustness**: Each stage of the processing pipeline will be wrapped in a try...catch block to isolate failures.
* **File-Level Errors**: If an error occurs during the processing of a specific file (e.g., a parsing error due to malformed Markdown, or a file read error), that file will be skipped. A non-modal error notification will be shown to the user identifying the problematic file, and the orchestrator will proceed with the next file in the queue.
* **System-Level Errors**: If a critical, non-recoverable error occurs (e.g., the fastembed-js model fails to load, or the Vectra index directory cannot be created), the entire Markdown Semantic Weaver feature set will be gracefully disabled. A clear error message will be displayed to the user, and detailed logs will be written to the developer console.
* **Database Errors**: If an individual Vectra operation fails (e.g., insertItem), the transaction for that item will be logged, and the system will attempt to continue.

### **6.3 Progress Reporting to the User Interface**

Given that processing a large number of files can be a time-consuming operation, providing clear and continuous feedback to the user is essential.1

* **VS Code Progress API**: The SourceProcessingOrchestrator will utilize the vscode.window.withProgress API with the location set to ProgressLocation.Notification. This will display a dismissible notification that shows the status of the background task.
* **Granular Updates**: The progress indicator will be updated incrementally as the pipeline advances. The user will see messages that reflect the current state for each file being processed, such as:
  * "Synthesizing sources (1 of 5)..."
  * "Parsing 'specification.md'..."
  * "Generating embeddings for 'specification.md'..."
  * "Indexing 'specification.md'..."
    This level of granularity provides transparency and assures the user that the system is actively working.

#### **Works cited**

2. remark \- GitHub, accessed August 27, 2025, [https://github.com/remarkjs](https://github.com/remarkjs)
3. remark \- NPM, accessed August 27, 2025, [https://www.npmjs.com/package/remark](https://www.npmjs.com/package/remark)
4. qdrant/fastembed: Fast, Accurate, Lightweight Python ... \- GitHub, accessed August 27, 2025, [https://github.com/qdrant/fastembed](https://github.com/qdrant/fastembed)
5. FastEmbed by Qdrant \- Python LangChain, accessed August 27, 2025, [https://python.langchain.com/docs/integrations/text\_embedding/fastembed/](https://python.langchain.com/docs/integrations/text_embedding/fastembed/)
6. Stevenic/vectra: Vectra is a local vector database for Node ... \- GitHub, accessed August 27, 2025, [https://github.com/Stevenic/vectra](https://github.com/Stevenic/vectra)
7. FastEmbed: Qdrant's Efficient Python Library for Embedding Generation, accessed August 27, 2025, [https://qdrant.tech/articles/fastembed/](https://qdrant.tech/articles/fastembed/)
8. Supported Models \- FastEmbed, accessed August 27, 2025, [https://qdrant.github.io/fastembed/examples/Supported\_Models/](https://qdrant.github.io/fastembed/examples/Supported_Models/)
9. Vectra | teams-copilot-starter \- Microsoft Open Source, accessed August 27, 2025, [https://microsoft.github.io/teams-copilot-starter/docs/concepts/vectra.html](https://microsoft.github.io/teams-copilot-starter/docs/concepts/vectra.html)
10. remark \- markdown processor powered by plugins, accessed August 27, 2025, [https://remark.js.org/](https://remark.js.org/)
11. remarkjs/remark: markdown processor powered by plugins ... \- GitHub, accessed August 27, 2025, [https://github.com/remarkjs/remark](https://github.com/remarkjs/remark)
12. Keyphrase Extraction and Grouping Based on Association ... \- AAAI, accessed August 27, 2025, [https://cdn.aaai.org/ocs/10392/10392-46102-1-PB.pdf](https://cdn.aaai.org/ocs/10392/10392-46102-1-PB.pdf)
13. BAAI/bge-small-en-v1.5 \- Hugging Face, accessed August 27, 2025, [https://huggingface.co/BAAI/bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5)