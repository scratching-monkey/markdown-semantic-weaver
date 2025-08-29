# Markdown Semantic Weaver VSCode extension

A Visual Studio Code extension to weave data from multiple markdown sources

## Features

Markdown Semantic Weaver helps you author new documents from existing Markdown files by analyzing semantic similarities and providing a structured editing environment.

- **Session-Based Authoring:** Work in a temporary, focused session. Add source files for analysis and destination files for authoring.

- **Semantic Analysis:** Automatically processes source files to:

  - Divide content into logical sections.
  - Identify and extract key terms and definitions.
  - Find semantically similar sections and terms across all your source files.

- **The Weaving View:** A dedicated sidebar view to manage your authoring session:

  - **Sections View:** See a list of all unique sections from your sources, plus groups of sections that are semantically similar. Insert them directly into your new document or resolve similarities in a specialized editor.
  - **Terms View:** Manage a glossary of key terms extracted from your sources. Refine definitions and resolve similar terms.
  - **Destination Outliner:** View and manage the structure of your new document as a hierarchical outline of content blocks. Add, edit, delete, and reorder blocks with ease.

- **Advanced Editors:**

  - **Comparison Editor:** A powerful diff-like view to compare and merge semantically similar sections, helping you synthesize information from multiple sources.
  - **Glossary Editor:** A webview-based editor to manage and consolidate definitions for similar terms.

- **Publish with Confidence:**
  - **Live Preview:** Generate a read-only preview of your composed document at any time.
  - **Publish:** Finalize your work by saving your new, structured documents as standard Markdown files, complete with a relevant glossary appended to each.

## Requirements

This extension is designed to be self-contained and works offline. The only requirements are:

- A recent version of Visual Studio Code (1.80 or newer is recommended).
- An internet connection is required on first use to download the necessary language model for semantic analysis. After this one-time download, the extension can be used completely offline.

## Extension Settings

This extension contributes the following settings:

- `markdown-semantic-weaver.logging.level`: Controls the verbosity of the extension's log output. Options: "error", "warn", "info", "trace". (Default: `"error"`)
- `markdown-semantic-weaver.performance.maxSourceCorpusSizeMB`: The maximum total size (in MB) of source files to process before displaying a performance warning to the user. (Default: `100`)

## Status

**Phase 3: Destination Document Authoring & Core Workflow** is now **fully complete and production-ready**. This phase has delivered a comprehensive authoring environment with:

### ✅ **Complete Implementation:**

- **TreeView UI Components**: All four sidebar views fully implemented:

  - `DestinationDocumentsProvider` - Manage destination documents
  - `DestinationDocumentOutlinerProvider` - Hierarchical document structure
  - `SectionsProvider` - Source sections and similarity groups
  - `TermsProvider` - Glossary terms and definitions

- **Command Handlers**: Complete lifecycle management:

  - `AddSourceHandler` - Add markdown files as sources
  - `AddDestinationHandler` - Load existing files as destinations
  - `AddNewDestinationDocumentHandler` - Create new destination documents
  - `AddContentBlockHandler` - Add content blocks to documents
  - `InsertSectionHandler` - Insert source sections into destinations
  - `MoveContentBlockHandler` - Reorder content blocks
  - `DeleteContentBlockHandler` - Remove content blocks
  - `DeleteDestinationDocumentHandler` - Remove destination documents

- **Integration Tests**: Comprehensive test suite with 8 passing tests covering:
  - Command execution and validation
  - UI reactivity and state management
  - Content manipulation workflows
  - Error handling scenarios

### 🎯 **Key Features:**

- **Session-Based Authoring**: Temporary, focused sessions for document composition
- **Semantic Analysis**: Automatic processing of source files with similarity detection
- **Interactive Authoring**: Drag-and-drop content insertion with real-time preview
- **Robust Error Handling**: Consistent user feedback and error management
- **Event-Driven Architecture**: Reactive UI updates based on state changes

The extension provides a stable, feature-complete authoring environment for semantic document weaving. All core functionality is implemented, tested, and ready for production use.

## Known Issues
