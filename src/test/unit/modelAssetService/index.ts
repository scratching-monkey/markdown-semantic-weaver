/**
 * ModelAssetService test utilities
 *
 * This module provides organized, reusable test utilities for ModelAssetService tests.
 * Each utility is focused on a specific concern for better maintainability.
 */

// Context and setup utilities
export {
    createMockExtensionContext,
    createMockLogger
} from './mock-context.js';

// File system utilities
export {
    createMockFileSystem,
    createMockWriteStream,
    type MockFileSystem
} from './mock-filesystem.js';

// VS Code API utilities
export {
    createMockVSCode,
    type MockVSCode
} from './mock-vscode.js';

// Network utilities
export {
    createMockResponse,
    createMockHttps,
    setupHttpsModuleMock,
    type MockHttps,
    type MockResponse
} from './mock-network.js';

// Test environment utilities
export {
    setTestEnvironment
} from './test-environment.js';