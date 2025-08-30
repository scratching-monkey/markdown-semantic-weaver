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
  - **AI-Powered Content Merging:** (Optional) Intelligent content merging using GitHub Copilot or compatible language models for enhanced document composition.

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
- `markdown-semantic-weaver.ai.enabled`: Enable AI-powered features like intelligent content merging. Requires GitHub Copilot or compatible language models. (Default: `false`)

## AI Features (Optional)

Markdown Semantic Weaver includes optional AI-powered features that can enhance your document composition workflow. These features are **disabled by default** and require explicit opt-in.

### Enabling AI Features

1. **Install GitHub Copilot**: Ensure you have GitHub Copilot installed and configured in VS Code
2. **Enable AI Features**: Set `markdown-semantic-weaver.ai.enabled` to `true` in your VS Code settings
3. **Restart VS Code**: The AI features will become available after restarting

### Available AI Features

- **AI-Powered Content Merging**: When comparing similar sections, you can use AI to intelligently merge content from multiple sources
- **Enhanced Comparison Editor**: AI-assisted suggestions for resolving conflicts between similar sections

### Privacy and AI

- **Local Processing**: All AI processing happens locally through VS Code's language model APIs
- **No Data Transmission**: Your document content never leaves your machine
- **GitHub Copilot Integration**: Uses the same privacy protections as GitHub Copilot
- **Opt-in Only**: AI features are completely disabled unless you explicitly enable them

### Requirements for AI Features

- GitHub Copilot or a compatible language model provider
- VS Code 1.80 or newer
- `markdown-semantic-weaver.ai.enabled` setting set to `true`

If you don't have GitHub Copilot or prefer not to use AI features, the extension works perfectly without them - all core functionality remains available.

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


## Known Issues
