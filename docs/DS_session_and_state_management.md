

# **Design Specification: Session and State Management Component**

## **1.0 Component Charter and Architectural Role**

### **1.1 Mandate and Core Responsibility**

The Session and State Management component is the central, non-UI component responsible for managing the lifecycle and state of a Weaving Session within the Markdown Semantic Weaver VS Code Extension.1 It is designated as the definitive **source of truth** for the entire operation.1 Its primary mandate is to maintain a consistent, predictable, and authoritative representation of the application's state at all times. This includes tracking the active status of a session, managing the collections of source and destination files, holding the reference to the session-specific vector database, and maintaining the in-memory Abstract Syntax Tree (AST) representations of all destination documents being authored. While other components, such as the Data Access & Services Layer, will orchestrate the logic for state transitions, this component is the sole entity authorized to perform the final mutation of the session state.1

All other components within the extension, from UI views to command handlers, must defer to this component for any information regarding the session's state. They are prohibited from maintaining their own separate, duplicative state concerning the session. This strict centralization is paramount to preventing state desynchronization, race conditions, and other common sources of instability in a complex, asynchronous environment like a VS Code extension.

### **1.2 Architectural Position as a Mediator**

Architecturally, the Session and State Management component functions as a central **mediator**. It is strategically positioned to decouple the application's other primary components: the Source Processing Pipeline, the Data Access & Services Layer, the VS Code UI Components, and the Command and Action Handlers.1 This decoupling is a cornerstone of the extension's design, promoting modularity, testability, and maintainability. As the central event bus, this component is the sole emitter of all events related to session state changes. This ensures a transactional approach to UI updates, preventing race conditions by guaranteeing that listeners are only notified after a state change has been successfully committed.

This mediation enforces a deliberate and highly beneficial **unidirectional data flow**. The flow operates in a predictable cycle:

1. **Action:** A user interaction (e.g., clicking a context menu item) is captured by the Command and Action Handlers.
2. **State Mutation:** The command handler invokes a method on the Session and State Management component to request a state change (e.g., addSourceFile()).1 The manager is the sole entity authorized to mutate the session state.
3. **Event Emission:** Upon successfully updating its internal state, the Session and State Management component broadcasts an event notifying the rest of the application that a change has occurred.1
4. **UI Update:** The VS Code UI Components, which are subscribed to these events, receive the notification. They then query the Session and State Management component for the new, authoritative state and re-render themselves accordingly.1

This pattern prevents the chaotic scenarios that can arise from bidirectional data bindings or allowing UI components to directly manipulate the state of other components. For instance, the Destination Document Outliner does not need to know what specific user action or background process led to a change in a document's AST; it only needs to know that the AST has changed, and it must re-render. This separation of concerns is critical for managing the complexity of the extension's interactive features.

## **2.0 Core Design Principles and Patterns**

### **2.1 Singleton Pattern for Global State Access**

The Session and State Management component will be implemented using the singleton pattern. This ensures that a single, globally accessible instance of the session manager exists throughout the lifecycle of the VS Code extension host. The rationale for this choice is rooted in the core concept of the extension: at any given time, a user is working within the context of, at most, one Weaving Session.2
A singleton provides a canonical, unambiguous point of access for all other components. A command handler triggered by a context menu, a TreeDataProvider for a sidebar view, and a Webview panel for the Glossary Editor can all reliably access the same session state instance without the need for complex dependency injection or prop-drilling. This simplifies the architecture and aligns perfectly with the component's role as the central source of truth.

### **2.2 Predictable State Transitions through Immutability**

To ensure a "predictable and stable user experience," the management of state transitions will be governed by principles of immutability.2 While the overall session state object is necessarily mutable over its lifecycle (e.g., files are added, ASTs are modified), each individual state change will be treated as an atomic operation that produces a new, complete state object from the previous one.
This principle is inspired by the specification's treatment of the initial source file selection as an "immutable snapshot".2 This concept is extended to the entire state object to prevent side effects and race conditions. Instead of methods directly mutating properties of the current state object (e.g.,
this.state.sourceFiles.push(...)), they will compute a new state object and then atomically replace the old one (e.g., this.state \= {...this.state, sourceFiles: newSourceFiles }).
This approach provides several advantages. First, it makes state changes explicit and traceable. Second, it prevents situations where one asynchronous operation could be interleaved with another, leaving the state in a corrupt or inconsistent intermediate phase. At any given moment, any consumer querying the state receives a complete and consistent snapshot. This discipline is essential for debugging and reasoning about the application's behavior, especially when dealing with concurrent user actions and background processing tasks.

### **2.3 Decoupling via an Event-Driven Architecture**

The primary mechanism for communicating state changes to the rest of the application will be a robust event emitter/subscriber system. The Session and State Management component will act as the central event bus for all session-related activities. It is explicitly required to provide events such as onSessionStart, onSessionEnd, and onDestinationDocumentUpdate.1
This event-driven architecture is the practical implementation of the component's role as a mediator. It allows for a high degree of decoupling. The VS Code UI Components, for example, do not need to be aware of the internal logic of the Command Handlers or the Source Processing Pipeline. They simply subscribe to events from the Session Manager. When an event like onDestinationDocumentDidChange is fired, the relevant UI view is activated, retrieves the latest state, and updates its presentation. This reactive model is highly efficient and scalable, allowing new UI components or listeners to be added to the system with minimal impact on existing components.

## **3.0 The Weaving Session Lifecycle: A State Machine Perspective**

### **3.1 Overview**

To provide a rigorous and unambiguous definition of its behavior, the Weaving Session lifecycle is modeled as a finite state machine. This formalism ensures that all states and transitions are explicitly defined, preventing invalid operations and providing clear hooks for UI updates and resource management.

### **3.2 States**

The session can exist in one of the following four states:

* **Inactive**: The default state of the extension upon activation. No session is running, and no session-specific resources are allocated. The extension's custom view container in the VS Code sidebar is not visible.
* **Initializing**: A transient state entered immediately after a user adds the first source or destination file to a new session. During this state, background tasks are performed, such as creating a session-specific directory on disk and initializing the Vectra vector database instance. The UI may show a global loading or progress indicator.
* **Active**: The primary operational state. The session has been successfully initialized, and all resources are ready. The user can add additional files, author destination documents, resolve similarity groups, and perform all core weaving tasks. The extension's view container is visible and interactive.
* **Terminating**: A transient state entered after the user executes the Publish command and confirms the action.2 During this state, the in-memory document models are serialized to physical files, and all session-specific resources (such as the on-disk vector database) are cleaned up. The UI should be disabled or show a "Publishing..." indicator to prevent further user interaction.

### **3.3 Transitions**

The movement between these states is governed by specific triggering actions and events, as detailed in the following table.
**Table 1: State Machine Transitions**

| Current State | Triggering Action/Event | Next State | Side Effects / Emitted Events |
| :---- | :---- | :---- | :---- |
| Inactive | User executes "Add as source" or "Add as destination" on the first file. | Initializing | onSessionWillStart event emitted. Session directory created. Vectra DB initialized. |
| Initializing | Session resources (e.g., Vectra DB) are successfully created. | Active | onSessionDidStart event emitted. VS Code view container becomes visible. |
| Initializing | Failure during resource creation (e.g., disk I/O error). | Inactive | onSessionDidEnd event emitted with an error payload. Cleanup of partial resources is attempted. An error message is displayed to the user. |
| Active | User executes the Publish command and confirms the action. | Terminating | onSessionWillEnd event emitted. UI interaction is disabled. |
| Terminating | All destination documents are serialized and session resources are cleaned up. | Inactive | onSessionDidEnd event emitted. VS Code view container is hidden. |
| Active | User closes the VS Code window/workspace. | Inactive | Session resources are cleaned up without publishing. No files are generated. |

## **4.0 Detailed Data Models and State Interface**

### **4.1 Core State Interface**

The following TypeScript interfaces define the precise structure of the session state. This WeavingSessionState interface represents the complete "source of truth" managed by this component.

TypeScript

import \* as vscode from 'vscode';
import { Root } from 'unist'; // From the Unified ecosystem, used by remark

/\*\*
 \* Represents the in-memory model of a destination document being authored.
 \*/
interface DestinationDocumentModel {
    /\*\* The URI of the physical or virtual file. \*/
    uri: vscode.Uri;
    /\*\* True if the document was created via "Add New Destination Document". \*/
    isNew: boolean;
    /\*\* The 'unist' Abstract Syntax Tree, representing the document's structure. \*/
    ast: Root;
}

/\*\*
 \* The complete, authoritative state of the Weaving Session.
 \*/
interface WeavingSessionState {
    /\*\* A unique identifier for the session, useful for logging and resource namespacing. \*/
    readonly sessionId: string;
    /\*\* The current state of the session lifecycle, as defined by the state machine. \*/
    readonly status: 'Inactive' | 'Initializing' | 'Active' | 'Terminating';
    /\*\* A read-only list of URIs for all source documents. \*/
    readonly sourceFileUris: Readonly\<vscode.Uri\>;
    /\*\* A read-only map of destination documents, keyed by URI string, for efficient lookup. \*/
    readonly destinationDocuments: Readonly\<Map\<string, DestinationDocumentModel\>\>;
    /\*\* The absolute file path to the session's on-disk Vectra vector database. \*/
    readonly vectraDbPath: string | null;
    /\*\* A map of canonical glossary terms to their resolved definitions. \*/
    readonly canonicalGlossary: Readonly\<Map\<string, string\>\>;
}

### **4.2 Data Model Rationale**

* **sessionId**: A unique identifier (e.g., a UUID) is crucial for namespacing session-specific resources on disk, preventing collisions, and for correlating log entries during debugging.
* **status**: This field directly implements the state machine defined in Section 3.0, providing a clear and unambiguous indicator of the session's current lifecycle phase.
* **sourceFileUris**: This is a simple list of URIs, reflecting the "immutable snapshot" principle for source files.2 The component only needs to track the identity of the source files; their processed content and embeddings reside within the
  Vectra database.
* **destinationDocuments**: A Map is chosen for O(1) lookup complexity, which is essential for quickly retrieving a document's model when its URI is known. The DestinationDocumentModel encapsulates the core working data for authoring: its URI and its mutable in-memory AST.1
* **vectraDbPath**: In line with the principle of not holding heavy resources directly in the state object, the manager stores only the file path to the Vectra database. This fulfills the responsibility of "Holding the reference to the session-specific Vectra vector database instance" 1 by managing its location and lifecycle. The
  Data Access Layer will use this path to establish its connection.
* **canonicalGlossary**: This map serves as the central repository for definitions that have been resolved by the user through the Glossary Editor, fulfilling the requirement to manage the canonical list.1

## **5.0 Public API Specification**

### **5.1 Overview**

The public API of the SessionManager singleton serves as the formal contract for all other components. These methods are the sole entry points for querying or modifying the session state, thereby enforcing the unidirectional data flow architecture. All state-modifying methods are asynchronous, returning a Promise to accommodate underlying file I/O or other long-running operations.

### **5.2 API Reference Table**

**Table 2: Public API Specification**

| Method Signature | Description | Emitted Events |
| :---- | :---- | :---- |
| static getInstance(): SessionManager | Accesses the singleton instance of the manager. | \- |
| isSessionActive(): boolean | Returns true if the session status is Active, false otherwise. | \- |
| getState(): Readonly\<WeavingSessionState\> | Returns a deep, read-only snapshot of the current session state. This prevents direct mutation by consumers. | \- |
| addSourceFile(uri: vscode.Uri): Promise\<void\> | Adds a source file to the session. If no session is active, this implicitly initializes a new one. It triggers the Source Processing Pipeline for the new file. Upon successful processing and mutation of the internal state, this component emits the `onSourceFilesDidChange` event. | onSessionWillStart, onSessionDidStart (if first file), onSourceFilesDidChange |
| addDestinationDocument(uri: vscode.Uri): Promise\<void\> | Adds an existing Markdown file as a destination document. If no session is active, this implicitly initializes a new one. It triggers the Source Processing Pipeline for the new file. Upon successful processing and mutation of the internal state, this component emits the `onDestinatonFilesDidChange` event. | onSessionWillStart, onSessionDidStart (if first file), onDestinationDocumentDidChange |
| createNewDestinationDocument(title: string): Promise\<vscode.Uri\> | Creates a new, empty destination document model in memory. If no session is active, this implicitly initializes one. Returns the URI of the virtual document. Upon successful processing and mutation of the internal state, this component emits the `onDestinationFilesDidChange` event. | onSessionWillStart, onSessionDidStart (if first file), onDestinationDocumentDidChange |
| updateDestinationDocumentAst(uri: vscode.Uri, newAst: Root): Promise\<void\> | Replaces the in-memory AST for a specified destination document with a new one. Upon successful processing and mutation of the internal state, this component emits the `onDestinationFilesDidChange` event. | onDestinationDocumentDidChange |
| publishAndEndSession(): Promise\<void\> | Initiates the 'Publish' workflow. This transitions the session to Terminating, triggers the Document Generation and Serialization component, and performs cleanup. | onSessionWillEnd, onSessionDidEnd |

## **6.0 Event Subsystem Specification**

### **6.1 Overview**

The event subsystem is critical for enabling the reactive nature of the extension's UI. The following events are emitted by the SessionManager to signal key state transitions. Components can subscribe to these events to perform actions or update their views without being tightly coupled to the code that triggered the change. This section provides the detailed contract for each event, including its payload, which was not specified in the initial component breakdown.1

### **6.2 Event Contract Table**

**Table 3: Event Model Specification**

| Event Name | Payload Interface | Description |
| :---- | :---- | :---- |
| onSessionWillStart | {} | Fired immediately before a new session is initialized. This is the ideal hook for UI components to display global loading indicators. |
| onSessionDidStart | { sessionId: string; } | Fired after a session has been successfully initialized and its status is Active. This signals the main UI view container to become visible. The sessionId is provided for logging purposes. |
| onSessionWillEnd | { sessionId: string; } | Fired just before the session termination process begins (e.g., on Publish). This is the hook for UI components to disable interactive elements to prevent changes during finalization. |
| onSessionDidEnd | { error?: Error } | Fired after the session has been fully terminated and its status is Inactive. This signals the main UI view container to hide itself. An optional error object is included if termination was abnormal. |
| onDestinationDocumentDidChange | { documentUri: vscode.Uri; } | Fired whenever a destination document's AST is created or modified. The documentUri in the payload is crucial for enabling targeted UI updates; for example, only the outliner for the affected document needs to refresh. |
| onSourceFilesDidChange | { addedUris: vscode.Uri; } | Fired after one or more source files have been successfully added to the session state. This allows views that list source files to update. |

## **7.0 Interaction Protocols and Key Workflows**

### **7.1 Workflow 1: Session Initiation**

This workflow details the sequence of events when a user starts a new session, illustrating the collaboration between components.

1. **User Action:** The user right-clicks a Markdown file in the VS Code File Explorer and selects the "Add as source" command from the context menu.
2. **Command and Action Handlers:** The registered command handler for this action is invoked by VS Code, receiving the file's vscode.Uri. The handler calls SessionManager.getInstance().addSourceFile(uri).
3. Session and State Management:
   a. The addSourceFile method is executed. It first calls isSessionActive(), which returns false.
   b. Recognizing that a new session must be started, it transitions its internal state to Initializing.
   c. It emits the onSessionWillStart event.
   d. It performs the necessary asynchronous setup operations: creating a temporary directory for session artifacts and initializing the Vectra vector database on disk.
   e. Upon successful setup, it updates its state by adding the file URI to the sourceFileUris list, transitions the status to Active, and emits the onSessionDidStart event with the new session ID.
4. **VS Code UI Components:** A top-level controller listening for onSessionDidStart receives the event. It then uses the vscode.commands.executeCommand API to set a context key (e.g., markdownSemanticWeaver.sessionActive) to true, which causes the extension's main view container in the sidebar to become visible based on its when clause in package.json.
5. **Source Processing Pipeline:** The addSourceFile method, after updating the state, triggers the Source Processing Pipeline for the newly added file. This pipeline runs as a background task, parsing the file, generating embeddings, and populating the Vectra database without blocking the UI.1

### **7.2 Workflow 2: Modifying a Destination Document via the Block Editor**

This workflow details how a change made in a specialized editor is propagated back to the central state and reflected in the UI.

1. **User Action:** The user clicks the "Edit" icon next to a content block node in the Destination Document Outliner TreeView.
2. **Command and Action Handlers:** The command associated with the "Edit" icon is executed. It retrieves the Markdown content for that specific block by querying the Data Access Layer, which in turn reads the appropriate node from the document's AST held by the SessionManager.
3. **Custom Editor Experiences:** The command handler opens a new, untitled temporary document—the Block Editor—and populates it with the retrieved Markdown content.2
4. **User Action:** The user edits the content in the Block Editor and saves or closes the document.
5. **VS Code API / Command Handlers:** The extension listens for VS Code's onDidSaveTextDocument or onDidCloseTextDocument events. The handler identifies that the document was its temporary Block Editor, retrieves the modified content, and then constructs an entirely new AST for the parent destination document, replacing the old block's content with the new.
6. **Session and State Management:** The handler, likely via a call to a method on the Data Access & Services Layer, ultimately triggers the `SessionManager.getInstance().updateDestinationDocumentAst(uri, newAst)` method, passing the URI of the destination document and the newly constructed AST. This method replaces the old AST in the state map and emits the onDestinationDocumentDidChange({ documentUri: uri }) event.
7. **VS Code UI Components:** The Destination Document Outliner's TreeDataProvider is subscribed to the onDestinationDocumentDidChange event. When the event is received, the provider checks if the documentUri in the payload matches the URI of the document it is currently displaying. If it does, it fires its own onDidChangeTreeData event, causing VS Code to request the updated tree structure, which is then rendered to the user, reflecting the edits.

## **8.0 State Persistence and Scoping**

### **8.1 Overview**

A clear understanding of the persistence strategies and lifetimes of different state categories is essential for correct implementation. The system manages data across three distinct scopes: volatile in-memory state, temporary session-scoped disk state, and permanent workspace state.

### **8.2 State Scopes Table**

**Table 4: State Scopes and Persistence**

| State Category | Data Example | Persistence Strategy | Lifetime | Managed By |
| :---- | :---- | :---- | :---- | :---- |
| **In-Memory Volatile State** | The ast property of a DestinationDocumentModel object. | Held in RAM within the SessionManager's internal state object. | The lifetime of the VS Code extension host process. This state is lost when the VS Code window is closed. | Session and State Management |
| **Session-Scoped Disk State** | The Vectra vector database file containing all content embeddings. | Stored in a temporary directory on disk, managed via ExtensionContext.globalStorageUri to ensure proper cleanup. | The duration of a single Weaving Session. It is created on session initiation and explicitly deleted on session termination.2 | Session and State Management (manages path), Source Processing Pipeline (writes data) |
| **Workspace-Persistent State** | The user's original source .md files and the final, published destination .md files. | Physical files located within the user's VS Code workspace folder. | User-managed. This data persists indefinitely until manually deleted by the user. | User / VS Code File System |
| **VS Code Global State** | A flag or session ID indicating that a session was active when the window was last closed. | Stored in VS Code's key-value store via ExtensionContext.globalState. | Persists across VS Code sessions and window reloads. | Session and State Management (for potential session recovery logic) |

## **9.0 Error Handling and Resilience**

### **9.1 Guiding Principles**

The Session and State Management component must be designed for resilience. Failures are inevitable and must be handled gracefully to prevent data loss or state corruption. The core principles are: fail fast for programming errors, isolate failures where possible, and provide clear feedback to the user when an operation cannot be completed.

### **9.2 Failure Scenarios and Mitigation**

* **Scenario 1: Session Initialization Failure**
  * **Cause:** The component fails to create the session directory or initialize the Vectra database due to issues like insufficient disk space or file system permissions errors.
  * **Handling:** The internal session initialization method will be wrapped in a try...catch block. If an error is caught, the component will execute a cleanup routine to remove any partially created artifacts. It will then ensure its internal state transitions back to Inactive, emit an onSessionDidEnd event with the Error object in its payload, and use the vscode.window.showErrorMessage function to present a user-friendly error message explaining why the session could not be started.
* **Scenario 2: Source File Processing Failure**
  * **Cause:** A user adds a source file that is unreadable, corrupted, or contains severely malformed Markdown that causes the remark parser to fail.
  * **Handling:** This failure originates in the Source Processing Pipeline. The pipeline must be designed to catch such errors on a per-file basis and report the failure back to the SessionManager. The SessionManager will *not* terminate the entire session. Instead, it will log the error and update the state for that specific source file to indicate a failed status. The UI components listening for source file changes will then render an error icon or message next to the problematic file, allowing the user to continue working with other valid source files.
* **Scenario 3: Invalid State Transition**
  * **Cause:** A programming error in another component attempts to call a method at an inappropriate time, such as calling updateDestinationDocumentAst when the session status is Inactive.
  * **Handling:** To guard against state corruption, every public method that requires an active session will begin with a state assertion check (e.g., if (\!this.isSessionActive()) {... }). If the assertion fails, the method will immediately throw a DeveloperError, making it clear during development that the API is being used incorrectly. This fail-fast approach prevents the error from propagating and causing unpredictable behavior later in the workflow.