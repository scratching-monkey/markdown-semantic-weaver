# **Design Specification: The Weaving View UI Component**

## **1.0 Architectural Overview and Core Design Principles**

This document provides a comprehensive design specification for the VS Code UI Components of the Markdown Semantic Weaver Visual Studio Code extension, collectively known as the "Weaving View." The Weaving View serves as the primary user interface for the weaving workflow:, providing a structured environment for managing documents, browsing source content, resolving semantic similarities, and authoring new Markdown files.

### **1.1 Role and Placement**

The Weaving View is implemented as a dedicated VS Code View Container, which will be contributed to the VS Code sidebar under the unique identifier markdown-semantic-weaver.1 This container acts as the central hub for all user interactions within a weaving session. Its visibility within the user interface is not static; it is conditionally controlled by the active state of a
**Weaving Session.2 This ensures that the extension's UI elements are only present when the user has explicitly initiated a weaving workflow:, preventing unnecessary clutter in the VS Code sidebar during normal editing tasks.2 The view container will host four distinct sub-components: the Destination Documents View, the Sections View, the Terms View, and the Destination Document Outliner.1

### **1.2 Core Architectural Pattern (MVC/MVVM)**

The entire Weaving View component will adhere to a strict separation of concerns, closely aligning with a Model-View-Controller (MVC) architectural pattern to ensure maintainability, testability, and clarity of roles.1

* **Model:** The single source of truth for the application's state resides outside the UI layer. This "Model" is composed of the Session and State Management service, which manages the in-memory state of the session (e.g., lists of files, active document ASTs), and the underlying Vectra vector database, which persists session data to disk. All interactions with this model are mediated through a dedicated Data Access & Services Layer.1
* **View:** The four TreeView components that constitute the Weaving View are the "View" layer. Their sole responsibility is to render the state provided by the Model. They are implemented using the standard VS Code TreeDataProvider API and are designed to be "dumb" components, containing no business logic, state management, or data manipulation capabilities.1
* **Controller:** The Command and Action Handlers component serves as the "Controller" layer. It is responsible for intercepting all user interactions from the View—such as button clicks, context menu selections, and drag-and-drop operations—and translating these UI gestures into specific, state-changing operations on the Model via the Data Access & Services Layer.1

### **1.3 Event-Driven State Synchronization**

To maintain a responsive and consistent user interface, the Weaving View will employ a fully reactive, event-driven state synchronization model. The UI components will not be responsible for polling the Model for changes. Instead, the Session and State Management service will function as an event bus, emitting strongly-typed events whenever the underlying session data is mutated.1 Each of the four
TreeDataProvider implementations will subscribe to the relevant events. Upon receiving an event, a provider will trigger a refresh of its respective view, ensuring that the UI is always an accurate and immediate reflection of the application's current state. This decoupled architecture prevents tight coupling between UI components and simplifies the logic for keeping the various views synchronized.1

### **1.4 Implicit Session Management and View Visibility**

The visibility of the entire Weaving View container is directly tied to the lifecycle of a Weaving Session. A session is implicitly initiated the first time a user adds a file as either a source or a destination.2 At this moment, the command handler responsible for this action will set a VS Code context variable, such as markdown-semantic-weaver.sessionActive, to true. The when clause for the view container's contribution in the package.json file will be configured to this context variable. Consequently, the Weaving View will automatically appear. When the session ends (e.g., upon publishing the documents), this context variable will be set to false, and the view container will be hidden from the sidebar, returning the workspace to its previous state.2

A critical aspect of the design is the formalization of an "Application Context" or "Focus State" within the Session and State Management service. The specification repeatedly refers to contextual states, such as the "currently active" destination document or the "selected" content block in the outliner, which act as preconditions for user actions.2 For example, the ability to insert a section from the
Sections View is contingent upon having a valid insertion point selected in the Destination Document Outliner. To manage this, the central state service must maintain not only the core data models but also a dedicated context object, for example: { activeDocumentUri: string | null, activeContentBlockId: string | null }. User selections in the UI will trigger commands that update this central context object. In turn, the service will emit focus-change events that other parts of the UI can listen to. This transforms the system into a well-defined state machine, where the availability and behavior of commands are dynamically controlled by the user's current focus, preventing invalid operations and providing a more intuitive workflow.

## **2.0 Core UI Framework: TreeDataProvider Implementation**

To ensure consistency, maintainability, and adherence to VS Code extension best practices, all four sub-components of the Weaving View will be built upon a common technical foundation: the vscode.TreeDataProvider API. This section details the standardized approach for their implementation.

### **2.1 Unified TreeDataProvider Interface**

Each of the four views—Destination Documents, Sections, Terms, and Destination Document Outliner—will be implemented as a distinct TypeScript class that implements the vscode.TreeDataProvider\<T\> interface. The generic type T will represent the specific data element that the view is responsible for rendering (e.g., a document reference, a section group, a content block). This approach enforces a consistent contract for how the VS Code sidebar interacts with our extension's data, standardizing the methods for fetching child elements (getChildren), resolving the visual representation of an element (getTreeItem), and handling parent-child relationships (getParent).

### **2.2 Data Structures and TreeItem Mapping**

A clear mapping between the internal data models and the UI representation is essential. Each provider will define a specific data type for its elements (e.g., DestinationDocumentItem, SectionItem, TermItem, ContentBlockItem). The getTreeItem(element: T): vscode.TreeItem method within each provider is responsible for this transformation.
A particularly critical property of the vscode.TreeItem object is contextValue. This string property will be used to declaratively associate specific commands and context menus with different types of nodes in the package.json file. For instance, a Similarity Group item in the Sections View will be assigned a contextValue of markdown-semantic-weaver:similarityGroup, whereas a unique section item will have markdown-semantic-weaver:uniqueSection. This allows for a clean separation of UI rendering logic from command contribution logic. A developer can add or modify context menu items for specific node types by simply editing the menus contribution point in package.json and targeting the appropriate contextValue, without needing to alter the TreeDataProvider's code.

### **2.3 Refresh Mechanism**

To facilitate the event-driven architecture, each TreeDataProvider will implement the standard refresh mechanism required by the API. This involves exposing a private \_onDidChangeTreeData: vscode.EventEmitter\<T | undefined | null | void\> and a public onDidChangeTreeData: vscode.Event\<...\> property. A public refresh() method will be implemented on each provider, which encapsulates the logic of firing the event: this.\_onDidChangeTreeData.fire(). This refresh() method is the designated entry point for external components to request a view update. It will be invoked by the event listeners that subscribe to state change events from the central Session and State Management service, thus completing the reactive loop.
The following table provides a comprehensive summary of the API and command contribution points for the entire Weaving View, serving as a quick-reference guide for development and maintenance.
**Table 1: TreeDataProvider API and Command Contributions**

| View ID | TreeDataProvider Class | TreeItem contextValue(s) | Contributed Commands (Title Bar) | Contributed Commands (Context Menu) |
| :---- | :---- | :---- | :---- | :---- |
| markdown-semantic-weaver.destinationDocuments | DestinationDocumentsProvider | markdown-semantic-weaver:destinationDocument | markdown-semantic-weaver.addNewDestinationDocument | markdown-semantic-weaver.removeDestinationDocument |
| markdown-semantic-weaver.sections | SectionsProvider | markdown-semantic-weaver:uniqueSection, markdown-semantic-weaver:similarityGroup | markdown-semantic-weaver.refreshSections | markdown-semantic-weaver.insertSection |
| markdown-semantic-weaver.terms | TermsProvider | markdown-semantic-weaver:uniqueTerm, markdown-semantic-weaver:termGroup | markdown-semantic-weaver.refreshTerms | markdown-semantic-weaver.removeTerm |
| markdown-semantic-weaver.documentOutliner | DocumentOutlinerProvider | markdown-semantic-weaver:contentBlock | markdown-semantic-weaver.addContentBlock | markdown-semantic-weaver.editContentBlock, markdown-semantic-weaver.deleteContentBlock |

## **3.0 Component Specification: Destination Documents View**

The Destination Documents View is the primary control surface for managing the target files within a weaving session. It provides a clear list of all documents being authored and serves as the entry point for creating new ones.

### **3.1 Data Model and Provider Logic**

The DestinationDocumentsProvider is responsible for rendering this view. Its data source is the Session and State Management service, which maintains an authoritative list of all destination file URIs for the current session.1 The provider's
getChildren() method will query this service, retrieve the list of URIs, and map each URI to a corresponding TreeItem object.

### **3.2 Visual Representation**

Each TreeItem in the list will be configured to provide clear and concise information about the destination document it represents:

* **label**: The base name of the file (e.g., Chapter-1.md) will be used as the primary display text.
* **iconPath**: A standard VS Code icon, codicon-markdown, will be used to visually identify the item as a Markdown file.
* **tooltip**: The full, absolute file path will be assigned to the tooltip to allow users to disambiguate files with the same name in different directories.
* **command**: A command object will be associated with each item, configured to execute an internal command, markdown-semantic-weaver.setActiveDocument, and pass the item's URI as an argument. This command is the key mechanism for updating the application's focus state.2

### **3.3 Commands and Interactions**

The view supports two primary user interactions: adding a new document and selecting an existing one.

* **Add New Destination Document**: A command icon (codicon-add) will be contributed to the view's title bar. This icon is bound to the markdown-semantic-weaver.addNewDestinationDocument command.2 When triggered, the command handler will:
  1. Invoke vscode.window.showInputBox to display a modal dialog prompting the user for a document title.
  2. Sanitize the user-provided title to generate a valid, URL-safe filename (e.g., "My New Chapter" becomes my-new-chapter.md).
  3. Instruct the Session and State Management service to create a new, empty in-memory Abstract Syntax Tree (AST) for this document and add its virtual URI to the session's list of destination files.
  4. The state service, upon successful creation, will emit an event (e.g., onDataRefreshed). The DestinationDocumentsProvider, being a subscriber, will receive this event and trigger a refresh, causing the new document to appear in the list.
* **Selection Behavior**: When a user clicks on a document in the list, the associated markdown-semantic-weaver.setActiveDocument command is executed.2 The handler for this command updates the
  activeDocumentUri property within the central application context managed by the state service. This state change, in turn, causes the service to emit the onActiveDocumentChanged event. The Destination Document Outliner provider is the primary subscriber to this event and will respond by fetching the AST for the newly active document and re-rendering its own view to display that document's structure.1

## **4.0 Component Specification: Sections View**

The Sections View is the core interface for browsing, comparing, and incorporating content from the pool of source documents. It presents the results of the semantic analysis in an organized manner, distinguishing between unique content blocks and groups of similar ones.

### **4.1 Data Model and Provider Logic**

The SectionsProvider populates this view. Unlike the Destination Documents View, it does not interact directly with the session state. Instead, it queries the Data Access & Services Layer to retrieve a structured list of sections.1 The service layer is responsible for querying the
Vectra database and returning a data structure that has already pre-processed the content into a hierarchy of unique sections and Similarity Groups.2 The
getChildren() method of the provider will then render this pre-organized structure.

### **4.2 Visual Representation and State Indication**

Clear visual cues are essential for users to quickly understand the nature and status of each item in the Sections View.

* **Iconography**: To visually differentiate between item types, distinct icons will be used 2:
  * **Unique Sections**: These items will be rendered with a codicon-file icon (a single document), signifying a standalone content block from a single source.2
  * **Similarity Groups**: These items will be rendered with a codicon-files icon (multiple documents), indicating a collection of two or more semantically similar content blocks that require user resolution.2
* **Resolved State**: As users work through the content, items that have been processed (e.g., inserted, merged, or discarded) will be marked as "resolved" in the database.2 To provide clear visual feedback on this progress, the
  SectionsProvider will render resolved items differently. The TreeItem's label property will be set to an object of the form { label: "Item Name", strikethrough: true }. Additionally, its icon color can be set to a less prominent theme color, such as disabledForeground, to visually de-emphasize it. This makes it easy for users to see which items still require attention.2

### **4.3 Commands and Interactions**

The interactions available to the user depend on the type of item selected.

* **Selecting a Unique Section**: When a unique section is selected, the markdown-semantic-weaver.insertSection command becomes available (e.g., via a context menu or an inline icon on hover). The enablement of this command is context-dependent; it will only be active if the markdown-semantic-weaver.sessionContext.activeContentBlockId is not null, ensuring an insertion point has been selected in the outliner. When executed, the command handler instructs the Data Access Layer to perform two critical operations: first, to insert the Markdown content of the selected section into the active document's AST at the position of the focused block, and second, to update the status of the source section in the Vectra database to "resolved".2
* **Selecting a Similarity Group**: Selecting a similarity group triggers the markdown-semantic-weaver.openComparisonEditor command. This command's handler passes the unique identifier of the selected group to the Command and Action Handler component, which then orchestrates the opening of the custom Comparison Editor. This specialized editor provides a dedicated interface for comparing the sections within the group and resolving them via insertion, deletion, or AI-powered merging.2

The management of the "resolved" state involves a cascading logic that must be handled carefully. When a user resolves the last remaining section within a Similarity Group (via actions in the Comparison Editor), the data layer must not only mark that individual section as resolved but also check if its parent group now contains any unresolved children. If it does not, the data layer must automatically and atomically update the status of the parent Similarity Group itself to "resolved".2 This entire transaction must be handled within the
Data Access & Services Layer to ensure data integrity. This prevents the UI from ever entering an inconsistent state where a group is shown as resolved while still containing unresolved children. The completion of this transaction will trigger a single refresh event, causing the Sections View to re-render and correctly display both the final section and its parent group in their new, resolved state.

## **5.0 Component Specification: Terms View**

The Terms View provides a dedicated interface for managing the project's glossary. It allows users to review definitions extracted from source documents, refine them, and resolve semantic duplicates to build a canonical list of terms.

### **5.1 Data Model and Provider Logic**

Similar to the Sections View, the TermsProvider relies on the Data Access & Services Layer for its data. It will issue a query to retrieve a structured list of all unique terms and groups of similar terms that were identified by the keyphrase extraction and embedding analysis during the source processing phase.1 The provider then renders this data in a
TreeView.

### **5.2 Visual Representation**

The view will use distinct visual cues to help users differentiate between item types and access relevant actions.

* **Iconography**: Unique terms and term groups will be distinguished using appropriate icons from the VS Code library.2 For example, a
  codicon-tag could represent a unique term, while a codicon-tags icon could represent a group of similar terms requiring resolution.2
* **Context Menus**: All items within the view will feature a right-click context menu to provide access to item-specific commands.2

### **5.3 Commands and Interactions**

The user's workflow for managing terms is facilitated by three primary commands:

* **Selecting a Unique Term**: When a user selects an item representing a unique term, the markdown-semantic-weaver.openTermInBlockEditor command is triggered. This action opens the term's definition content in the simple Block Editor, providing a standard Markdown editing experience for the user to refine or correct the definition.2 Changes saved in the Block Editor are persisted back to the session's data model.
* **Selecting a Term Group**: Selecting an item representing a group of similar terms executes the markdown-semantic-weaver.openGlossaryEditor command. This opens the custom Webview-based Glossary Editor, a rich user interface specifically designed for comparing multiple definitions side-by-side and resolving them by selecting a canonical version, qualifying terms, or merging them with AI assistance.2
* **Remove Term Command**: To handle false positives from the automated extraction process, a markdown-semantic-weaver.removeTerm command will be available in the context menu for any term or term group.2 This is a destructive action that instructs the
  Data Access Layer to permanently remove the corresponding entry from the session's Vectra database. To prevent accidental data loss, the command handler must first display a confirmation dialog (vscode.window.showWarningMessage) to the user before proceeding with the deletion.2

## **6.0 Component Specification: Destination Document Outliner**

The Destination Document Outliner is the most interactive and central component of the Weaving View. It functions as the primary structural editor, representing the active destination document not as a flat text file, but as a hierarchical tree of editable Content Blocks.

### **6.1 Data Model and Content Block Structure**

The DocumentOutlinerProvider operates on the in-memory AST of the currently active destination document, which is managed by the Session and State Management service. The fundamental unit of this view is the ContentBlock. To ensure a clear and unambiguous contract between the data layer and the UI, the ContentBlock data structure must be explicitly defined as follows.
**Table 2: Content Block Data Model**

| Property | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| id | string | A unique identifier (e.g., UUID) for this block, stable across re-renders. | Generated on creation. |
| type | string | The Markdown AST node type (e.g., 'heading', 'paragraph', 'list'). Used for iconography and validation. | remark parser. |
| content | string | The raw Markdown content of the block. | remark parser. |
| summary | string | An AI-generated summary of the block's content, displayed in the UI. | AI Service. |
| parentId | string | null | The id of the parent block. null for root-level blocks, defining the tree structure. | Session State. |
| children | ContentBlock | An ordered array of child ContentBlock objects. | Session State. |

### **6.2 Visual Representation**

Each node in the outliner TreeView is a vscode.TreeItem derived from a ContentBlock object, configured to present structural information efficiently.

* The TreeItem.label will be set to the first line of the block's raw content, which for elements like headings provides an immediate and recognizable title.2
* The TreeItem.description property will be populated with the summary from the ContentBlock data model. This displays the AI-generated summary next to the label, giving users an at-a-glance understanding of the block's content without needing to open an editor.2
* The TreeItem.collapsibleState will be dynamically set based on the block's structure. Blocks with children (e.g., a heading with paragraphs under it) will be set to vscode.TreeItemCollapsibleState.Expanded or Collapsed, while leaf nodes (e.g., a paragraph) will be set to None.

### **6.3 Commands and Interactions**

The outliner supports direct manipulation of the document's structure through several mechanisms.

* **Inline Actions**: To provide quick access to common operations, each tree item will feature inline action icons that appear on hover. These include an "Edit" icon (codicon-edit) and a "Delete" icon (codicon-trash). These icons are bound to the markdown-semantic-weaver.editContentBlock and markdown-semantic-weaver.deleteContentBlock commands respectively, passing the relevant ContentBlock ID as an argument.2
* **Drag-and-Drop Reordering**: For intuitive restructuring, the DocumentOutlinerProvider will also implement the vscode.DragAndDropController interface.2
  * The handleDrag method will be responsible for validating the drag-and-drop operation in real-time. For example, it can provide visual feedback to prevent invalid operations, such as dropping a level-2 heading inside a paragraph.
  * The handleDrop method will be executed when the user completes the drop. This method will not manipulate the AST directly. Instead, it will gather the necessary information (the ID of the block being moved, the ID of its new parent, and its new index within the parent's children) and invoke a dedicated method in the Data Access & Services Layer, such as restructureDocument(documentUri, { blockId, newParentId, newIndex }). This service layer method is responsible for performing the actual, atomic manipulation of the in-memory AST. Upon successful completion, the service layer will trigger a document-wide refresh event (onDocumentMutated), causing the outliner to re-render and reflect the new structure.2

## **7.0 State Management and Inter-Component Communication Protocol**

The robustness and coherence of the Weaving View depend on a well-defined communication protocol between its sub-components and the central state management services. This section formalizes the event-driven architecture that ensures all UI elements remain synchronized with the underlying session state.

### **7.1 Event Catalogue**

The Session and State Management service will act as the single, authoritative source of state change events. It will expose a public API for other components, primarily the TreeDataProvider implementations, to subscribe to the following events:

* **onSessionStateChanged: Event\<boolean\>**: Fired with true when a weaving session starts and false when it ends. This event is used by the extension's main controller to set the markdown-semantic-weaver.sessionActive context variable, which controls the visibility of the entire view container.
* **onActiveDocumentChanged: Event\<vscode.Uri | null\>**: Fired whenever the user selects a different document in the Destination Documents View. The DocumentOutlinerProvider is the primary subscriber and responds by reloading its data to display the structure of the newly active document.
* **onFocusChanged: Event\<{ documentUri: vscode.Uri, blockId: string | null }\>**: Fired when the user selects a Content Block within the Destination Document Outliner. Other views, such as the Sections View, subscribe to this event to enable or disable context-sensitive commands like "Insert Section."
* **onDataRefreshed: Event\<{ scope: 'sections' | 'terms' | 'all' }\>**: A general-purpose event fired after a background process that modifies the source data pool is complete (e.g., adding a new source file). The SectionsProvider and TermsProvider subscribe to this to fetch the latest analysis results from the Data Access Layer.
* **onDocumentMutated: Event\<vscode.Uri\>**: Fired whenever the AST of a specific destination document is changed through actions like editing a block, inserting a section, or reordering via drag-and-drop. The DocumentOutlinerProvider subscribes to this event and, if the mutated URI matches the currently active document, triggers a refresh of its view.

### **7.2 Interaction Flow Example: Inserting a Section**

The following table illustrates the end-to-end communication flow for the core user story of inserting a section into a destination document. This example demonstrates the decoupled, event-driven nature of the architecture, where components react to state changes rather than communicating directly with one another.
**Table 3: Event-Driven Communication Protocol for Section Insertion**

| Step | User Action | Originating Component | Command/Handler | State Management / Data Layer | Responding Component(s) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Selects chapter-1.md in the list. | Destination Documents View | markdown-semantic-weaver.setActiveDocument | SessionState.activeDocumentUri is set to chapter-1.md. Fires onActiveDocumentChanged event. | Document Outliner receives event, fetches the AST for chapter-1.md, and refreshes its view to display the document's structure. |
| 2 | Clicks on a paragraph block within the outliner. | Destination Document Outliner | markdown-semantic-weaver.setFocus | SessionState.activeContentBlockId is set to the paragraph's ID. Fires onFocusChanged event. | Sections View receives event and enables its "Insert" command, as a valid insertion point is now selected. |
| 3 | Right-clicks a unique section and selects "Insert." | Sections View | markdown-semantic-weaver.insertSection | Calls DataAccess.insertContent(...) with the section's content and the target block's ID. Calls DataAccess.markSectionAsResolved(...). | N/A |
| 4 | N/A | Data Access Layer | N/A | The in-memory AST for chapter-1.md is modified. The state of the source section is updated in the Vectra database. | N/A |
| 5 | N/A | Session and State Management | N/A | Fires onDocumentMutated event with the URI for chapter-1.md. Fires onDataRefreshed event with scope 'sections'. | Document Outliner receives onDocumentMutated and refreshes to show the newly inserted content. Sections View receives onDataRefreshed and refreshes to show the source section as resolved (e.g., with a strikethrough). |

## **8.0 Performance, Error Handling, and Usability**

Beyond core functionality, the design must address non-functional requirements to ensure the Weaving View is robust, responsive, and provides a positive user experience.

### **8.1 Performance Considerations**

* **Lazy Loading**: The TreeView API inherently supports lazy loading of data. The getChildren(element) method is only invoked for nodes that the user expands. This is critical for performance, especially in the Sections, Terms, and Outliner views, which may contain large, deeply nested hierarchical data. The implementation must leverage this behavior to avoid the performance cost of processing an entire data structure upfront.
* **Asynchronous Operations**: All I/O-bound or computationally intensive operations, particularly data fetching from the Data Access Layer (which may query the on-disk database), must be implemented asynchronously using async/await. This prevents blocking the main extension host thread and ensures the VS Code UI remains responsive at all times. While a data fetch is in progress following a refresh request, the vscode.window.withProgress API should be used to display a non-intrusive progress indicator in the view, informing the user that work is being done in the background.

### **8.2 State Indication**

Clear communication of the application's state is crucial for usability.

* **Empty States**: The views must handle scenarios where no data is available. When a session is active but a view is empty (e.g., no destination documents have been added yet), the TreeDataProvider should not return an empty list. Instead, it should return a single, non-interactive TreeItem with an informative message, such as "Add a destination document to begin authoring," guiding the user on the next step.
* **Loading States**: As noted above, any background processing that may take a noticeable amount of time, such as the initial parsing and embedding of a large source file, must be accompanied by a visual loading indicator. The vscode.window.withProgress API with ProgressLocation.Window or ProgressLocation.Notification is the standard mechanism for this.

### **8.3 Error Handling**

A robust error-handling strategy is essential to prevent the extension from entering an unstable state.

* The Data Access Layer will serve as the primary error-handling boundary. It will be responsible for wrapping all database and file system operations in try...catch blocks. It must anticipate and gracefully handle potential errors such as database corruption, file read/write failures, or failed AI service calls.
* Exceptions should not be allowed to bubble up to the UI (TreeDataProvider) layer. Instead, when an error is caught in the data layer, it should be logged to the extension's output channel for debugging purposes. A user-friendly error message should then be displayed using vscode.window.showErrorMessage. The UI itself will simply fail to refresh, remaining in its last known good state, which is preferable to crashing or displaying corrupted data.