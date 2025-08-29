# Test Fixture Documentation

This document outlines the structure and purpose of the test fixtures created in the `src/test/fixtures/` directory. These fixtures are designed to provide example data for testing the Markdown Semantic Weaver extension.

## Rationale

This directory contains a set of markdown files designed to serve as stable and representative test data for the Markdown Semantic Weaver extension. The fixtures use "hockey" as a domain because the author likes hockey.

Using a dedicated and stable set of test fixtures provides several advantages:

- **Test Stability:** Tests run against a known, unchanging data set, preventing breakages due to external content changes.
- **Comprehensive Coverage:** The fixtures are intentionally designed to include a variety of markdown structures (headings, lists, tables, code blocks, YAML frontmatter) to ensure robust testing of the extension's parsing and semantic analysis capabilities.
- **Clarity:** It is clear what data is being used for tests, making them easier to understand and maintain.

## Fixture Files

The `hockey-knowledge-base` directory contains the following files, designed to mimic various documentation structures:

1.  **`hockey-ontology.md`**

    - **Description:** This file defines the core entities and relationships within the hockey domain, serving as a foundational ontology document.
    - **Structure:**
      - YAML Frontmatter (`title`, `author`, etc.).
      - Multiple levels of headings (`#`, `##`, `###`).
      - Lists (unordered and nested).
      - Bolded terms to represent key concepts.
    - **Testing Use Cases:**
      - Parsing and validating YAML frontmatter.
      - Extracting content blocks based on heading hierarchy.
      - Identifying and extracting glossary terms (bolded text).
      - Testing the creation of a semantic network from a foundational document.

2.  **`offensive-strategy-framework.md`**

    - **Description:** This file describes a process for applying strategic concepts from the ontology to practical situations. It models a document with a mix of narrative, data, and metadata.
    - **Structure:**
      - YAML Frontmatter, including complex nested objects (`dram_profile`).
      - A mix of narrative text, headings, and lists.
      - A Markdown table used to map situations to recommendations.
      - Code blocks (for the YAML template).
      - Inline code (` `` `) for specific terms.
    - **Testing Use Cases:**
      - Parsing complex YAML frontmatter.
      - Handling mixed content types (prose, tables, lists, code).
      - Testing the extraction of relationships between different documents.
      - Validating the correct parsing of Markdown tables.

3.  **`official-rink-and-equipment-spec.md`**
    - **Description:** This file models a technical specification document.
    - **Structure:**
      - YAML Frontmatter with metadata like a version and spec ID.
      - A Markdown table to define specifications.
      - A code block to define a directory structure.
    - **Testing Use Cases:**
      - Parsing definition tables.
      - Handling technical specifications within code blocks.
      - Extracting content from documents with a more rigid, technical structure.

## How to Use in Tests

These new fixtures can be used to enhance and replace existing tests.

### Enhancing Unit Tests

For services like `SourceProcessingService`, these files provide a richer source for testing:

- When testing `extractContentBlocks`, `offensive-strategy-framework.md` can be used to verify that the table is treated as a single, coherent block.
- When testing `extractGlossaryTerms`, `hockey-ontology.md` can be used to ensure that nested list items are correctly identified as terms.

### Enhancing Integration Tests

In integration tests that simulate user actions, these files can be used to build a more realistic test workspace.

- **Golden Path Tests (`golden-path.test.ts`):**
  1.  Start a new session.
  2.  Add `hockey-ontology.md` as a source file.
  3.  Verify that the `Glossary` view is populated with terms like "Forwards," "Goaltender," and "Offside."
  4.  Add `offensive-strategy-framework.md` as a second source file.
  5.  Create a new destination document.
  6.  Use the "Weave" command and verify that content blocks from both source files, which discuss related concepts (e.g., "Formations" and "Plays"), are suggested as similar.

### Future Test Scenarios

- **Cross-File Linking:** Create a third fixture that explicitly references concepts from the first two, allowing for tests that check the extension's ability to resolve links and build a connected graph of knowledge.
- **Complex Directory Structures:** Place fixtures in nested directories to test the recursive file discovery and processing logic.

By migrating tests to use these fixtures, we can ensure that the test suite is robust, maintainable, and decoupled from any specific, proprietary content, while still exercising all the critical functionality of the extension.
