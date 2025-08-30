# Test Coverage Analysis and Strategy

This document provides an analysis of the current test coverage for the Markdown Semantic Weaver extension and outlines a strategy for improving it.

## Current Test Coverage

The project currently has a mix of End-to-End (E2E), integration, and unit tests.

- **E2E Tests (`src/test/e2e`):** A "golden path" test exists, which validates the core backend data processing pipeline from adding source files to detecting similarities. This is a strong, backend-focused E2E test.
- **Integration Tests (`src/test/integration`):** Coverage is focused on core commands related to source and destination document management.
- **Unit Tests (`src/test/unit`):** Coverage is sparse, focusing on a few key services like `ContentSegmenter` and `TermExtractor`.

## Identified Gaps and Missing Tests

The following is a prioritized list of missing tests, categorized by type.

### 🟨 Integration Test Gaps (Medium Priority)

These tests are crucial for ensuring the reliability of user-facing commands.

- **`OpenComparisonEditorHandler.ts`:**
  - **Missing Test:** An integration test to verify that executing the `markdown-semantic-weaver.openComparisonEditor` command opens a diff view with the correct content for the two most similar blocks in a group.
- **`OpenGlossaryEditorHandler.ts`:**
  - **Missing Test:** An integration test to ensure the `markdown-semantic-weaver.openGlossaryEditor` command successfully opens a webview with the correct glossary content.
- **`MergeWithAIHandler.ts`:**
  - **Missing Test:** An integration test to validate the `markdown-semantic-weaver.mergeWithAI` command. This test should mock the AI service response and verify that the content is correctly merged into the destination document.
- **`EditContentBlockHandler.ts`:**
  - **Missing Test:** An integration test for the `markdown-semantic-weaver.editContentBlock` command to ensure it correctly updates the content of a specific block.
- **`RefreshComparisonHandler.ts`:**
  - **Missing Test:** An integration test for the `markdown-semantic-weaver.refreshComparison` command.

### 🟦 Unit Test Gaps (Low Priority)

These tests will improve the robustness and maintainability of individual components.

- **`AstService.ts`:**
  - **Missing Test:** Unit tests for `findNodeById`, `addNode`, `removeNode`, and `moveNode` methods to ensure they correctly and immutably manipulate the AST.
- **`SessionManager.ts`:**
  - **Missing Test:** Unit tests for the state machine logic, verifying correct transitions between states (`Inactive`, `Active`, etc.) and ensuring events are emitted properly.
- **`DocumentSerializationService.ts`:**
  - **Missing Test:** Unit tests for the serialization logic, checking if a `DestinationDocumentModel` is correctly converted into a final Markdown string.
- **`SectionResolutionService.ts`:**
  - **Missing Test:** Unit tests to verify the logic for marking sections and similarity groups as "resolved".
- **UI Providers (`src/services/ui/tree-data-providers`):**
  - **Missing Tests:** Individual unit tests for `SectionsViewProvider`, `TermsViewProvider`, and `SimilarityGroupsProvider` to verify they return the correct `TreeItem`s based on data from the `DataAccessService`.

### 🟩 Future Tests (Phase 5)

These tests should be implemented as part of the final productionization phase.

- **`PreviewDocumentHandler.ts`:**
  - **Missing Test:** An integration test to verify that the `markdown-semantic-weaver.previewDocument` command opens a new tab with the correctly rendered HTML preview.
- **`PublishDocumentsHandler.ts`:**
  - **Missing Test:** An integration test for the `markdown-semantic-weaver.publishDocuments` command to ensure it correctly generates the final output files.

## Recommended Strategy

1.  **Prioritize Integration Tests:** Focus on filling the gaps in the integration tests for the existing command handlers first. This will provide the most value by ensuring the primary user workflows are reliable.
2.  **Add Unit Tests for Core Logic:** Incrementally add unit tests for the critical services like `AstService` and `SessionManager`. This will make future refactoring safer and easier.
3.  **Implement Phase 5 Tests:** Write the tests for "Preview" and "Publish" functionality as those features are being developed.
