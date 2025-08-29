# **Design Specification: Command and Action Handlers**

## **1\. Architectural Role and Design Principles**

This document provides the definitive design specification for the Command and Action Handlers component of the Markdown Semantic Weaver Visual Studio Code (VS Code) extension. This component serves as the central nervous system of the extension, acting as the primary intermediary between user-initiated actions within the VS Code workbench and the extension's underlying business logic and services. A robust and well-defined handler layer is paramount to achieving the project's goal of a predictable and stable user experience.1

### **1.1. Core Responsibility: The Orchestrator Pattern**

The Command and Action Handlers component is designed to function exclusively as a thin **controller** or **orchestrator** layer. Its sole responsibility is to receive activation triggers from the VS Code environment—such as context menu clicks, button presses, or Command Palette invocations—and delegate the subsequent work to the appropriate specialized service components. This architectural pattern is a cornerstone of the extension's design, ensuring a clean and maintainable separation of concerns.2
Under this model, handler functions will contain no direct business logic. They are explicitly forbidden from performing tasks such as parsing Markdown files into Abstract Syntax Trees (ASTs), generating vector embeddings, directly manipulating document models, or querying the Vectra vector database. Instead, a handler's logic is confined to the following sequence:

1. Receive the command invocation from VS Code, along with any contextual arguments (e.g., file URIs).
2. Validate the immediate context of the request, if necessary.
3. Invoke one or more methods on the appropriate service layer components (e.g., Session and State Management, Data Access & Services Layer, Source Processing Pipeline).
4. Manage the user-facing feedback related to the operation, such as displaying progress indicators or notifications.
5. Handle any exceptions that arise from the service layer and present them to the user in a consistent manner.

This strict separation ensures that the core business logic of the extension is entirely decoupled from the VS Code API. This decoupling is critical for maintainability, as changes to the VS Code API will only impact the thin handler layer. Furthermore, it makes the core services highly testable in isolation, as they can be unit-tested without requiring a running VS Code instance.

### **1.2. Component Interaction Model**

The flow of control and data initiated by a user action follows a strict, unidirectional pattern. This model is fundamental to maintaining a predictable application state and preventing the class of bugs that arise from complex, multi-directional data flows.
The interaction sequence is as follows:

1. **User Action (UI Layer):** The user interacts with a contribution point, such as right-clicking a file in the Explorer and selecting "Add as source."
2. **Command Invocation (VS Code Workbench):** VS Code identifies the associated command ID from the package.json manifest and invokes the corresponding handler registered by the extension.
3. **Command Handler (Orchestrator Layer):** The handler function executes. It calls the necessary methods on the service layers to fulfill the request. For example, it might call SessionService.startSessionIfNeeded() followed by SourceProcessingPipeline.processFile(uri).
4. **Service Logic & State Mutation (Service & Data Layers):** The service layer contains the business logic. It performs the required operations (e.g., parsing, embedding) and updates the application's central state. This state is managed by the Session and State Management component and the Data Access & Services Layer, which abstracts the Vectra database and in-memory document models.2
5. **State Change Notification (Event Emitter):** Upon successful state mutation, the responsible service emits an event (e.g., onSourceFilesChanged, onDestinationDocumentUpdated).
6. **UI Refresh (View Layer):** The UI components, implemented as TreeDataProvider instances, subscribe to these events. Upon receiving a notification, they signal to VS Code that their data has changed, triggering a refresh of the relevant view in the sidebar.

This event-driven, unidirectional flow ensures that the UI is always a direct reflection of the application's state, providing the stable and predictable experience mandated by the core specification.1

### **1.3. Key Design Principles**

The implementation of the Command and Action Handlers component will adhere to the following core principles:

* **Statelessness:** Handler functions themselves must be stateless. They should not store or rely on any instance variables that persist between invocations. All necessary context is provided by VS Code at the time of invocation (e.g., the URI of a selected file) or is retrieved by querying the Session and State Management service for the current state of the weaving session.
* **Asynchronicity:** All handlers that orchestrate operations involving file I/O, network requests, background processing, or AI service calls must be implemented as async functions and return a Promise\<void\>. This is essential for preventing the extension host from blocking. Handlers are responsible for wrapping these long-running operations in user-facing progress indicators, such as vscode.window.withProgress, to provide clear feedback to the user.1
* **Context-Driven Availability:** The user interface must remain uncluttered and intuitive. To achieve this, commands and menu items will be made visible only when they are contextually relevant. This is accomplished declaratively within the package.json manifest through the extensive use of when clause contexts.3 The session-based nature of the extension is a primary driver for this principle. The entire workflow is encapsulated within a "Weaving Session," which represents a distinct state of the application.1 Many actions, such as "Publish" or "Add New Destination Document," are meaningless outside of an active session. To enforce this workflow at the platform level, the extension will define and manage a custom context key,
  markdown-semantic-weaver.sessionActive. The Session and State Management component will be responsible for setting this context to true via vscode.commands.executeCommand('setContext', 'markdown-semantic-weaver.sessionActive', true) upon session initiation and setting it to false upon termination. This custom context will then be used in when clauses throughout the package.json manifest to control the visibility of all session-dependent UI elements, ensuring that users are only presented with valid actions for the current application state.4

## **2\. Command and Menu Contribution Manifest (package.json)**

The package.json file serves as the extension's manifest, declaratively defining its integration points with the VS Code workbench. This section specifies the complete contents of the contributes object, which forms the public contract between the Command and Action Handlers component and the user interface.

### **2.1. Command Registration (contributes.commands)**

All actions that can be invoked by the user must first be registered as commands. Each command is assigned a unique identifier and a user-facing title. The title is displayed in the Command Palette and other UI locations where the command appears.5 A consistent naming convention,
markdown-semantic-weaver.\<verbNoun\>, will be used for all command identifiers to ensure clarity and prevent collisions with other extensions.
The following commands will be registered:

JSON

"contributes": {
  "commands":
}

### **2.2. Menu Contributions (contributes.menus)**

The contributes.menus section places the registered commands into specific UI locations, such as context menus and title bars. Each menu contribution is governed by a when clause that controls its visibility based on the current context.7

#### **2.2.1. File Explorer Context Menu (explorer/context)**

To avoid polluting the top-level file explorer context menu, all primary session initiation commands will be grouped into a Synthesize submenu. This is a recommended UX practice for extensions that contribute multiple related file actions.8
The addSource and addDestination commands are the entry points for a user's workflow. Their visibility is strictly controlled to appear only for Markdown files. The addDestination command has an additional constraint that it is only available for single-file selections, as specified in the functional requirements.1 This constraint is enforced using the
\!listMultiSelection context key.3

JSON

"menus": {
  "explorer/context":
}

*Note: The original specification mentioned a "Synthesize" sub-menu. The VS Code API has evolved, and the preferred modern approach is to contribute directly to a group. For simplicity and adherence to current best practices, this design places them in the navigation group. If a sub-menu is strictly required, it would involve a more complex menu contribution structure.*

#### **2.2.2. View Title Bar Actions (view/title)**

High-level, view-specific actions are placed in the title bar of their respective views. These actions appear as icons and are only visible when a weaving session is active, controlled by the custom markdown-semantic-weaver.sessionActive context.9
The "Add New Destination Document" and "Publish" commands are global to the session and are logically placed in the title bar of the Destination Documents View.

JSON

"view/title":

#### **2.2.3. View Item Context Menu (view/item/context)**

Actions that operate on individual items within a TreeView are contributed to the view/item/context menu. For common actions like "Edit" and "Delete," placing them in the inline group causes them to appear as icons on hover, providing a more fluid user experience.

JSON

"view/item/context":

#### **2.2.4. Command Palette Visibility (commandPalette)**

By default, any command registered in the contributes.commands section appears in the Command Palette. However, to prevent clutter, it is best practice to explicitly control this visibility.4 The
Publish command is a high-level action that makes sense to expose in the Command Palette, but only when a session is active.

JSON

"commandPalette": \[
  {
    "command": "markdown-semantic-weaver.publish",
    "when": "markdown-semantic-weaver.sessionActive"
  }
\]

### **Table 2.1: Command Contribution and UI Mapping**

The following table provides a comprehensive summary and single source of truth for all user-facing commands, their identifiers, and their precise placement and visibility conditions within the VS Code UI. This table serves as a definitive checklist for both implementation and verification.

| User Action | Command ID | Title/Label | Icon | Contribution Point(s) | when Clause Context |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Add Source File(s) | markdown-semantic-weaver.addSource | Add as Source | (none) | explorer/context | resourceLangId \== markdown |
| Add Destination File | markdown-semantic-weaver.addDestination | Add as Destination | $(add) | explorer/context | resourceLangId \== markdown && !listMultiSelection |
| Add New Destination | markdown-semantic-weaver.addNewDestinationDocument | Add New Destination Document | $(add) | view/title | view == markdown-semantic-weaver.destinationDocuments |
| Delete Destination Document | markdown-semantic-weaver.deleteDestinationDocument | Remove Destination Document | $(trash) | view/item/context | view == markdown-semantic-weaver.destinationDocuments && viewItem == 'destinationDocument' |
| Delete Content Block | markdown-semantic-weaver.deleteContentBlock | Delete Content Block | $(trash) | view/item/context (inline) | view == markdown-semantic-weaver.documentOutliner && viewItem == 'contentBlock' |
| Add Content Block | markdown-semantic-weaver.addContentBlock | Add Content Block | $(add) | view/item/context (inline) | view == markdown-semantic-weaver.documentOutliner && viewItem == 'contentBlock' |
| Insert Section | markdown-semantic-weaver.insertSection | Insert Section | $(add) | view/item/context (inline) | view == markdown-semantic-weaver.sections && viewItem == 'section' |
| Move Content Block | markdown-semantic-weaver.moveContentBlock | Move Content Block | $(arrow-up) | (programmatic only) | N/A |

## **3\. Handler Architecture and Implementation**

This section details the TypeScript implementation strategy for the Command and Action Handlers component. The design prioritizes organization, testability, and maintainability by centralizing command registration and handler logic into a dedicated service class.

### **3.1. The CommandHandlerService Class**

To avoid polluting the global scope of the main extension.ts file and to promote a clean architecture, all command registration logic will be encapsulated within a single CommandHandlerService class. This class acts as the central hub for all command-related activities.
The constructor of this class will utilize dependency injection to receive instances of all required services. This pattern decouples the handler layer from the instantiation and lifecycle management of its dependencies, which is crucial for effective unit testing.

TypeScript

// Example of CommandHandlerService structure
import \* as vscode from 'vscode';
import { SessionManager } from './services/SessionManager';
import { DataAccessService } from './services/DataAccessService';
import { SourceProcessingService } from './services/SourceProcessingService';

export class CommandHandlerService {
    constructor(
        private sessionManager: SessionManager,
        private dataAccessService: DataAccessService,
        private sourceProcessingService: SourceProcessingService
    ) {}

    public registerCommands(context: vscode.ExtensionContext): void {
        // Registration logic will be implemented here
    }

    // Private handler methods will be defined here
}

The class will expose a single public method, registerCommands(context: vscode.ExtensionContext). This method will be called once from the activate function in extension.ts. Inside this method, each command will be registered with VS Code using vscode.commands.registerCommand. The Disposable object returned by each registration call will be pushed onto the context.subscriptions array to ensure that all command bindings are properly cleaned up when the extension is deactivated.6

### **3.2. Handler Method Structure**

Each command handler will be implemented as a private async method within the CommandHandlerService class. This co-location of registration and implementation logic keeps the component self-contained and easy to navigate.
A critical aspect of the handler design is correctly processing the arguments provided by VS Code. When a command is invoked from the File Explorer context menu, VS Code passes two arguments to the handler: the first (uri) is the vscode.Uri of the item that was right-clicked, and the second (uris) is an array of vscode.Uri objects for all selected items.7 Handlers must be implemented robustly to correctly interpret these arguments for both single and multiple selection scenarios.

TypeScript

// Example handler method signature and argument processing
private async handleAddSource(uri?: vscode.Uri, uris?: vscode.Uri): Promise\<void\> {
    // If 'uris' is provided and has content, it's a multi-selection.
    // Otherwise, use the single 'uri' if it exists.
    const filesToAdd \= uris && uris.length \> 0? uris : (uri? \[uri\] :);

    if (filesToAdd.length \=== 0\) {
        // No files were selected, show an informational message or do nothing.
        vscode.window.showInformationMessage('No Markdown files selected.');
        return;
    }

    //... proceed with orchestration logic
}

### **3.3. Initialization in extension.ts**

The main activate function in extension.ts will be responsible for instantiating all the necessary services and wiring them together. The CommandHandlerService will be one of the last services to be instantiated, as it depends on all the others. This clear, centralized initialization sequence makes the extension's startup process easy to understand and debug.
The choice to use a dedicated service class for command registration, rather than placing this logic directly in extension.ts, is a deliberate architectural decision aimed at enhancing scalability and testability. As the number of commands in the extension grows, a monolithic activate function becomes increasingly difficult to manage. By encapsulating command logic, the CommandHandlerService remains organized. More importantly, this structure allows for comprehensive unit testing. In a test environment, the CommandHandlerService can be instantiated with mock versions of its dependent services. This allows for the verification of each handler's orchestration logic—ensuring it calls the correct services with the correct parameters—without needing to run a full instance of VS Code. This capability significantly improves the reliability and long-term maintainability of the extension.

TypeScript

// Example of initialization in extension.ts
import \* as vscode from 'vscode';
import { registerCommandHandlers } from './command-handlers/index.js';
//... import other services

export function activate(context: vscode.ExtensionContext) {
    // 1\. Instantiate all services (using dependency injection container)
    // Services are automatically instantiated by the tsyringe container

    // 2\. Register all commands
    registerCommandHandlers();
}

## **4\. Detailed Handler Workflows**

This section provides a detailed, step-by-step procedural guide for the implementation of each command handler. The logic described here focuses on orchestration, delegating all complex operations to the appropriate service components as per the design principles.

### **4.1. Session Management Handlers**

These handlers are the primary entry points for initiating or modifying a weaving session.

#### **handleAddSource(uri?: vscode.Uri, uris?: vscode.Uri)**

This handler is responsible for adding one or more Markdown files to the pool of source documents for analysis.1

1. **Input Validation:** The handler first determines the list of file URIs to process from the uris argument, as detailed in Section 3.2. If no files are provided, it will exit gracefully.
2. **Session Initiation:** It will invoke await this.sessionManager.startSessionIfNeeded(). This call is idempotent; it will either start a new session or do nothing if one is already active. This is the point where the markdown-semantic-weaver.sessionActive context is set to true.
3. **User Feedback:** The handler will use vscode.window.withProgress to display a non-blocking notification in the bottom-right corner, informing the user that source files are being processed. The progress indicator will be indeterminate.
4. **Delegation:** Inside a try...catch block, the handler will iterate through the validated list of URIs. For each URI, it will call await this.sourceProcessingService.processFile(uri). The processFile method encapsulates the entire pipeline: parsing, sectioning, embedding, storage, and similarity analysis. The handler will update the `vscode.window.withProgress` notification for each file processed. The underlying event that triggers a refresh of UI components like the TreeViews will be emitted by the `sessionManager` after each file's data has been successfully processed and committed to the session state.
5. **Finalization:** Upon successful completion of all files, the progress notification will be updated to a "complete" state before disappearing. If any error occurs during processing, the catch block will delegate the error to the centralized ErrorHandler for consistent user notification and logging.

#### **handleAddDestination(uri: vscode.Uri)**

This handler adds an existing Markdown file as a destination document for authoring.1

1. **Input Validation:** The handler ensures the uri argument is valid.
2. **Session Initiation:** It will invoke await this.sessionManager.startSessionIfNeeded().
3. **Delegation:** The handler will read the file content, parse it into an AST using MarkdownASTParser, add path information using AstService, and create a new destination document in the DestinationDocumentManager. The manager will emit events to trigger the refresh of the Destination Documents View and Destination Document Outliner.

### **4.2. Destination Document Lifecycle Handlers**

These handlers manage the creation, preview, and final publication of destination documents.

#### **handleAddNewDestinationDocument()**

This handler creates a new, empty destination document within the current session.1

1. **Delegation:** The handler will call the DestinationDocumentManager.createNew() method, which creates a new empty document with a default AST structure. The manager will emit events to update the Destination Documents View. The handler also sets the newly created document as the active document.

#### **handlePreviewDocument(destinationItem: DestinationDocumentTreeItem)**

This command generates a read-only preview of a fully composed destination document.1

1. **Context:** The handler receives the custom TreeItem object corresponding to the destination document on which the action was invoked. This object contains the unique identifier for the document.
2. **Delegation:** It will call await this.generationService.generatePreview(destinationItem.id). The GenerationService will traverse the document's internal model, serialize it to a Markdown string, perform the final glossary scoping pass for preview, and return the complete string.1
3. **Display:** The handler will use vscode.workspace.openTextDocument({ content: markdownString, language: 'markdown' }) to create a virtual document in memory. It will then call vscode.window.showTextDocument to display this read-only document in a new editor tab.

#### **handlePublishDocuments()**

This is the final command in the workflow, serializing all destination documents to physical files and ending the session.1

1. **Confirmation:** The handler must first display a modal confirmation dialog using vscode.window.showWarningMessage. The message will be exactly: "Publishing will create new files and end the current weaving session." The dialog will have "Publish" and "Cancel" options.1
2. **Conditional Execution:** The handler will proceed only if the user selects "Publish."
3. **User Feedback:** It will use vscode.window.withProgress to show the overall publication progress.
4. **Delegation:** The handler will call await this.generationService.publishAllDocuments(). This service will iterate through all destination documents, perform the final glossary scoping, serialize them, and write them to new files in the workspace.2
5. **Session Termination:** Crucially, after the generation service completes successfully, the handler will call `await this.sessionService.endSession()`. The `sessionService` is then responsible for orchestrating the entire session teardown, which includes clearing all internal state, disposing of resources, setting the `markdown-semantic-weaver.sessionActive` context to `false`, and emitting the final `onSessionDidEnd` event to signal completion to all listeners.

### **4.3. Authoring and Editor Handlers**

These handlers orchestrate the opening of the various custom editor experiences.

* **handleOpenComparisonEditor(similarityGroupItem: SimilarityGroupTreeItem):** This handler will simply delegate to await this.editorService.openComparisonEditor(similarityGroupItem.id). The EditorService will abstract the complex logic of creating the virtual document provider, registering the CodeLens provider, and arranging the side-by-side editor layout.2
* **handleOpenGlossaryEditor(termGroupItem: TermGroupTreeItem):** This handler will delegate to await this.editorService.openGlossaryEditor(termGroupItem.id). The EditorService manages the creation and lifecycle of the custom Webview panel.2
* **handleEditContentBlock(contentBlockItem: ContentBlockTreeItem):** This handler will delegate to await this.editorService.openBlockEditor(contentBlockItem.id). The EditorService is responsible for extracting the content, opening it in a temporary untitled document, and listening for changes to save back to the model.1
* **handleDeleteContentBlock(contentBlockItem: ContentBlockTreeItem):** This handler orchestrates the deletion of a content block by adhering to the Read-Compute-Commit pattern. It will first retrieve the document's URI from the session context. It will then call a method on the `dataAccessService`, such as `computeAstWithBlockDeleted(docUri, contentBlockItem.id)`, to get a newly computed AST with the specified block removed. Finally, it will commit this change by passing the new AST to the `sessionService` via `await this.sessionService.updateDestinationDocumentAst(docUri, newAst)`. The `sessionService` is then responsible for the final state mutation and event emission that triggers the UI refresh.

### **4.4. Comparison Editor Action Handlers**

These handlers are for commands invoked via CodeLenses or CodeActions within the Comparison Editor. They will be registered but not exposed in any general menus.

* **handleInsertSection(sourceSectionId: string, destinationBlockId: string):** Delegates to await this.dataAccessService.resolveSectionAsInserted(sourceSectionId, destinationBlockId).
* **handleDeleteSourceSection(sourceSectionId: string):** Delegates to await this.dataAccessService.resolveSectionAsDeleted(sourceSectionId).
* **handlePopSourceSection(sourceSectionId: string):** Delegates to await this.dataAccessService.resolveSectionAsPopped(sourceSectionId).
* **handleMergeWithAI(sourceSectionIds: string, destinationBlockId: string):** Delegates to await this.dataAccessService.resolveSectionsAsMerged(sourceSectionIds, destinationBlockId).

### **4.5. Glossary and Term Handlers**

* **handleRemoveTerm(termItem: TermTreeItem):** This handler addresses false positives in term extraction. It will delegate to await this.dataAccessService.removeTerm(termItem.id). The service will remove the term from the database and trigger a refresh of the Terms View.

## **5\. Cross-Cutting Concerns**

This section addresses systemic design patterns that apply across multiple handlers to ensure the extension is robust, reliable, and provides a high-quality user experience.

### **5.1. Error Handling and User Notification Strategy**

A consistent error handling strategy is essential for a professional-grade extension. To achieve this, a centralized error handling utility, ErrorHandler.handle(error: unknown), will be implemented. All try...catch blocks within the command handlers will pass their caught exceptions to this single utility.
The ErrorHandler will implement the following logic:

1. It will inspect the error object to determine its type.
2. If the error is a custom application error type (e.g., WeavingError) that contains a user-friendly message, that specific message will be displayed to the user via vscode.window.showErrorMessage.
3. For all other unexpected or generic errors (e.g., Error, TypeError), a generic message such as "An unexpected error occurred in the Markdown Semantic Weaver extension" will be shown to the user.
4. In all cases, the full error object, including its stack trace, will be logged to the extension's dedicated Output Channel (vscode.window.createOutputChannel). This ensures that users can retrieve detailed diagnostic information for bug reports without being confronted with technical details in a modal dialog.

This two-tiered approach provides immediate, helpful feedback to the user while simultaneously capturing the necessary technical detail for developers to debug effectively.

### **5.2. State Synchronization and UI Reactivity**

The extension's UI must always be an accurate representation of its internal state. As detailed in Section 1.2, this is achieved through an event-driven architecture, which is the key to fulfilling the specification's requirement for a "predictable and stable user experience".1 A predictable experience demands that when a user performs an action, the UI immediately and accurately reflects the new state. A naive implementation where a command handler directly manipulates a UI component is brittle and prone to synchronization bugs if another part of the system can also alter that state.
The correct, robust pattern ensures a single, reliable data flow:

1. A command handler orchestrates a change by calling a method on a service (e.g., this.dataAccessService.deleteContentBlock(...)).
2. The service executes the business logic and modifies the central state (e.g., removing a node from the in-memory AST for a destination document).
3. After successfully mutating the state, the service (or the central SessionService) emits a specific, strongly-typed event (e.g., onDestinationDocumentChanged.fire(documentId)).
4. The relevant UI component's TreeDataProvider (e.g., the provider for the DestinationDocumentOutliner) subscribes to this event.
5. Upon receiving the event, the provider's listener calls its internal \_onDidChangeTreeData.fire() method. This is the standard VS Code API mechanism to signal to the workbench that the view's data is stale and needs to be re-rendered.
6. VS Code then calls the provider's getChildren() and/or getTreeItem() methods to fetch the updated data and refresh the view.

By strictly adhering to this pattern—where handlers only trigger state changes and the UI only reacts to state change events—the system guarantees that the UI is always synchronized with the underlying data model. This architecture eliminates an entire class of potential bugs and ensures that no matter what triggers a state change, the user is always presented with a consistent and correct view of their weaving session.

## **6\. Conclusions**

The Command and Action Handlers component is the architectural lynchpin of the Markdown Semantic Weaver extension. Its design, as specified in this document, emphasizes a clear separation of concerns through the Orchestrator Pattern, ensuring that the component remains a thin, testable layer responsible solely for mediating between the VS Code UI and the extension's core services.
The declarative package.json contributions are meticulously defined to provide a context-aware and intuitive user interface. By leveraging when clause contexts, particularly a custom markdown-semantic-weaver.sessionActive context, the extension's UI will dynamically adapt to the application's state, surfacing commands only when they are relevant and actionable. This approach is fundamental to delivering the clean and predictable user experience outlined in the project's core requirements.1
The implementation strategy, centered around a dependency-injected CommandHandlerService, promotes a scalable and maintainable codebase. The detailed workflows provide clear, step-by-step guidance for orchestrating complex operations, from background source processing to the final document publication. Finally, the establishment of system-wide patterns for error handling and event-driven UI updates ensures the final product will be robust, reliable, and professional-grade. Adherence to this design will result in a Command and Action Handlers component that is not only functionally complete but also architecturally sound, forming a solid foundation for the entire extension.

#### **Works cited**

1. Specification: Markdown Semantic Weaver VS Code Extension
2. Markdown Semantic Weaver Extension: Component Breakdown
3. when clause contexts | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/references/when-clause-contexts](https://code.visualstudio.com/api/references/when-clause-contexts)
4. Commands | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/extension-guides/command](https://code.visualstudio.com/api/extension-guides/command)
5. VS Code API | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/references/vscode-api](https://code.visualstudio.com/api/references/vscode-api)
6. Your first VS Code extension \- Novanet blog, accessed August 27, 2025, [https://blog.novanet.no/your-first-vs-code-extension/](https://blog.novanet.no/your-first-vs-code-extension/)
7. vscode-docs-archive/api/references/contribution-points.md at master \- GitHub, accessed August 27, 2025, [https://github.com/microsoft/vscode-docs-archive/blob/master/api/references/contribution-points.md](https://github.com/microsoft/vscode-docs-archive/blob/master/api/references/contribution-points.md)
8. Context Menus | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/ux-guidelines/context-menus](https://code.visualstudio.com/api/ux-guidelines/context-menus)
9. Views | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/ux-guidelines/views](https://code.visualstudio.com/api/ux-guidelines/views)
10. How to create custom Explorer context menu commands? : r/vscode \- Reddit, accessed August 27, 2025, [https://www.reddit.com/r/vscode/comments/13f6uaj/how\_to\_create\_custom\_explorer\_context\_menu/](https://www.reddit.com/r/vscode/comments/13f6uaj/how_to_create_custom_explorer_context_menu/)