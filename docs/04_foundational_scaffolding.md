# **Foundational Scaffolding for the Markdown Semantic Weaver**

## **Executive Summary**

To ensure a successful, maintainable, and high-quality product, several foundational scaffolding elements and strategic decisions must be addressed before development commences.

The analysis identifies four key foundational areas:

1. **Development Environment and Project Configuration:** The lack of a standardized development environment and definitions for essential manifest contributions poses a significant risk to developer productivity and project stability.
2. **Quality Assurance and Testing:** The designs are silent on the strategy for verifying the correctness of the complex, multi-component system, leaving the project vulnerable to regressions and difficult-to-diagnose bugs.
3. **Observability, Maintenance, and User Experience:** Non-functional requirements such as logging, telemetry, activation performance, and user onboarding have not been specified, yet are critical for long-term success and user adoption.
4. **Security and Asset Management:** The handling of security-sensitive operations and large, external assets like machine learning models is undefined.

This report provides detailed, actionable recommendations to address these key areas. It specifies the complete structure for a development container, outlines a multi-layered testing strategy, and proposes solutions for logging, telemetry, security, and user onboarding. By addressing these foundational elements, the development team can mitigate risks, accelerate development, and build a more robust, secure, and professional-grade extension.

## **Section 1: Foundational Development and Environment Scaffolding**

The bedrock of any successful software project is a consistent, reproducible development environment and a well-defined project manifest. The current designs, while thorough on runtime logic, omit these critical prerequisites. Addressing them is the highest priority to prevent systemic issues that can impede development velocity and introduce instability.

### **1.1 Defining the Development Container (devcontainer.json)**

The specified technology stack, which includes Node.js, a local vector database (Vectra), and machine learning model libraries (fastembed-js), is inherently complex.1 These components often rely on native dependencies and can be sensitive to the underlying operating system or specific versions of system libraries. This complexity creates a high risk of "works on my machine" problems, where code that functions for one developer fails for another or in the continuous integration (CI) environment. Such inconsistencies are a major source of lost productivity and build failures.
To eliminate this risk, the project must adopt a standardized, containerized development environment. The VS Code Dev Containers extension provides the ideal solution, allowing the entire development environment to be defined declaratively in a devcontainer.json file.3 This file instructs VS Code to use a Docker container as a full-featured development environment, ensuring that every developer, as well as the CI server, operates with an identical toolchain and runtime stack.3 This approach is not a "nice-to-have" but a foundational requirement to guarantee project stability and developer efficiency.
The following specification details the required devcontainer.json file, providing an immediately actionable blueprint for the development team.
**Table 1: devcontainer.json Specification**

| Property | Value | Rationale |
| :---- | :---- | :---- |
| name | "Markdown Semantic Weaver Dev Container" | Provides a human-readable name for the container environment. |
| image | "mcr.microsoft.com/devcontainers/typescript-node:18" | Specifies a pre-configured base image from Microsoft that includes Node.js, TypeScript, and common development tools, providing a solid foundation.3 |
| features | { "ghcr.io/devcontainers/features/git:1": {} } | Uses a "Dev Container Feature" to install and configure Git inside the container, ensuring version control tools are available.5 |
| customizations.vscode.extensions | \["dbaeumer.vscode-eslint", "esbenp.prettier-vscode", "Orta.vscode-jest"\] | Automatically installs essential VS Code extensions for all developers, enforcing code quality and providing a consistent testing interface directly within the editor.3 |
| postCreateCommand | "npm install" | A command that runs after the container is created, automatically installing all project dependencies from package.json.3 |
| forwardPorts | \`\` | A placeholder for any ports that may need to be forwarded from the container for debugging or future web-based components. |
| remoteUser | "node" | Specifies the user to run as inside the container, avoiding potential permission issues by not running as root. |

### **1.2 Configuration Management Strategy (contributes.configuration)**

The design documents make no mention of user-configurable settings. However, several aspects of the extension's behavior are prime candidates for user-level customization to enhance usability and robustness. For example, the SourceProcessingModule design correctly identifies a significant performance risk: the entire Vectra vector index is loaded into memory, which could crash the extension host when processing a very large corpus of source files.2 Hardcoding a file size limit to mitigate this is brittle and may not suit all users. Similarly, any future integration with AI services will likely require user-provided API keys or service endpoints.1
Failing to provide configuration points for such parameters makes the extension less adaptable and more prone to failure in edge-case scenarios. VS Code provides a standard mechanism for extensions to expose settings to the user via the contributes.configuration property in package.json.7 These settings are then easily managed by the user through the graphical Settings editor or directly in their
settings.json file.9 Defining a configuration schema is therefore a foundational task that enables flexibility and resilience.
**Table 2: Proposed contributes.configuration Schema**

| Setting ID | Type | Default | Description |
| :---- | :---- | :---- | :---- |
| markdown-semantic-weaver.logging.level | string (enum) | "error" | Controls the verbosity of the extension's log output. Options: "error", "warn", "info", "trace". |
| markdown-semantic-weaver.performance.maxSourceCorpusSizeMB | number | 100 | The maximum total size (in MB) of source files to process before displaying a performance warning to the user. Mitigates the Vectra in-memory database limitation.2 |
| markdown-semantic-weaver.ai.serviceEndpoint | string | "" | (Future-proofing) The endpoint for an external AI service used for features like content merging. |
| markdown-semantic-weaver.ai.apiKey | string | "" | (Future-proofing) The user's API key for the AI service. This should be stored securely. |

### **1.3 Security Posture and Workspace Trust**

The extension's core function involves reading user-selected files from the workspace and writing new "published" files back to it.1 These file system interactions are security-sensitive. VS Code's Workspace Trust feature is designed to protect users from unintended code execution when working with unfamiliar or potentially malicious projects.11 Extensions are required to declare their level of support for running in an untrusted "Restricted Mode" workspace via the
capabilities.untrustedWorkspaces property in package.json.12
If an extension does not declare its support, it is treated as untrusted by default and will be disabled entirely when a user opens a folder in Restricted Mode.12 This creates a poor user experience, as the extension appears broken or unmaintained. Proactively defining a Workspace Trust policy is essential for user security and for the extension to be perceived as professional and trustworthy.
Given that the extension's core functionality depends on reading workspace files, a 'limited' support level is the most appropriate choice. This allows the extension's UI to remain visible in Restricted Mode, while the commands that perform file processing can be programmatically disabled until the user grants trust to the workspace.
A capabilities.untrustedWorkspaces property must be added to package.json with the value { "supported": "limited" }. It must also include a clear description property explaining to the user that file analysis and document generation features are disabled until the workspace is trusted. The extension's command handlers must then use the vscode.workspace.isTrusted API property to conditionally enable or disable their functionality, ensuring that no file system operations are performed without explicit user consent.12

### **1.4 Asset Management for Embedded ML Models**

The SourceProcessingModule design specifies the use of fastembed-js with the BAAI/bge-small-en-v1.5 model for generating vector embeddings.1 These model files are large binary assets, potentially hundreds of megabytes in size. The design documents do not specify how these assets will be packaged and delivered to the end-user.
The standard tool for packaging extensions, vsce, bundles all necessary files into a single .vsix archive for distribution on the Marketplace.13 Including a large ML model directly in this package would result in a bloated extension (\>100MB). This leads to slow downloads, long installation times, and violates user expectations for a lightweight editor extension.
A superior architectural approach is to adopt a post-install download strategy. The extension package (.vsix) should contain only the core application code, keeping it small and fast to install. Upon its first activation, the extension should check for the presence of the model files in a dedicated, extension-specific storage location provided by the VS Code API (ExtensionContext.globalStorageUri).14 If the model is not found, the extension will initiate a background download from a trusted source (e.g., Hugging Face or a dedicated CDN). This download process must be accompanied by clear user feedback, using the
vscode.window.withProgress API to display a non-intrusive progress indicator.2 This "lazy loading" of large assets is a common best practice that significantly improves the user's installation and first-run experience. Therefore, the ML model files must be explicitly excluded from the final package via the
.vscodeignore file.

## **Section 2: A Comprehensive Testing Strategy**

The provided design documents, while architecturally sound from a runtime perspective, are completely silent on quality assurance. A complex, stateful, multi-component system such as this requires a multi-layered testing strategy to ensure correctness, prevent regressions, and enable developers to refactor with confidence. Without a formal test plan, the project's quality will be difficult to measure or maintain.

### **2.1 Framework and Tooling Selection**

The first step is to select an appropriate testing framework and toolchain. The VS Code ecosystem has a well-established standard for extension testing. The official documentation and tooling heavily favor **Mocha** as the test runner for integration tests that require access to the VS Code API.15 The
@vscode/test-cli and @vscode/test-electron packages, maintained by the VS Code team, provide the necessary infrastructure to programmatically download, launch, and run tests within a special instance of VS Code.15
Adopting this standard stack provides the path of least resistance and ensures compatibility with future VS Code updates. For more advanced end-to-end (E2E) testing that simulates direct user UI interactions (e.g., clicking on buttons in a view), this core stack can be supplemented with specialized frameworks like vscode-extension-tester (which builds on Mocha and Selenium WebDriver) or WebdriverIO.17
The project will adopt a testing strategy based on the Mocha framework, organized into three distinct layers as detailed in the following table.
**Table 3: Testing Strategy and Toolchain**

| Layer | Test Type | Target Components | Tools | Goal |
| :---- | :---- | :---- | :---- | :---- |
| 1 | **Unit Tests** | DataAccessService, SessionManager, SourceProcessingModule algorithms, DocumentGeneration serializers | Mocha, assert, sinon (for mocks/stubs) | Verify the correctness of pure business logic and algorithms in complete isolation from the VS Code API, running in a standard Node.js environment. |
| 2 | **Integration Tests** | CommandHandlerService, UI TreeDataProvider implementations, Custom Editor providers | Mocha, @vscode/test-electron, VS Code API | Verify the correct interaction of components with the live VS Code API within a real, programmatically controlled extension host instance. |
| 3 | **End-to-End (E2E) Tests** | Full user workflows (e.g., "Add Source" \-\> "Resolve Similarity" \-\> "Publish") | vscode-extension-tester or WebdriverIO | Verify that all components of the system function together correctly to fulfill critical user stories from a user's perspective. |

### **2.2 The Test Plan**

This plan outlines the specific test suites and cases required for each layer of the testing strategy, ensuring comprehensive coverage of the extension's functionality.

#### **2.2.1 Unit Testing Plan**

The core business logic of the extension resides in components that can be tested without a running instance of VS Code. These tests will be fast, reliable, and form the base of the quality assurance pyramid. A dedicated test/unit directory will contain these tests.

* **SessionManager State Machine:** The SessionManager is explicitly designed as a finite state machine.14 Unit tests must assert that it correctly transitions between its
  Inactive, Initializing, Active, and Terminating states in response to method calls. Tests will also verify that the correct events (e.g., onSessionDidStart, onSessionWillEnd) are emitted upon each valid state transition.
* **DataAccessService AST Manipulation:** The DataAccessService is responsible for complex, in-memory AST manipulations.19 Test cases will provide sample AST objects as input and verify that operations like
  deleteContentBlock and moveContentBlock produce the expected new AST structure. These tests are critical for ensuring the structural integrity of destination documents.
* **SourceProcessingModule Algorithms:** The custom RAST algorithm for keyphrase extraction is a key piece of intellectual property in the extension.2 It must be tested with a variety of sample text inputs to ensure it correctly identifies and ranks keyphrases based on both its linguistic and statistical heuristics.

#### **2.2.2 Integration Testing Plan**

Components that are tightly coupled to the VS Code API, such as command handlers and UI providers, must be tested within a live extension host. These tests, located in a test/integration directory, will be executed using the @vscode/test-electron runner.15

* **Command Handlers:** The CommandHandlerService acts as an orchestrator, translating UI gestures into service calls.21 For each registered command, a test will activate the extension, execute the command via
  vscode.commands.executeCommand, and use stubs (e.g., with the sinon library) to verify that the correct service-layer methods were invoked with the expected arguments. For example, a test for the markdown-semantic-weaver.addSource command will assert that it calls sessionService.startSessionIfNeeded() and sourceProcessingPipeline.processFile(uri).21
* **View Providers:** The reactivity of the UI is a core feature.6 Tests will verify this behavior by programmatically triggering state changes and asserting the UI's response. For example, a test will add a new destination document to a mocked
  SessionManager, then verify that the DestinationDocumentsProvider's onDidChangeTreeData event fires and that a subsequent call to its getChildren() method returns a TreeItem representing the new document.

#### **2.2.3 End-to-End (E2E) Testing Plan**

While unit and integration tests verify individual components, they do not guarantee that the fully assembled application functions correctly from the user's perspective. E2E tests provide this highest level of confidence by automating complete user workflows. However, they are slower and more brittle than lower-level tests and should be reserved for validating the most critical-path user scenarios.
A small suite of high-value E2E tests will be implemented using a framework like vscode-extension-tester.18 The primary test case will cover the extension's "golden path" workflow:

1. Launch the test instance of VS Code with an empty workspace.
2. Programmatically execute the markdown-semantic-weaver.addSource command on a fixture file.
3. Wait for the "Sections View" to populate and assert that it contains the expected items.
4. Execute the markdown-semantic-weaver.addNewDestinationDocument command.
5. Programmatically select a content block in the "Destination Document Outliner".
6. Execute the command to insert a section from the "Sections View".
7. Assert that the "Destination Document Outliner" updates to show the newly inserted content.
8. Execute the markdown-semantic-weaver.publish command and verify that the final output file is created in the workspace with the correct content.

This single test provides a powerful regression suite that validates the correct interaction of nearly every component in the system.

## **Section 3: Observability, Maintenance, and User Experience**

Beyond core functionality and testing, a professional-grade extension must address several non-functional requirements that are critical for its long-term health, maintainability, and user adoption. The current designs omit these considerations, which include diagnostics, usage analytics, performance optimization, and user onboarding.

### **3.1 A Unified Logging and Diagnostics Framework**

The design documents lack any specification for logging. Inevitably, users will encounter bugs or unexpected behavior. Without a logging mechanism, the development team will have no diagnostic information, making it nearly impossible to debug issues reported from the field. This leads to frustrated users and an inefficient support process.
Implementing a proactive logging strategy is a direct investment in maintainability. The standard mechanism for this in VS Code is the OutputChannel API (vscode.window.createOutputChannel), which provides a dedicated, non-intrusive panel for displaying detailed log output.22
A singleton LoggerService must be created to wrap this OutputChannel. This service will expose standard logging methods (log.trace(), log.info(), log.warn(), log.error()). The verbosity of the logger will be controlled by the markdown-semantic-weaver.logging.level setting proposed in Section 1.2. All significant operations within service-layer methods and command handlers, especially within try...catch blocks, must be instrumented with appropriate logging calls. This simple framework will transform vague user bug reports into actionable diagnostic data, dramatically reducing the time-to-resolution for issues.

### **3.2 Telemetry and Usage Analytics**

Once the extension is released, the team will have no insight into how it is being used, which features are most valuable, or what performance bottlenecks users are experiencing in the real world. Making data-driven decisions about the product's future requires usage analytics.
The @vscode/extension-telemetry package provides a standardized, privacy-respecting way for extensions to send anonymous, aggregated usage data to a backend like Azure Application Insights.23 A key feature of this library is that it automatically respects the user's global telemetry settings in VS Code (
telemetry.telemetryLevel), ensuring that no data is collected without user consent.23
This ethical telemetry is essential for answering critical product questions: How many users start a weaving session per week? What is the average number of source files per session? How often is the "Merge with AI" feature used compared to simple insertion? What is the average duration of the source processing pipeline? The answers to these questions are invaluable for identifying friction points in the user experience and prioritizing engineering effort where it will have the most impact.
A TelemetryService will be created to wrap the TelemetryReporter from the @vscode/extension-telemetry package. This service will be used to send events for key user actions, such as sessionStarted, sourceFileAdded, similarityGroupResolved, and documentPublished. To maintain transparency and trust, the extension's README.md file must include a clear privacy statement explaining what anonymous data is collected and for what purpose.

### **3.3 Extension Activation and Performance**

The performance of an extension, particularly its impact on VS Code's startup time, is a major factor in user satisfaction. The Markdown Semantic Weaver workflow is a discrete, user-initiated task. There is no reason for the extension's code to be loaded or executed when a user is performing unrelated activities, such as writing Python code or debugging a C++ application.
VS Code's extension model uses activationEvents in package.json to control precisely when an extension's code is loaded into memory and its activate() function is run.25 Using a generic startup event like
"\*" is strongly discouraged as it contributes to editor bloat and slows down startup for all users, whether they intend to use the extension or not.25
Lazy activation is therefore a mandatory architectural principle for this extension. It must remain completely dormant until the user explicitly signals their intent to begin a weaving session. The earliest possible signal for this intent is the invocation of the "Add as source" or "Add as destination" commands from the file explorer context menu. Therefore, the activationEvents in package.json must be strictly limited to these initial commands (e.g., \`\`). This ensures the extension has zero performance impact on VS Code until the exact moment it is needed.

### **3.4 User Onboarding via a Contribution Walkthrough**

The extension provides a powerful but non-obvious, multi-step workflow. A new user who installs the extension will not immediately understand the concept of a "weaver session" or how to begin. This initial friction can lead to user abandonment.
To address this, the project must provide a structured onboarding experience. VS Code offers a purpose-built feature for this: the contributes.walkthroughs contribution point.26 This allows an extension to define a multi-step, interactive checklist that appears on VS Code's "Get Started" page when the extension is first installed. Each step can include descriptive text, images, and buttons that execute specific commands.
A walkthrough will dramatically improve user adoption by guiding the user through their first weaving session. The steps should cover the canonical "happy path" workflow:

1. **Step 1: Add Source Documents.** (Includes a button that executes the workbench.action.files.revealInOsExplorer command to help the user find files to add).
2. **Step 2: Create a Destination Document.** (Includes a button that executes the markdown-semantic-weaver.addNewDestinationDocument command).
3. **Step 3: Explore and Insert Content.** (Explains the "Sections View" and the concept of inserting content into the outliner).
4. **Step 4: Preview Your Work.** (Includes a button to execute the markdown-semantic-weaver.previewDocument command).

This interactive tutorial provides immediate value, demonstrates the extension's core workflow, and ensures the user's first experience is a successful one.

## **Section 4: Summary of Recommendations and Prioritized Action Plan**

The analysis has identified several key areas in the project's foundational scaffolding. The following action plan prioritizes the necessary tasks to address these areas, ensuring the project is built on a solid, maintainable, and secure foundation. Items marked as P0 are considered blockers to the commencement of feature development.
**Table 4: Prioritized Action Plan**

| Priority | Task | Area | Rationale |
| :---- | :---- | :---- | :---- |
| **P0** | **Establish .devcontainer Configuration** | Environment | Ensures a consistent, reproducible development environment for all team members and CI, eliminating a major source of project friction. |
| **P0** | **Implement Workspace Trust Support** | Security | A fundamental security requirement for any extension that interacts with the file system. Prevents a poor user experience in Restricted Mode. |
| **P0** | **Define ML Model Asset Strategy** | Architecture | A decision on how to package and deliver large binary assets is required before the source processing module can be fully implemented. |
| **P0** | **Set up Mocha Testing Harness** | Quality | Establishes the foundational tooling for unit and integration tests, enabling a test-driven development approach from the outset. |
| **P1** | **Add contributes.configuration Schema** | Configuration | Provides necessary user-facing settings for performance tuning and future-proofing, moving away from hardcoded values. |
| **P1** | **Implement the LoggerService** | Observability | A basic logging framework is essential for effective debugging during development and for diagnosing user-reported issues post-release. |
| **P1** | **Define Lazy activationEvents** | Performance | Ensures the extension has zero impact on VS Code startup performance, a critical factor for user satisfaction. |
| **P1** | **Write Initial Unit & Integration Tests** | Quality | Begin writing tests for the most critical and complex pieces of business logic and API interactions as they are developed. |
| **P2** | **Integrate @vscode/extension-telemetry** | Analytics | Enables data-driven product decisions by collecting anonymous, aggregated usage data. |
| **P2** | **Design and Implement User Onboarding Walkthrough** | User Experience | Dramatically improves user adoption and reduces the learning curve for a complex workflow. |
| **P2** | **Set up E2E Testing Framework** | Quality | Provides the highest level of confidence by validating critical end-to-end user workflows, safeguarding against regressions. |

#### **Works cited**

1. Specification: Markdown Semantic Weaver VS Code Extension
2. Design Specification: Source Processing Module
3. Create a Dev Container \- Visual Studio Code, accessed August 27, 2025, [https://code.visualstudio.com/docs/devcontainers/create-dev-container](https://code.visualstudio.com/docs/devcontainers/create-dev-container)
4. Advanced container configuration \- Visual Studio Code, accessed August 27, 2025, [https://code.visualstudio.com/remote/advancedcontainers/overview](https://code.visualstudio.com/remote/advancedcontainers/overview)
5. Custom Dev Container Features \- Visual Studio Code, accessed August 27, 2025, [https://code.visualstudio.com/blogs/2022/09/15/dev-container-features](https://code.visualstudio.com/blogs/2022/09/15/dev-container-features)
6. Design Specification: The Weaving View UI Component
7. Contribution Points | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/references/contribution-points](https://code.visualstudio.com/api/references/contribution-points)
8. vscode-docs-archive/api/references/contribution-points.md at master \- GitHub, accessed August 27, 2025, [https://github.com/microsoft/vscode-docs-archive/blob/master/api/references/contribution-points.md](https://github.com/microsoft/vscode-docs-archive/blob/master/api/references/contribution-points.md)
9. User and workspace settings \- Visual Studio Code, accessed August 27, 2025, [https://code.visualstudio.com/docs/configure/settings](https://code.visualstudio.com/docs/configure/settings)
10. Design Specification: Document Generation and Serialization Component
11. Workspace Trust \- Visual Studio Code, accessed August 27, 2025, [https://code.visualstudio.com/docs/editing/workspaces/workspace-trust](https://code.visualstudio.com/docs/editing/workspaces/workspace-trust)
12. Workspace Trust Extension Guide | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/extension-guides/workspace-trust](https://code.visualstudio.com/api/extension-guides/workspace-trust)
13. Publishing Extensions \- Visual Studio Code, accessed August 27, 2025, [https://code.visualstudio.com/api/working-with-extensions/publishing-extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
14. Design Specification: Session and State Management Component
15. Testing Extensions | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/working-with-extensions/testing-extension](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
16. @vscode/test-electron \- npm, accessed August 27, 2025, [https://www.npmjs.com/package/@vscode/test-electron](https://www.npmjs.com/package/@vscode/test-electron)
17. A Complete Guide to VS Code Extension Testing \- DEV Community, accessed August 27, 2025, [https://dev.to/sourishkrout/a-complete-guide-to-vs-code-extension-testing-268p](https://dev.to/sourishkrout/a-complete-guide-to-vs-code-extension-testing-268p)
18. New tools for automating end-to-end tests for VS Code extensions | Red Hat Developer, accessed August 27, 2025, [https://developers.redhat.com/blog/2019/11/18/new-tools-for-automating-end-to-end-tests-for-vs-code-extensions](https://developers.redhat.com/blog/2019/11/18/new-tools-for-automating-end-to-end-tests-for-vs-code-extensions)
19. Consolidated Architectural Blueprint
20. Design Specification: Data Access & Services Layer for the Markdown Semantic Weaver Extension
21. Design Specification: Command and Action Handlers for the Markdown Semantic Weaver Extension
22. Logging in our VS Code Extension, the code behind the code \- ThatJeffSmith, accessed August 27, 2025, [https://www.thatjeffsmith.com/archive/2024/01/logging-in-our-vs-code-extension-the-code-behind-the-code/](https://www.thatjeffsmith.com/archive/2024/01/logging-in-our-vs-code-extension-the-code-behind-the-code/)
23. microsoft/vscode-extension-telemetry: Node module to help ... \- GitHub, accessed August 27, 2025, [https://github.com/microsoft/vscode-extension-telemetry](https://github.com/microsoft/vscode-extension-telemetry)
24. Telemetry \- Visual Studio Code, accessed August 27, 2025, [https://code.visualstudio.com/docs/configure/telemetry](https://code.visualstudio.com/docs/configure/telemetry)
25. Activation Events | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/references/activation-events](https://code.visualstudio.com/api/references/activation-events)
26. Walkthroughs | Visual Studio Code Extension API, accessed August 27, 2025, [https://code.visualstudio.com/api/ux-guidelines/walkthroughs](https://code.visualstudio.com/api/ux-guidelines/walkthroughs)