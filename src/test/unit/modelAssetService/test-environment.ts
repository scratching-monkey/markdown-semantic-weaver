/**
 * Test environment utilities for ModelAssetService tests
 */

/**
 * Helper to set test environment variable
 */
export function setTestEnvironment(value: string | undefined): () => void {
    const originalEnv = process.env.VSCODE_TEST;
    process.env.VSCODE_TEST = value;

    return () => {
        process.env.VSCODE_TEST = originalEnv;
    };
}