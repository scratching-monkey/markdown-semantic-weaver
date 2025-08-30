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

## Usage Guide

### Getting Started

1. **Install the Extension**: Install Markdown Semantic Weaver from the VS Code Marketplace.

2. **First Time Setup**: On first use, the extension will automatically download the required language model for semantic analysis. This requires an internet connection but only happens once.

3. **Open Your Project**: Open a folder containing your Markdown source files in VS Code.

### Basic Workflow

1. **Start a Session**: Right-click on Markdown files in the Explorer and select "Add as Source" to begin analysis.

2. **Create Destination**: Click "Add New Destination Document" in the Markdown Semantic Weaver sidebar to create your output document.

3. **Weave Content**:
   - Browse sections in the "Sections" view
   - Click the "+" icon next to any section to insert it into your destination document
   - Use the "Comparison Editor" for similar sections to resolve conflicts

4. **Edit Content**: Click the edit icon next to any content block in the "Outline" view to modify it directly.

5. **Manage Terms**: Use the "Terms" view to review and consolidate glossary definitions.

6. **Preview & Publish**:
   - Click "Preview" on any destination document to see the final result
   - Click "Publish Documents" to save all documents as physical files

### Advanced Features

- **Comparison Editor**: For sections with high similarity, use the comparison editor to merge content intelligently
- **Glossary Editor**: Webview-based editor for managing term definitions and resolving conflicts
- **Block Editor**: Focused editing experience for individual content blocks

## Requirements

This extension is designed to be self-contained and works offline. The only requirements are:

- A recent version of Visual Studio Code (1.80 or newer is recommended).
- An internet connection is required on first use to download the necessary language model for semantic analysis. After this one-time download, the extension can be used completely offline.

## Extension Settings

This extension contributes the following settings:

- `markdown-semantic-weaver.logging.level`: Controls the verbosity of the extension's log output. Options: "error", "warn", "info", "trace". (Default: `"error"`)
- `markdown-semantic-weaver.performance.maxSourceCorpusSizeMB`: The maximum total size (in MB) of source files to process before displaying a performance warning to the user. (Default: `100`)
- `markdown-semantic-weaver.preview.autoSave`: Automatically save changes when editing content blocks. (Default: `true`)
- `markdown-semantic-weaver.publish.confirmation`: Show confirmation dialog before publishing documents. (Default: `true`)

## Privacy Statement

### Data Collection and Usage

Markdown Semantic Weaver respects your privacy and follows VS Code's telemetry guidelines. Here's what you need to know:

#### Anonymous Usage Analytics (Optional)

The extension may collect anonymous usage statistics to help improve the product. This data includes:

- **Command Usage**: Which commands are executed and how often
- **Session Events**: When sessions start and end
- **Document Operations**: Preview and publish actions with success/failure counts
- **Error Reports**: Non-sensitive error information to help fix bugs

**All data is completely anonymous** - no personal information, file contents, or document names are ever collected.

#### What We Don't Collect

- Your actual document content or file names
- Personal information or identifiers
- Network requests or browsing history
- Any data that could identify you or your projects

#### Control Your Privacy

- **Disable Telemetry**: Set VS Code's global telemetry setting to "off" to disable all telemetry
- **Extension-Specific**: The extension respects VS Code's telemetry configuration
- **No External Services**: All processing happens locally on your machine

#### Local Processing Only

- All semantic analysis and document processing happens on your local machine
- No documents or content are ever sent to external servers
- The language model download is the only internet requirement, and it's cached locally

If you have any privacy concerns, you can disable telemetry entirely or contact us for more information.

## Status

**Phase 4: Advanced Weaving & Interactive Editing** is now **substantially complete**. The extension has evolved beyond the initial Phase 3 scope to include sophisticated interactive editors and advanced content weaving capabilities.

### ✅ **Complete Implementation (Phases 1-4):**

#### **Core Infrastructure (Phase 1)**
- ✅ Service-oriented architecture with dependency injection
- ✅ Event-driven communication patterns
- ✅ Comprehensive testing framework (Jest + test utilities)
- ✅ Workspace Trust and security implementation
- ✅ Logging and error handling systems

#### **Source Processing Pipeline (Phase 2)**
- ✅ Full semantic analysis pipeline (parsing → segmentation → embedding → indexing)
- ✅ Vector embeddings using fastembed-js with BAAI/bge-small-en-v1.5
- ✅ Vectra database integration for persistent storage
- ✅ Similarity detection and grouping algorithms
- ✅ Keyphrase extraction with RAST algorithm

#### **Authoring Environment (Phase 3)**
- ✅ **TreeView UI Components**: All four sidebar views fully implemented:
  - `DestinationDocumentsProvider` - Manage destination documents
  - `DestinationDocumentOutlinerProvider` - Hierarchical document structure
  - `SectionsProvider` - Source sections and similarity groups
  - `TermsProvider` - Glossary terms and definitions

- ✅ **Command Handlers**: Complete lifecycle management (17 handlers):
  - `AddSourceHandler` - Add markdown files as sources
  - `AddDestinationHandler` - Load existing files as destinations
  - `AddNewDestinationDocumentHandler` - Create new destination documents
  - `AddContentBlockHandler` - Add content blocks to documents
  - `InsertSectionHandler` - Insert source sections into destinations
  - `MoveContentBlockHandler` - Reorder content blocks
  - `DeleteContentBlockHandler` - Remove content blocks
  - `DeleteDestinationDocumentHandler` - Remove destination documents

#### **Advanced Interactive Editors (Phase 4)**
- ✅ **Comparison Editor**: Sophisticated diff-like interface for resolving similar sections
  - `ComparisonVirtualProvider` - Read-only virtual document display
  - `ComparisonCodeLensProvider` - Interactive CodeLenses for actions
  - `ComparisonCodeActionProvider` - "Merge with AI" functionality
  - `OpenComparisonEditorHandler` - Editor orchestration

- ✅ **Glossary Editor**: Webview-based editor for term consolidation
  - `GlossaryWebviewManager` - Webview lifecycle management
  - `OpenGlossaryEditorHandler` - Editor integration
  - Custom HTML/CSS/JS frontend for term management

- ✅ **Block Editor**: Focused content editing experience
  - `BlockEditorService` - Temporary document management
  - `EditContentBlockHandler` - Seamless content editing workflow

### ✅ **Complete (Phase 5): Productionization, Publishing & User Onboarding**

#### **Document Generation & Publishing**
- ✅ **Preview Command** - Generate read-only virtual documents
- ✅ **Publish Command** - Serialize documents with glossary scoping
- ✅ **DocumentSerializationService** - AST-to-Markdown conversion with contextual glossary
- ✅ **Glossary Scoping** - Two-pass algorithm for contextual term filtering

#### **Production Features**
- ✅ **User Settings** - Configurable logging, performance, and behavior options
- ✅ **Telemetry Service** - Anonymous usage analytics respecting user privacy
- ✅ **User Onboarding** - Interactive walkthrough for new users
- ✅ **Package Generation** - Ready for .vsix packaging and marketplace publishing

### 🎯 **Key Features Delivered:**

- **Session-Based Authoring**: Temporary, focused sessions for document composition
- **Semantic Analysis**: Automatic processing of source files with similarity detection
- **Interactive Authoring**: Drag-and-drop content insertion with real-time preview
- **Advanced Content Weaving**: Comparison editor for merging similar sections
- **Glossary Management**: Webview-based editor for term consolidation
- **Robust Error Handling**: Consistent user feedback and error management
- **Event-Driven Architecture**: Reactive UI updates based on state changes
- **Comprehensive Testing**: Integration tests covering core workflows

### 📊 **Implementation Statistics:**
- **17 Command Handlers** implemented and tested
- **4 UI Providers** with full TreeView integration
- **5 Advanced Editor Components** for specialized workflows
- **8 Integration Tests** covering command execution and UI reactivity
- **20+ Services** following SOLID principles with dependency injection

The extension provides a sophisticated, nearly production-ready authoring environment for semantic document weaving. Phase 5 completion (Preview/Publish functionality) will deliver the final end-to-end user workflow.

## Known Issues
