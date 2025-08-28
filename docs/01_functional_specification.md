# **Functional Specification: Markdown Semantic Weaver**

## **1\. Executive Summary**

This document outlines the functional specification for the **Markdown Semantic Weaver**, a Visual Studio Code extension designed to assist users in authoring new Markdown documents by leveraging content from multiple source files.
The extension provides a structured authoring environment where users can analyze semantic similarities between sections of source documents, manage a glossary of terms, and compose multiple destination documents in an outliner-style interface. The core workflow is session-based, treating the initial selection of source files as an immutable snapshot to ensure a predictable and stable user experience.

## **2\. Core Concepts**

* **Weaving Session**: A temporary, self-contained workspace that is implicitly created when a user adds the first source or destination file. All operations occur within the context of an active session. The session ends when the user publishes the final documents.
* **Structural Editor**: The primary user interface for authoring a destination document. It represents the document not as a flat text file, but as a hierarchical tree of content blocks (headings, paragraphs, etc.).
* **Content Block**: The fundamental unit of content within the Structural Editor, corresponding to an element in the Markdown AST (e.g., a single paragraph, a list, a code block).
* **Similarity Group**: A collection of two or more content blocks, identified through vector embedding analysis, that are determined to be semantically similar.

## **3\. Functional Requirements**

### **3.1. Session Management**

* **Session Initiation**: A weaving session is implicitly started when a user first adds a file as a source or destination. The extension's custom view container will become visible at this time.
* **Adding Files to Session**: The user adds files via a dedicated group within the File Explorer's right-click context menu.
  * **"Add as source"**: Adds the selected file(s) to the pool of source documents for analysis. This command is available for single or multiple Markdown file selections.
  * **"Add as destination"**: Adds the selected file as a destination document for authoring. This command is only available when a single Markdown file is selected. When an existing document is added, its content is parsed into an AST, and its structure populates the Destination Document Outliner.
* **Source Processing**: Upon adding a source file, the extension will perform the following background tasks with a visible progress indicator:
  * Parse the source file into an Abstract Syntax Tree (AST) using **remark**.
  * Divide the content into logical sections.
  * Extract potential definition candidates using a hybrid approach of linguistic heuristics and keyphrase extraction with **RAST**.
  * Generate a vector embedding for each section's content and for each extracted definition using **fastembed-js** with the **BAAI/bge-small-en-v1.5** model.
  * Store all processed data (content, embeddings, metadata) in a **Vectra** vector database, which persists to disk for the session's duration.
  * Query the vector database to identify Similarity Groups among sections and glossary terms.

### **3.2. User Interface: The Weaving View**

The extension will contribute a dedicated view container to the VS Code sidebar, hosting the following components:

#### **3.2.1. Destination Documents View**

* A TreeView listing all destination documents for the current session.
* A command in the view's title bar, "Add New Destination Document," shall prompt the user for a **title**, from which a filename will be generated. This creates a new, empty destination document.
* Selecting a document in this view will populate the **Destination Document Outliner** with its content.

#### **3.2.2. Sections View**

* A TreeView that displays all unique sections and Similarity Groups from the source documents.
* Icons will distinguish between unique sections (single document icon) and Similarity Groups (multiple documents icon).
* **Unique sections** can be inserted directly into the active Destination Document Outliner, provided a Content Block is selected in the outliner. This action marks the section as resolved in the database and the Sections View.
* Selecting a **Similarity Group** while a Content Block is selected in the outliner will open the **Comparison Editor**.

#### **3.2.3. Terms View**

* A TreeView that displays all unique terms and similar term groups identified from source documents.
* Icons will distinguish between unique terms and groups of similar terms.
* **Unique terms**: Selecting a unique term will open its definition in the **Block Editor** for refinement.
* **Similar term groups**: Selecting a group will open the **Glossary Editor** for comparison and resolution.
* A right-click context menu on any term or group will provide a "Remove Term" command to handle false positives.

#### **3.2.4. Destination Document Outliner**

* A TreeView providing a structural representation of the currently selected destination document.
* Each node in the tree shall represent a Content Block.
* Each node shall display an AI-generated summary of its content as its description.
* The view shall support the following actions:
  * **Add**: Add new Content Blocks.
  * **Edit**: Open the **Block Editor** for that content.
  * **Delete**: Remove the block from the document structure.
  * **Reorder**: Drag and drop nodes to restructure the document.

### **3.3. Editor Experiences**

#### **3.3.1. Block Editor**

* Triggered by the "Edit" action in the Destination Document Outliner or by selecting a unique term in the Terms View.
* Opens a new, untitled temporary document containing only the Markdown for the selected Content Block or definition.
* The user can edit the content using the native VS Code Markdown editor.
* Upon saving or closing, the changes will be saved back to the internal model and the relevant views will refresh.

#### **3.3.2. Comparison Editor**

* This editor is for resolving Similarity Groups from the Sections View. It will open in a new editor group, showing a virtual document on the left and a block editor for the destination section on the right.
* **Virtual Document (Left Pane)**:
  * Read-only.
  * Displays the content of all sections within the selected Similarity Group.
  * Each section will be preceded by a separator containing its source file metadata.
  * A CodeLens above each section will provide "Insert," "Delete," and "Pop" commands.
    * **Insert** will add the section's content into the block editor at the cursor. The section in the virtual document will be highlighted green, and its commands will be disabled.
    * **Delete** will apply a **red strikethrough** to the section's content in the virtual document.
    * **Pop** will handle a false positive by removing the section from the group. The section's content will receive a **grey strikethrough** in the virtual document, and it will be added to the Sections View as a new unique section.
  * A CodeAction will be available when multiple sections are selected to trigger a "Merge with AI" command.
    * The merged content will be inserted into the block editor at the cursor. The participating sections in the virtual document will receive a **blue strikethrough**, their commands will be disabled, and they can no longer be part of a merge action.
* When a section is inserted, deleted, popped, or merged, it will be marked as resolved in the database. Once all sections in a Similarity Group are resolved, the group will be marked as resolved in the Sections View.

#### **3.3.3. Glossary Editor**

* A custom Webview editor for managing and resolving similar term groups.
* The UI will present each similar definition as a card with its source metadata.
* **Actions**:
  * **Select This One**: Marks the chosen definition as canonical. This action is disabled if more than one definition is selected.
  * **Qualify**: Prompts the user for a qualifier string, which is then appended to the term (e.g., Term (Qualifier)).
  * **Merge with AI**: Triggers an AI-powered merge of the selected definitions.
* The chosen, qualified, or merged definition is stored in the session's central list of canonical definitions.

### **3.4. Document Generation**

The extension shall provide two modes for generating document output, available as commands.

* **Preview**:
  * For any selected destination document, this command generates a read-only **virtual document** showing the fully composed Markdown.
  * This allows the user to review the final output without creating physical files. This command can be used at any time and does not end the session.
* **Publish**:
  * This command serializes the structural models of **all** destination documents into new physical Markdown files in the workspace.
  * **Glossary Scoping**: Before serializing each document, the extension will perform a final pass. It will scan the document's content for the presence of canonical terms. Only the definitions for terms found within that specific document will be appended to its glossary section.
  * Before proceeding, the extension must display a confirmation dialog warning the user that publishing will create files and **end the current weaving session**.

## **4\. Glossary of Terms**

* **Abstract Syntax Tree (AST)**: A tree representation of the syntactic structure of Markdown, generated by **remark**.
* **Embedding**: A vector representation of text generated by **fastembed-js** with the **BAAI/bge-small-en-v1.5** model.
* **Keyphrase Extraction**: The automated process of identifying important terms, performed by the **RAST** algorithm.
* **Vectra**: The on-disk vector database used for storing and querying embeddings.
* **Virtual Document**: A document that exists only in memory within VS Code, used for the "Preview" feature and "Comparison Editor".
* **Webview**: A VS Code component that renders a custom web page, used for the **Glossary Editor**.
* **TreeView**: A VS Code UI component used to display hierarchical data in the sidebar.