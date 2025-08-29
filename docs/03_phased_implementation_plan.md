# **Phased Implementation Plan for the Markdown Semantic Weaver Visual Studio Code extension**

## **Executive Summary and Phased Implementation Overview**

This document outlines a comprehensive, five-phase implementation plan for the Markdown Semantic Weaver Visual Studio Code extension. The strategy is designed to mitigate risks, ensure architectural integrity, and deliver incremental value by building the application from a stable foundation upwards. The phases are structured as vertical slices of functionality rather than being aligned with component boundaries, ensuring that end-to-end workflows are validated at each stage.
The core strategic approach is as follows:

- **Phase 1: Foundational Scaffolding & Core Services.** This initial phase focuses exclusively on establishing a professional, secure, and reproducible development environment. It includes the implementation of the core architectural skeleton—the non-UI services and the central event bus—and the setup of a comprehensive, multi-layered testing harness. The objective is to de-risk the project by addressing all foundational and non-functional requirements before any significant business logic is written.
- **Phase 2: Source Data Ingestion & Analysis Pipeline.** With the foundation in place, this phase implements the complete data ingestion and processing pipeline. It delivers the capability to take user-provided source files, parse them, generate semantic embeddings, persist them in a local vector database, and perform similarity analysis. This phase completes the "input" side of the application's core functionality.
- **Phase 3: Destination Document Authoring & Core Workflow.** This phase introduces the primary user interface for authoring. It involves implementing the various tree views that display the session's state and providing the core commands for structurally manipulating destination documents (adding, deleting, and reordering content blocks). This makes the application's state visible and editable for the first time.
- **Phase 4: Advanced Weaving & Interactive Editing.** Building upon the authoring foundation, this phase delivers the high-value, specialized custom editor experiences. This includes the Block Editor for focused content changes, the Comparison Editor for resolving similar sections, and the Webview-based Glossary Editor for managing term definitions. This phase implements the most complex interactive workflows of the extension.
- **Phase 5: Productionization, Publishing, & User Onboarding.** The final phase completes the end-to-end user journey by implementing the "Publish" and "Preview" features. It also adds the final layer of polish required for a public release, including user-configurable settings, telemetry for usage analytics, and a comprehensive onboarding walkthrough to ensure user adoption and success.

This incremental methodology ensures that each phase builds upon a tested and stable predecessor, allowing for continuous integration and validation of the system's architecture and functionality throughout the development lifecycle.

### **Strategic Rationale**

The decision to structure the implementation plan using vertical, feature-oriented slices rather than a horizontal, component-based approach is a deliberate strategic choice aimed at maximizing development velocity and minimizing integration risk. A component-based plan (e.g., "Phase 1: Build Data Access Layer," "Phase 2: Build UI Layer") often delays the integration of disparate parts of the system until late in the development cycle. This can hide fundamental architectural flaws or incorrect assumptions about component interactions, which are then costly to remedy.
In contrast, the vertical slicing approach ensures that a tangible, testable piece of end-to-end functionality is delivered in each phase. For example, Phase 2 delivers not just the SourceProcessingModule in isolation, but the full workflow from a user invoking the addSource command to the data being queryable via the DataAccessService. This forces early integration between the CommandHandlerService, the processing pipeline, and the data layer, validating their contracts and interactions at the earliest possible stage. This methodology provides a constant feedback loop on the health of the overall architecture and delivers demonstrable progress that aligns more closely with user-centric workflows.

### **Phase Overview**

The following table provides a high-level summary of the five-phase implementation plan, outlining the primary objective and key deliverables for each stage of the project.

| Phase | Title                                            | Primary Objective                                                                                                                               | Key Deliverables                                                                                                                                                                 | **Status** |
| :---- | :----------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- |
| **1** | Foundational Scaffolding & Core Services         | To establish a stable, secure, and testable development foundation and implement the core, non-UI architectural skeleton.                       | Configured Dev Environment, Workspace Trust Implementation, Multi-Layered Testing Harness, Core Service Singletons (SessionManager, DataAccessService), Unified Logging Service. | ✅ **Complete** |
| **2** | Source Data Ingestion & Analysis Pipeline        | To implement the end-to-end asynchronous pipeline for processing source files into a queryable, semantically indexed vector database.           | Functional SourceProcessingModule, Populated Vectra Vector Index, DataAccessService Query Methods, Unit & Integration Tests for Data Pipeline.                                   | ✅ **Complete** |
| **3** | Destination Document Authoring & Core Workflow   | To build the core authoring UI, enabling users to create, view, and structurally manipulate destination documents in response to state changes. | Reactive TreeView UI Components, Document & Content Block CRUD Commands, Implementation of Read-Compute-Commit Pattern.                                                          | ✅ **Complete** |
| **4** | Advanced Weaving & Interactive Editing           | To deliver the specialized, high-value custom editor experiences for content weaving, comparison, and glossary management.                      | Functional Block Editor, Comparison Editor (with CodeLenses), and Glossary Editor (Webview), Data Resolution Logic, "Golden Path" E2E Test.                                      | ✅ **~90% Complete** |
| **5** | Productionization, Publishing, & User Onboarding | To complete the end-to-end user workflow with publishing capabilities and add the final polish for a production release.                        | Functional "Publish" & "Preview" Commands, Document Serialization Service, User Settings, Telemetry, Onboarding Walkthrough, Packaged .vsix File.                                | 🔄 **In Progress** |

## **Phase 1 \- Foundational Scaffolding and Core Services**

### **Goal**

The primary objective of Phase 1 is to establish a stable, secure, and professional-grade development foundation and to implement the architectural "skeleton" of the extension. This phase is dedicated to mitigating foundational risks before feature development commences. By addressing the P0 ("blocker") and P1 ("high priority") items identified during the architectural analysis, this phase ensures that all subsequent work is built upon a solid, testable, and maintainable base.1

### **Deliverables**

- A fully configured and reproducible containerized development environment (devcontainer.json).
- A secure extension that correctly implements VS Code's Workspace Trust model.
- A defined strategy and initial implementation for handling large Machine Learning (ML) model assets via post-install download.
- A complete, multi-layered testing harness configured for Unit and Integration tests using Mocha.
- The core, non-UI service singletons (SessionManager, DataAccessService, CommandHandlerService) with their basic interfaces, dependency injection wiring, and event systems in place.
- A unified, singleton-based LoggerService for diagnostics.

### **Detailed Breakdown**

#### **Environment and Security (P0 Tasks)**

These tasks are the highest priority and must be completed before any other development work begins. A failure to establish a consistent development environment introduces systemic friction that impedes all future work, while neglecting security fundamentals creates a poor and untrustworthy user experience from the outset.1

- **Task: Establish .devcontainer Configuration:** Implement the devcontainer.json file as specified in the foundational scaffolding report.1 This configuration will use the
  mcr.microsoft.com/devcontainers/typescript-node:18 base image to provide a standardized Node.js and TypeScript environment. It will automatically install essential VS Code extensions like ESLint, Prettier, and Jest for all developers, enforcing code quality and a consistent workflow. A postCreateCommand will be configured to run npm install, ensuring all project dependencies are installed automatically upon container creation. This declarative approach eliminates "works on my machine" problems and guarantees that every developer, as well as the Continuous Integration (CI) server, operates within an identical toolchain.1
- **Task: Implement Workspace Trust Support:** The extension's core functionality relies on reading and writing files in the user's workspace, a security-sensitive operation.1 To align with VS Code's security model, the
  capabilities.untrustedWorkspaces property must be added to package.json with a value of { "supported": "limited" }. This declaration allows the extension's UI to remain visible in Restricted Mode while disabling its functionality. Initial stubs for the command handlers will be implemented with checks using the vscode.workspace.isTrusted API property to conditionally enable or disable any commands that perform file system operations, ensuring no actions are taken without explicit user consent.1
- **Task: Define and Implement ML Model Asset Strategy:** The specified BAAI/bge-small-en-v1.5 model is a large binary asset that should not be bundled directly into the extension's .vsix package, as this would lead to a bloated and slow installation experience.1 Therefore, a post-install download strategy will be implemented. The model files will be explicitly excluded from the package via the
  .vscodeignore file. A dedicated service will be created that, upon first activation, checks for the model's existence in a dedicated storage location (ExtensionContext.globalStorageUri). If the model is not found, it will initiate a background download, providing clear user feedback via the vscode.window.withProgress API. This "lazy loading" approach is a critical best practice for managing large assets in VS Code extensions.1

#### **Quality and Observability (P0/P1 Tasks)**

The testing framework and logging infrastructure must be established before any significant business logic is written. This enables a Test-Driven Development (TDD) approach from the project's inception and provides essential debugging capabilities that will accelerate all subsequent development phases.

- **Task: Set up Mocha Testing Harness:** The project will be configured with the standard VS Code extension testing stack, including Mocha as the test runner, @vscode/test-electron for running tests within a live extension host, and sinon for creating mocks and stubs.1 The directory structure will be created with
  test/unit for tests that run in a standard Node.js environment and test/integration for tests that require access to the VS Code API. This establishes the foundational tooling for all future quality assurance work.1
- **Task: Implement LoggerService:** A singleton LoggerService will be created to encapsulate all diagnostic logging. This service will wrap a VS Code OutputChannel (vscode.window.createOutputChannel) and expose standard logging methods (trace, info, warn, error). This centralizes logging, making it easy to instrument code and providing a consistent place for developers and users to find diagnostic information.1

#### **Core Architectural Skeleton**

The final step of this phase is to implement the core services as singletons, focusing on their interfaces, dependency injection, and the central event bus mechanism. This creates a testable and extensible architectural structure upon which all features will be built.

- **Task: Implement SessionManager Singleton and State Machine:** The SessionManager class will be implemented as a singleton, serving as the single, authoritative source of truth for the application state.8 The core state machine logic will be implemented to manage transitions between
  Inactive, Initializing, Active, and Terminating states. Crucially, the event emitter system, using vscode.EventEmitter, will be established for all session-level events defined in the design specification, such as onSessionDidStart, onSessionWillEnd, and onDestinationDocumentDidChange.8 The initial
  WeavingSessionState interface will be defined, establishing the data contract for the application's state.8
- **Task: Implement DataAccessService and CommandHandlerService Stubs:** The singleton classes for the DataAccessService and CommandHandlerService will be created. The CommandHandlerService will be designed to receive instances of the SessionManager and DataAccessService via dependency injection in its constructor.9 An initial test command will be registered to verify that the dependency injection wiring is correct and that the services can communicate as expected.

The early and robust implementation of the SessionManager's event bus is the most critical architectural task of this phase. The entire application's reactivity and adherence to a unidirectional data flow pattern hinges on this event system.8 By establishing this central communication channel in Phase 1, before any UI components are built, the project validates its core architectural philosophy at the earliest possible stage. Integration tests can be written immediately to verify that triggering a state change in the
SessionManager correctly fires the corresponding event. This proactively de-risks the most complex interaction pattern in the application, preventing the need for significant refactoring in later phases when UI components begin to depend on this event-driven model for updates.

## **Phase 2 \- Source Data Ingestion and Analysis Pipeline**

### **Goal**

The objective of Phase 2 is to implement the complete, end-to-end asynchronous pipeline for processing source Markdown files. This phase focuses on the "input" side of the application, building upon the foundational services from Phase 1\. It will deliver the full capability to ingest raw user files, transform them into a structured and semantically rich format, and persist them in a queryable local vector index.

### **Deliverables**

- A fully functional SourceProcessingModule that executes the multi-stage data pipeline as a background task.
- A populated, session-specific Vectra vector database on disk containing processed ContentBlock and GlossaryTerm entities with their associated vector embeddings and metadata.
- The ability for other services to query the DataAccessService and retrieve unique sections, unique terms, and identified similarity groups.
- A comprehensive suite of unit tests for the standalone segmentation and keyphrase extraction algorithms.
- Integration tests that verify the end-to-end workflow, from command invocation to correct data indexing.

### **Detailed Breakdown**

#### **Pipeline Implementation**

This workstream involves building out the discrete, testable stages of the SourceProcessingModule as specified in its design document.11 The architecture is an asynchronous, local-first pipeline that ensures user data privacy and full offline functionality.11

- **Task: Implement File Parsing and Segmentation:** The pipeline will begin with a MarkdownASTParser component that uses the remark library to parse raw Markdown text into an Abstract Syntax Tree (AST).11 A ContentSegmenter service will then traverse this AST, using heading nodes as delimiters to partition the content into logical sections. For each distinct element (paragraph, list, etc.), a ContentBlock object will be instantiated with its content, type, and source metadata.11
- **Task: Implement Keyphrase Extraction (RAST Algorithm):** A TermExtractor service will implement the specified two-pass "Rule-based And Statistical Term-extraction" (RAST) algorithm.11 The first pass will use linguistic heuristics (regular expressions) to identify high-confidence definitional patterns. The second pass will use a statistical TF-IDF model to score and rank n-grams from the text. The results of both passes will be combined to generate a final list of GlossaryTerm objects.11
- **Task: Implement Vector Embedding:** An EmbeddingService will be created to manage the fastembed-js library and the BAAI/bge-small-en-v1.5 model.1 This service will expose a method to perform batch processing, taking an array of text strings from the ContentBlock and GlossaryTerm objects and efficiently generating their 384-dimension vector embeddings in a single operation.11
- **Task: Implement Data Indexing:** A VectorStoreInterface will be implemented as an abstraction layer over the Vectra library.11 This service will be responsible for creating a session-specific index on disk and inserting the vectorized items. Each item will be stored with the full metadata schema, including contentType, resolved status, and sourceFile, to enable efficient, state-aware queries later on.11
- **Task: Implement Similarity Grouping:** The final stage of the pipeline will perform similarity analysis. For each newly indexed item, a nearest-neighbor query will be executed against the Vectra index. A cosine similarity threshold (e.g., \>0.85) will be applied to the results to identify genuinely similar items.11 Items that are mutually similar will be clustered into a SimilarityGroup, and their corresponding entries in the Vectra index will be updated with a shared similarityGroupId.11

#### **Service and Command Integration**

This workstream connects the newly implemented pipeline to the architectural skeleton established in Phase 1\.

- **Task: Implement handleAddSource Command Logic:** The handleAddSource command in the CommandHandlerService will be fully implemented. This handler will orchestrate the entire process: it will first call sessionService.startSessionIfNeeded(), then wrap the call to the SourceProcessingModule within the vscode.window.withProgress API to provide non-blocking feedback to the user. The progress indicator will be updated with granular messages as each file moves through the pipeline stages (e.g., "Parsing 'file.md'...", "Generating embeddings...").9
- **Task: Implement DataAccessService Query Methods:** The read-only query methods in the DataAccessService (getSimilarityGroups, getUniqueSections, getTermGroups, etc.) will be implemented. These methods will use the VectorStoreInterface to query the Vectra index, leveraging metadata filters (e.g., contentType, resolved: false) to retrieve the precise data needed to populate the UI views in the next phase.14

#### **Quality Assurance**

- **Task: Write Unit Tests:** Dedicated unit tests will be created for the ContentSegmenter and TermExtractor services. These tests will run in isolation, providing sample Markdown inputs and asserting that the services produce the expected ContentBlock and GlossaryTerm objects, respectively. This verifies the correctness of the core data transformation logic.1
- **Task: Write Integration Tests:** An integration test will be written for the markdown-semantic-weaver.addSource command. This test will use the @vscode/test-electron runner to programmatically execute the command on a fixture file. After the command completes, the test will use the DataAccessService to query the now-populated index and assert that the expected number of sections and terms have been indexed with the correct content and metadata.1

The source processing pipeline is a long-running, multi-stage, asynchronous operation involving file I/O, CPU-intensive NLP, and further database I/O.11 A failure at any stage for a single file—due to corrupted content, parsing errors, or permissions issues—must not compromise the stability of the entire extension or halt the processing of other files. The design explicitly calls for handling such failures on a per-file basis.8 Therefore, the implementation of the pipeline must treat robust error handling as a core architectural pattern, not an afterthought. Each stage of the pipeline for a given file will be wrapped in its own error handling logic. The
SourceProcessingOrchestrator will be responsible for catching these isolated failures, logging them in detail using the LoggerService from Phase 1, presenting a non-modal error notification to the user (e.g., via vscode.window.showErrorMessage), and gracefully continuing to process the next file in the queue. This ensures the extension remains stable, responsive, and provides clear diagnostic feedback even when encountering problematic input data.15

## **Phase 3 \- Destination Document Authoring and Core Workflow**

### **Goal**

The objective of Phase 3 is to implement the core authoring experience, enabling users to create, manage, and structurally edit destination documents. This phase focuses on the "output" side of the application, building the primary interactive loop where users can view the application's state and modify it. It brings the abstract data models to life through a reactive user interface.

### **Deliverables**

- Functional "Destination Documents" and "Destination Document Outliner" TreeView UI components that automatically refresh in response to state changes.
- Fully implemented command handlers for the entire lifecycle of destination documents (adding existing files, creating new ones, deleting them).
- Fully implemented command handlers for structural editing of content blocks within the outliner (add, delete, move).
- Functional, read-only "Sections View" and "Terms View" that display the analysis results generated in Phase 2\.
- A comprehensive suite of integration tests verifying the functionality of all new commands and the reactivity of the UI.

### **Detailed Breakdown**

#### **UI Provider Implementation**

This workstream focuses on building the VS Code TreeDataProvider implementations that will render the session state to the user in the extension's custom sidebar view.

- **Task: Implement DestinationDocumentsProvider:** A TreeDataProvider will be created for the top-level "Destination Documents" view. Its getChildren method will read the destinationDocuments map from the SessionManager's state object and return a TreeItem for each document. Critically, this provider will subscribe to the SessionManager's onDestinationDocumentDidChange event. The event listener will call the provider's internal \_onDidChangeTreeData.fire() method, which signals to VS Code that the view is stale and needs to be refreshed.8
- **Task: Implement DestinationDocumentOutlinerProvider:** A second, more complex TreeDataProvider will be implemented for the outliner view. This provider will be responsible for rendering the hierarchical structure of a single, currently selected destination document. Its getChildren method will recursively traverse the ast property of the corresponding DestinationDocumentModel to build the tree of ContentBlock nodes. It will also subscribe to the onDestinationDocumentDidChange event to trigger refreshes when the underlying AST is modified.10
- **Task: Implement SectionsViewProvider and TermsViewProvider:** Two additional TreeDataProviders will be created for the read-only analysis views. These providers will use the query methods implemented in the DataAccessService during Phase 2 (e.g., getSimilarityGroups) to fetch their data. They will subscribe to a relevant state change event (e.g., onSourceDataDidChange) to know when to re-fetch data and refresh their views.

#### **State Mutation Command Implementation**

This workstream implements the command handlers that orchestrate all state changes related to destination documents. All implementations will strictly adhere to the "Read-Compute-Commit" architectural pattern, ensuring a clear separation of concerns and predictable state transitions.10

- **Task: Implement Document Lifecycle Commands:** The logic for the handleAddDestination and handleAddNewDestinationDocument commands will be fully implemented.9 A new
  handleDeleteDestinationDocument command will also be created. These handlers will call the appropriate methods on the SessionManager (e.g., addDestinationDocument, createNewDestinationDocument) to directly mutate the list of destination documents in the central state.8
- **Task: Implement handleDeleteContentBlock:** The full workflow for deleting a content block, as detailed in the definitive architectural blueprint, will be implemented.10 The command handler will:
  1. **Read:** Get the active document's URI from the sessionService.
  2. **Compute:** Call this.dataAccessService.computeAstWithBlockDeleted(docUri, blockId), delegating the complex tree manipulation logic.
  3. **Commit:** Receive the newAst object from the dataAccessService and commit it to the single source of truth by calling this.sessionService.updateDestinationDocumentAst(docUri, newAst). The sessionService then performs the atomic state update and emits the onDestinationDocumentDidChange event, triggering the UI refresh.8
- **Task: Implement handleMoveContentBlock and handleAddContentBlock:** These handlers will be implemented following the exact same "Read-Compute-Commit" pattern. They will orchestrate the workflow by calling corresponding computation methods on the DataAccessService (e.g., moveContentBlock, addContentBlock) and then committing the resulting new AST to the SessionManager.9

#### **Quality Assurance**

- **Task: Write Integration Tests for Commands:** For each new command, an integration test will be written. These tests will programmatically execute the command via vscode.commands.executeCommand. Using sinon stubs, the tests will assert that the correct service-layer methods were invoked with the expected arguments, verifying the orchestration logic of the command handlers.1
- **Task: Write Integration Tests for UI Reactivity:** Tests will be created to validate the event-driven UI updates. These tests will programmatically modify the state within a mocked SessionManager, manually fire the corresponding state-change event, and then assert that a subsequent call to the relevant TreeDataProvider's getChildren() method returns a tree structure that reflects the new state. This directly tests the crucial link between state mutation and UI rendering.1

The design for the ContentBlock data model includes an id: string property described as a "session-stable UUID".14 This is not a minor implementation detail; it is the fundamental mechanism that enables all interactive editing. When a user clicks an action icon (like "Delete") on a tree item, the command handler receives the context of that specific item.10 To reliably instruct the
DataAccessService which node to remove from the AST, an identifier that is immune to changes in content or position is required. Line numbers, indices, or content hashes are brittle and unreliable. A unique, stable ID is the only robust solution. This requirement has a direct implication for the implementation: the logic within the DataAccessService's addContentBlock method must be responsible not only for adding a new node to the AST but also for generating a new UUID and attaching it to that block. This subtle but critical responsibility underpins the entire interactive authoring model and must be implemented correctly to ensure the stability of all subsequent editing features.

## **Phase 4 \- Advanced Weaving and Interactive Editing**

### **Goal**

The goal of Phase 4 is to deliver the high-value, specialized custom editor experiences that form the core of the content weaver workflow. This phase builds directly upon the data pipeline from Phase 2 and the authoring foundation from Phase 3, layering on the complex interactive UIs that allow users to compare, merge, and refine content.

### **Deliverables**

- A fully functional, in-memory **Block Editor** for focused, distraction-free editing of individual content blocks and term definitions.
- A fully functional **Comparison Editor** featuring a read-only virtual document pane for source sections, interactive CodeLenses for actions ("Insert," "Delete," "Pop"), and contextual CodeActions for the "Merge with AI" feature.
- A fully functional, Webview-based **Glossary Editor** with a custom card-based UI and a robust, well-defined message-passing protocol for communication with the extension host.
- Implemented DataAccessService methods for resolving the state of source sections and terms (e.g., marking them as resolved or popped from a group).
- The initial End-to-End (E2E) test case for the "golden path" user workflow, validating the integration of all major components.

### **Detailed Breakdown**

#### **Block Editor Implementation**

The implementation will begin with the simplest custom editor to validate the pattern of opening and managing temporary, in-memory documents.

- **Task: Implement BlockEditorService:** A singleton BlockEditorService will be created as designed.17 This service will handle opening new, untitled documents using
  vscode.workspace.openTextDocument({ content:..., language: 'markdown' }). It will maintain an internal map associating the URI of the temporary document with the ID of the content block being edited. A listener for the vscode.workspace.onDidCloseTextDocument event will be registered. When a managed document is closed, this listener will retrieve the final content and call the DataAccessService to persist the change back to the central state model, ensuring that user edits are captured reliably even without an explicit save action.17

#### **Comparison Editor Implementation**

This is a complex composite UI that requires the careful orchestration of multiple, distinct VS Code API providers, all targeting the same custom URI scheme.

- **Task: Implement ComparisonVirtualProvider:** A TextDocumentContentProvider will be implemented and registered for a custom markdown-semantic-weaver-compare URI scheme. Its provideTextDocumentContent method will fetch the data for a given similarity group from the DataAccessService, concatenate the source sections into a single Markdown string, and apply formatting (e.g., strikethrough for resolved items) based on their state.17
- **Task: Implement ComparisonCodeLensProvider:** A CodeLensProvider will be created to inject the interactive commands directly into the virtual document. Its provideCodeLenses method will parse the virtual document's text, identify the headers for each unresolved section, and create CodeLens objects that trigger the "Insert," "Delete," and "Pop" commands with the correct contextual arguments (similarityGroupId, sectionId).17
- **Task: Implement ComparisonCodeActionProvider:** A CodeActionProvider will be implemented to provide the "Merge with AI" functionality. Its provideCodeActions method will be triggered on text selection. It will analyze the selection to determine if it spans at least two unresolved source sections. If it does, it will return a CodeAction that executes the AI merge command.17

#### **Glossary Editor Implementation**

This feature requires both backend Webview management and the development of a self-contained front-end application.

- **Task: Implement GlossaryWebviewManager:** A singleton manager will be created to handle the lifecycle of the Glossary Editor's Webview panel. This manager will be responsible for creating the panel with the correct options (enableScripts: true, retainContextWhenHidden: true), loading the base HTML content, and enforcing a strict Content Security Policy (CSP) for security. It will also register a listener for the panel.webview.onDidReceiveMessage event to handle communication from the front-end.17
- **Task: Develop Webview Front-End Application:** A self-contained front-end application will be developed using vanilla TypeScript, HTML, and CSS to minimize bundle size and dependencies. The script will establish a bidirectional message-passing protocol with the extension host. Upon receiving an init message with the term data, it will dynamically render the card-based UI. Event listeners on the action buttons ("Select This One," "Qualify," etc.) will gather the necessary context from data attributes on the DOM elements and use the acquireVsCodeApi() interface to postMessage back to the extension host, triggering the appropriate state changes.17

#### **Backend Logic and E2E Testing**

- **Task: Implement Resolution Logic:** The state mutation methods in the DataAccessService that are called by the new editor commands will be implemented. This includes methods like resolveSimilarityGroupMember, popSectionFromSimilarityGroup, and addCanonicalDefinition, which modify the state of entities within the Vectra database and the in-memory glossary.14
- **Task: Set up E2E Testing Framework:** The project will be configured with an E2E testing framework such as WebdriverIO or vscode-extension-tester. This involves setting up the necessary configuration files and test runner scripts to automate a live instance of VS Code.1
- **Task: Implement "Golden Path" E2E Test:** The primary E2E test case outlined in the foundational analysis will be implemented.1 This test will automate the critical user workflow: adding a source file, creating a destination document, inserting a section from the "Sections View" into the "Destination Document Outliner," and asserting that the UI updates correctly. This provides a powerful regression suite that validates the correct interaction of nearly every component in the system.1

The interactive nature of the custom editors introduces significant complexity in state synchronization. For instance, the Comparison Editor's virtual document must update its formatting (e.g., applying a strikethrough to a section) immediately after a user clicks a CodeLens action like "Delete".17 This requires a multi-step, event-driven chain of communication. The CodeLens command handler calls the
DataAccessService, which updates the state in the vector database. This, in turn, causes the SessionManager to emit a state change event, such as onSourceDataDidChange. The ComparisonVirtualProvider must be subscribed to this event. When its listener is triggered, it must then fire its _own_ onDidChange event, which is the standard VS Code mechanism to signal that its virtual document content is stale. Only then will VS Code re-invoke the provideTextDocumentContent method, which will re-fetch the data (now including the updated "resolved" status) and render the updated view. This "reactivity wiring" is a common source of subtle bugs in complex extensions and must be explicitly planned for and tested to ensure a responsive and consistent user experience.

## **Phase 5 \- Productionization, Publishing, and User Onboarding**

### **Goal**

The final phase of the project is focused on completing the end-to-end user workflow and adding the final layer of polish required for a professional-grade, public release. This involves implementing the "Publish" and "Preview" features, which transform the in-memory work into persistent artifacts, and addressing critical production-readiness concerns such as user configuration, observability, and onboarding.

### **Deliverables**

- A fully functional "Publish" command that serializes all composed destination documents to physical files in the user's workspace.
- A "Preview" command that provides a read-only view of a fully serialized document.
- A complete DocumentGeneration service featuring robust AST-to-Markdown serialization and high-performance contextual glossary scoping.
- A user-configurable settings schema (contributes.configuration) in package.json.
- An integrated telemetry service for collecting anonymous usage analytics.
- A comprehensive, multi-step user onboarding walkthrough contributed to VS Code's "Get Started" page.
- A final, packaged .vsix file, ready for publishing to the VS Code Marketplace.

### **Detailed Breakdown**

#### **Final Workflow Implementation**

This workstream builds the final, culminating stage of the user's journey, transforming their weaving session into concrete outputs.

- **Task: Implement DocumentSerializationService:** A dedicated service will be created to handle the transformation of the in-memory ASTs into Markdown text.25 The core of this service will be a recursive, depth-first traversal algorithm. To ensure extensibility, a map-based strategy will be used, where each AST node type is mapped to a dedicated serializer function. This design adheres to the Open/Closed Principle, allowing new Markdown elements to be supported in the future without modifying the core traversal logic.25
- **Task: Implement Contextual Glossary Scoping:** The serialization service will also implement the critical two-pass algorithm for contextual glossary scoping.25 During the first pass (AST serialization), the service will collect all canonical terms present in the document's body text into a
  Set. To ensure high performance and avoid a costly O(N⋅M) search, term matching will be performed in a single pass using a compiled regular expression that combines all canonical terms with word boundary anchors (\\b).25 In the second pass, the service will iterate through the master glossary list and append only the definitions for terms found in the document, ensuring each output is self-contained and relevant.25
- **Task: Implement handlePublishDocuments Command:** The command handler for the "Publish" action will be implemented.9 It will first present a modal confirmation dialog to the user, explicitly warning them that the action will create new files and terminate the session.9 Upon confirmation, it will iterate through all destination documents, calling the
  DocumentSerializationService to generate the final content for each. After writing all files to the workspace, it will make a final, critical call to sessionService.endSession() to orchestrate the complete teardown of the session, including resource cleanup and UI state changes.8
- **Task: Implement handlePreviewDocument Command:** The "Preview" feature will be implemented by the same command handler structure. It will leverage the DocumentSerializationService to generate the fully serialized content but, instead of writing to a file, will pass the resulting string to a VirtualDocumentProvider to be displayed in a new, read-only editor tab.9

#### **Production-Readiness (P1/P2 Tasks)**

This workstream implements the remaining non-functional requirements identified in the foundational analysis, which are essential for a polished and professional user experience.1

- **Task: Add contributes.configuration Schema:** The user settings schema will be added to the contributes.configuration section of package.json. This will expose settings for markdown-semantic-weaver.logging.level and markdown-semantic-weaver.performance.maxSourceCorpusSizeMB. The LoggerService and SourceProcessingModule will be refactored to read and respect these configuration values, allowing users to tune the extension's verbosity and performance behavior.1
- **Task: Define Lazy activationEvents:** A final review of the activationEvents in package.json will be conducted to ensure they are strictly limited to the initial commands that start a session (e.g., onCommand:markdown-semantic-weaver.addSource). This lazy activation is a mandatory architectural principle that guarantees the extension has zero performance impact on VS Code's startup time for users not actively engaged in a weaving session.1
- **Task: Integrate @vscode/extension-telemetry:** A TelemetryService will be created to wrap the TelemetryReporter from the @vscode/extension-telemetry package. This service will respect the user's global telemetry settings in VS Code, ensuring no data is collected without consent. Key command handlers will be instrumented to send anonymous, aggregated usage events for actions like sessionStarted, sourceFileAdded, and documentPublished. This will provide invaluable data for making future product decisions.1
- **Task: Design and Implement User Onboarding Walkthrough:** To address the complexity of the extension's workflow and reduce initial user friction, a structured onboarding experience will be implemented using the contributes.walkthroughs contribution point.1 This will create a multi-step, interactive checklist on VS Code's "Get Started" page that guides new users through their first weaving session, covering the canonical workflow from adding sources to creating and previewing a document.1

#### **Release Preparation**

- **Task: Finalize README and Documentation:** The extension's README.md file will be updated to include comprehensive usage instructions. A clear privacy statement will be added, explaining what anonymous telemetry data is collected and for what purpose, to maintain user trust and transparency.1
- **Task: Package and Test .vsix:** The vsce command-line tool will be used to package the extension into a .vsix file. Final installation and functionality tests will be performed using this packaged file to ensure it behaves identically to the development version.1

## **Phase 4 Implementation Status**

Phase 4 has been substantially completed with the following advanced features implemented:

### ✅ **Completed Phase 4 Deliverables:**

#### **Block Editor**
- `BlockEditorService` - Manages temporary document lifecycle
- `EditContentBlockHandler` - Seamless integration with outliner
- Auto-save functionality for content persistence

#### **Comparison Editor**
- `ComparisonVirtualProvider` - Read-only virtual document display
- `ComparisonCodeLensProvider` - Interactive CodeLenses ("Insert", "Delete", "Pop")
- `ComparisonCodeActionProvider` - "Merge with AI" functionality
- `OpenComparisonEditorHandler` - Editor orchestration and state management
- `MergeWithAIHandler` - AI-powered content merging
- `PopSectionHandler` - False positive handling for similarity groups

#### **Glossary Editor**
- `GlossaryWebviewManager` - Webview lifecycle and message handling
- `OpenGlossaryEditorHandler` - Editor integration
- Custom HTML/CSS/JS frontend with card-based UI
- Term selection, qualification, and merging workflows

#### **Advanced Command Handlers**
- `RefreshComparisonHandler` - View synchronization
- `RegularInsertSectionHandler` - Alternative insertion workflows
- Enhanced error handling and user feedback

### 🔄 **Phase 5: Current Status**

Phase 5 implementation is currently in progress with the following components:

#### **In Progress:**
- **Preview Command** - Virtual document generation (not yet implemented)
- **Publish Command** - Document serialization with confirmation (not yet implemented)
- **DocumentSerializationService** - AST-to-Markdown conversion (not yet implemented)
- **Glossary Scoping** - Contextual term filtering (not yet implemented)

#### **Ready for Implementation:**
- User onboarding walkthrough
- Telemetry service integration
- Enhanced user settings
- .vsix packaging and publishing

## **Implementation Notes**

The implementation of the user onboarding walkthrough and the telemetry system in this final phase are not merely isolated features for polish; they are symbiotically linked components that create a powerful feedback loop for future development. The walkthrough is designed to guide users through the intended "happy path" workflow.1 The telemetry system is designed to measure how users actually engage with the extension's features.1 After the initial release, the collected telemetry data can be analyzed to identify friction points. For example, if the data reveals that a high percentage of users trigger the
sessionStarted event but very few trigger the documentPublished event, it strongly indicates a drop-off point in the workflow. This quantitative evidence can then be used to inform targeted improvements to the onboarding walkthrough, such as adding a new step or clarifying an existing one, to better guide users past that specific hurdle. This creates a continuous, data-driven cycle of product improvement, ensuring the extension can evolve to better meet user needs over time.

#### **Works cited**

1. Foundational Scaffolding for the Markdown Semantic Weaver Extension
2. Advanced container configuration \- Visual Studio Code, accessed August 27, 2025, [https://code.visualstudio.com/remote/advancedcontainers/overview](https://code.visualstudio.com/remote/advancedcontainers/overview)
3. Ultimate Guide to Dev Containers \- Daytona, accessed August 27, 2025, [https://www.daytona.io/dotfiles/ultimate-guide-to-dev-containers](https://www.daytona.io/dotfiles/ultimate-guide-to-dev-containers)
4. VS Code extension download size is larger than expected · Issue \#58 · microsoft/live-share, accessed August 27, 2025, [https://github.com/MicrosoftDocs/live-share/issues/58](https://github.com/MicrosoftDocs/live-share/issues/58)
5. Visual Studio Code Progress Cancelled by Async Task \- John M. Wargo, accessed August 27, 2025, [https://johnwargo.com/posts/2023/vscode-extension-progress/](https://johnwargo.com/posts/2023/vscode-extension-progress/)
6. Testing Extensions | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/working-with-extensions/testing-extension](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
7. Testing with Mocha/Chai/Sinon: Quick Start Guide | by Jason Holtkamp \- Medium, accessed August 27, 2025, [https://medium.com/caffeine-and-testing/testing-with-mocha-chai-sinon-quick-start-guide-12f3e47b1a79](https://medium.com/caffeine-and-testing/testing-with-mocha-chai-sinon-quick-start-guide-12f3e47b1a79)
8. Design Specification: Session and State Management Component
9. Design Specification: Command and Action Handlers for the Markdown Semantic Weaver Extension
10. Consolidated Architectural Blueprint
11. Design Specification: Source Processing Module
12. fastembed \- NPM, accessed August 27, 2025, [https://www.npmjs.com/package/fastembed](https://www.npmjs.com/package/fastembed)
13. BAAI/bge-small-en-v1.5 \- Hugging Face, accessed August 27, 2025, [https://huggingface.co/BAAI/bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5)
14. Design Specification: Data Access & Services Layer for the Markdown Semantic Weaver Extension
15. Advanced Error Handling Patterns in Node.js with Observables \- MoldStud, accessed August 27, 2025, [https://moldstud.com/articles/p-advanced-error-handling-patterns-in-nodejs-with-observables](https://moldstud.com/articles/p-advanced-error-handling-patterns-in-nodejs-with-observables)
16. Node.js Error Handling Best Practices: Hands-on Experience Tips \- Sematext, accessed August 27, 2025, [https://sematext.com/blog/node-js-error-handling/](https://sematext.com/blog/node-js-error-handling/)
17. Design Specification: Custom Editor Experiences
18. Basic editing \- Visual Studio Code, accessed August 27, 2025, [https://code.visualstudio.com/docs/editing/codebasics](https://code.visualstudio.com/docs/editing/codebasics)
19. Auto-save unsaved files · Issue \#906 · microsoft/vscode \- GitHub, accessed August 27, 2025, [https://github.com/microsoft/vscode/issues/906](https://github.com/microsoft/vscode/issues/906)
20. Webview API | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/extension-guides/webview](https://code.visualstudio.com/api/extension-guides/webview)
21. Reducing Repaints and Reflows in DOM Manipulation with Vanilla JavaScript \- Medium, accessed August 27, 2025, [https://medium.com/@Adekola_Olawale/reducing-repaints-and-reflows-in-dom-manipulation-with-vanilla-javascript-7f988610cc35](https://medium.com/@Adekola_Olawale/reducing-repaints-and-reflows-in-dom-manipulation-with-vanilla-javascript-7f988610cc35)
22. Tips for vanilla JavaScript DOM manipulation \- falldowngoboone, accessed August 27, 2025, [https://www.falldowngoboone.com/blog/tips-for-vanilla-javascript-dom-manipulation/](https://www.falldowngoboone.com/blog/tips-for-vanilla-javascript-dom-manipulation/)
23. VSCode Extension Testing Service \- WebdriverIO, accessed August 27, 2025, [https://webdriver.io/docs/wdio-vscode-service/](https://webdriver.io/docs/wdio-vscode-service/)
24. VS Code Extension Testing \- WebdriverIO, accessed August 27, 2025, [https://webdriver.io/docs/extension-testing/vscode-extensions/](https://webdriver.io/docs/extension-testing/vscode-extensions/)
25. Design Specification: Document Generation and Serialization Component
26. Extensibility Principles and Patterns \- vscode-docs1 \- Read the Docs, accessed August 27, 2025, [https://vscode-docs1.readthedocs.io/en/latest/extensionAPI/patterns-and-principles/](https://vscode-docs1.readthedocs.io/en/latest/extensionAPI/patterns-and-principles/)
27. Walkthroughs | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/ux-guidelines/walkthroughs](https://code.visualstudio.com/api/ux-guidelines/walkthroughs)
28. Publishing Extensions \- Visual Studio Code, accessed August 27, 2025, [https://code.visualstudio.com/api/working-with-extensions/publishing-extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
