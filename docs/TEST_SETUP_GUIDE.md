# VS Code Extension Testing Guide: Mocking withProgress API

## Problem Statement

The `vscode.window.withProgress` API behaves differently in test environments compared to the actual VS Code runtime. In tests, it returns immediately without properly awaiting the asynchronous operations inside it, causing test assertions to run prematurely and leading to false positives or timing-related failures.

## Solution Overview

This guide provides a comprehensive solution for mocking the `withProgress` API to ensure reliable async testing.

## 1. Enhanced Test Utilities

The updated `src/test/test-utils.ts` provides:

```typescript
// Mock implementation that properly awaits async operations
export const mockWithProgress = <R>(
  options: vscode.ProgressOptions,
  task: (
    progress: vscode.Progress<{ message?: string; increment?: number }>
  ) => Thenable<R>
): Thenable<R> => {
  return new Promise<R>((resolve, reject) => {
    const progress: vscode.Progress<{ message?: string; increment?: number }> =
      {
        report: (value: { message?: string; increment?: number }) => {
          if (process.env.DEBUG_TEST_PROGRESS) {
            console.log(`Progress: ${value.message || ""}`);
          }
        },
      };

    Promise.resolve(task(progress)).then(resolve).catch(reject);
  });
};
```

## 2. Service-Level Test Environment Handling

### EmbeddingService Updates

```typescript
private async initializeModel(): Promise<void> {
    // Skip progress reporting in test environment
    if (this.environmentService.isTestEnvironment) {
        this.logger.info("Initializing embedding model (test environment)");
        this.model = await FlagEmbedding.init({
            model: EmbeddingModel.BGESmallENV15,
            cacheDir: this.getCacheDir(),
            showDownloadProgress: false, // Disable in tests
        });
    } else {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Initializing embedding model...",
            cancellable: false
        }, async (progress) => {
            // ... normal progress handling
        });
    }
}
```

## 3. Jest Setup Examples

### jest.config.js

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/test/jest.setup.ts"],
  testMatch: ["**/src/test/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/test/**"],
};
```

### Test Usage

```typescript
import { initializeTestEnvironment } from "./test-utils";

describe("AddSourceHandler", () => {
  let cleanup: () => void;

  beforeAll(async () => {
    const context = {
      globalStorageUri: vscode.Uri.file("/tmp/test-storage"),
      subscriptions: [],
    } as any;
    cleanup = await initializeTestEnvironment(context);
  });

  afterAll(() => {
    cleanup?.();
  });

  it("should process files without timing issues", async () => {
    const handler = container.resolve(AddSourceHandler);
    const testFiles = [vscode.Uri.file("/path/to/test.md")];

    await handler.execute(undefined, testFiles);

    // Assertions will now run after actual processing completes
    const dataAccess = container.resolve(DataAccessService);
    const sections = await dataAccess.getUniqueSections();
    expect(sections.length).toBeGreaterThan(0);
  });
});
```

## 4. Mocha Setup Examples

### .mocharc.json

```json
{
  "extension": ["ts"],
  "require": ["ts-node/register"],
  "timeout": 10000,
  "slow": 5000
}
```

### Test Usage

```typescript
import { initializeTestEnvironment } from "./test-utils";

describe("Source Processing Pipeline", function () {
  let cleanup: () => void;

  before(async function () {
    this.timeout(30000); // Allow time for model initialization
    const context = {
      /* mock context */
    };
    cleanup = await initializeTestEnvironment(context);
  });

  after(function () {
    cleanup?.();
  });

  it("should handle async file processing correctly", async function () {
    // Test implementation
  });
});
```

## 5. Manual Mocking for Specific Tests

For tests requiring custom progress behavior:

```typescript
import { mockWithProgress } from "./test-utils";

it("should handle progress reporting", async () => {
  let progressReported = false;

  const customMock = <R>(
    options: vscode.ProgressOptions,
    task: (progress: any) => Thenable<R>
  ) => {
    return new Promise<R>((resolve, reject) => {
      const progress = {
        report: (value: any) => {
          progressReported = true;
          console.log("Custom progress:", value.message);
        },
      };
      Promise.resolve(task(progress)).then(resolve).catch(reject);
    });
  };

  // Apply custom mock
  (vscode.window as any).withProgress = customMock;

  // Run test
  await someAsyncOperation();

  expect(progressReported).toBe(true);
});
```

## 6. Best Practices

### 1. Environment Detection

```typescript
// In services that use withProgress
if (this.environmentService.isTestEnvironment) {
  // Skip progress UI, run operations directly
  await this.performAsyncOperation();
} else {
  // Use withProgress in production
  await vscode.window.withProgress(options, async (progress) => {
    await this.performAsyncOperation(progress);
  });
}
```

### 2. Test Data Setup

```typescript
// Ensure test data is ready before assertions
it("should process files and populate data", async () => {
  // Setup
  await setupTestData();

  // Action
  await handler.execute(undefined, testFiles);

  // Wait for async operations (if needed)
  await waitForAsyncOperations(1000);

  // Assertions
  const results = await dataAccess.getResults();
  expect(results).toBeDefined();
});
```

### 3. Cleanup

```typescript
// Always cleanup mocks between tests
afterEach(() => {
  jest.clearAllMocks();
  // Reset any custom mocks
  (vscode.window as any).withProgress = mockWithProgress;
});
```

## 7. Troubleshooting

### Common Issues

1. **Tests still timing out**: Ensure all async operations are properly awaited
2. **Progress not reported**: Check that progress.report() is called in the task function
3. **Mock not applied**: Verify the mock is set before the service initializes

### Debug Mode

```bash
# Enable progress logging in tests
DEBUG_TEST_PROGRESS=1 npm test
```

## 8. Integration with Existing Tests

The current `addSource.test.ts` already benefits from these changes:

```typescript
suiteSetup(async function () {
  this.timeout(60000);
  const context = {
    /* ... */
  };
  await initializeTestEnvironment(context);
  // Now withProgress will properly await in all services
});
```

This ensures that file processing, embedding initialization, and data storage all complete before test assertions run.
