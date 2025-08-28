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

As of August 2025, [**Phase 2: Source Data Ingestion & Analysis Pipeline**](docs/03_phased_implementation_plan.md) is complete. All core data processing features—including file parsing, content segmentation, term extraction, vector embedding, and similarity analysis—are implemented and validated with integration tests.

The project is now beginning **Phase 3: Destination Document Authoring & Core Workflow**. This phase will focus on building the user-facing UI components, including the tree views for managing sections and terms, and enabling the core authoring commands to manipulate destination documents.

## Known Issues
