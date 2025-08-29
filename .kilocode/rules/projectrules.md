# Markdown Semantic Weaver

This document provides guidance for AI agents working on the Markdown Semantic Weaver VS Code extension. Understanding these concepts is crucial for making effective contributions.

## Architecture Overview

The extension follows a service-oriented architecture with a strict unidirectional data flow.

**Core Components:**

- **`CommandRegistry` (`src/services/CommandRegistry.ts`):** Discovers and registers all command handlers. It is responsible for invoking the correct handler for a given command.
- **`ICommandHandler` (`src/command-handlers/ICommandHandler.ts`):** An interface that all command handler classes must implement.
- **Command Handlers (`src/command-handlers/*Handler.ts`):** Individual classes, each responsible for the logic of a single command. They are discovered by the `CommandRegistry`.
- **`SessionManager` (`src/services/SessionManager.ts`):** The single source of truth for the application's state (e.g., `Active`, `Inactive`). It manages the session lifecycle and holds the state of source and destination documents.
- **`SourceProcessingService` (`src/services/SourceProcessingService.ts`):** A multi-stage pipeline that ingests markdown files, parses them, extracts content (`ContentBlock`) and keywords (`GlossaryTerm`), generates vector embeddings using `fastembed-js`, and stores them in a local `Vectra` vector database.
- **`DataAccessService` (`src/services/DataAccessService.ts`):** The sole component responsible for querying the vector store and in-memory data. It abstracts the data sources from the UI and other services.
- **`VectorStoreService` (`src/services/VectorStoreService.ts`):** A low-level wrapper around the `Vectra` library, managing the on-disk index.

**Folder Structure:**

- **`src/models`**: Contains the data models for the application (e.g., `DestinationDocument`, `ContentBlock`).
- **`src/services`**: Contains the core business logic of the application, with each service having a specific responsibility.
- **`src/views`**: Contains the UI components, primarily the `TreeDataProvider` implementations for the VS Code sidebar views.
- **`src/test`**: Contains the unit and integration tests for the extension.

**Data Flow:**

1.  A user action triggers a command.
2.  The `CommandRegistry` receives the command and invokes the appropriate `ICommandHandler`.
3.  The handler calls the relevant services (e.g., `SourceProcessingService` to add a file).
4.  Services process the data and interact with the `DataAccessService`.
5.  State changes are orchestrated through the `SessionManager`.
6.  The `SessionManager` emits events (e.g., `onSourceFileDidChange`) to which UI components will eventually subscribe to refresh.

## State Management: Read-Compute-Commit

This is a critical pattern in the codebase. To ensure predictable state transitions, services do not modify the application state directly.

1.  **Read:** A service reads the current state from the `SessionManager`.
2.  **Compute:** It performs its logic and computes a _new_ state.
3.  **Commit:** It passes the new state back to the `SessionManager` (e.g., via `updateDestinationDocumentAst`), which is the only component authorized to perform the final state mutation and emit change events.

## Development Workflow

All essential scripts are defined in `package.json`.

- **Compile:** `npm run compile` (builds the extension using webpack).
- **Watch:** `npm run watch` (builds and watches for changes).
- **Run Tests:** `npm test` (compiles code and tests, then runs unit and integration tests).
- **Lint:** `npm run lint` (runs ESLint on the `src` directory).

### One task at a time

- We are following the `docs/03_phased_implementation_plan.md`.
- Make it clear when the task has been completed or when there is still additional work to do.
- After completing every task, we compile, run tests, debug F5, and then commit before we move on to the next task.

## Code Conventions

- **ESM Imports:** This project uses ES Modules. All relative imports **must** include the `.js` extension.

  ```typescript
  // Correct
  import { SessionManager } from "./SessionManager.js";

  // Incorrect
  import { SessionManager } from "./SessionManager";
  ```

- **Data Models as Interfaces:** Data models in `src/models` **must** be defined as `interface`s, not `class`es. This is because these models represent plain data objects that are often deserialized from sources like the vector store's metadata or created through object literals. These objects do not have the methods or prototype chain of a class instance. Using interfaces ensures type safety for these plain objects without incorrectly assuming they are class instances.

- **`tsconfig.json` is Sacred:** The project **must** be configured to output CommonJS modules (`"module": "NodeNext"` without `"type": "module"` in `package.json`). Previous attempts to use ES Modules caused the VS Code extension test host to hang indefinitely. Do not change `tsconfig.json` to re-enable ES Modules.

- **Singleton Services:** Most services are singletons, managed by the `tsyringe` dependency injection container.
- **Dependency Injection:** Services are instantiated by the `tsyringe` container. Dependencies are injected through the constructor. The entry point for the application, `extension.ts`, acts as the composition root, where services are registered. Command handlers are registered in `src/command-handlers/index.ts`.
- **VS Code API Usage:** Only services that directly interact with the VS Code UI or workspace should import the `vscode` module. Keep business logic decoupled from the VS Code API where possible.
- **Testing:** Unit tests are located in `src/test/unit` and should test logic in isolation. Integration tests are in `src/test/integration` and test the interaction between components. The test environment is initialized once in `src/test/test-utils.ts` to ensure a consistent and isolated test run. To keep files focused, integration tests are organized by the specific command or UI provider they target (e.g., `destinationDocument.commands.test.ts`, `destinationDocumentsProvider.ui-reactivity.test.ts`).
