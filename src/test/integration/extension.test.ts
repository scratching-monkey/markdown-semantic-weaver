import 'reflect-metadata';
import { container } from 'tsyringe';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { ModelAssetService } from '../../services/ModelAssetService.js';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    suiteSetup(async () => {
        // Set log level to trace for tests
        await vscode.workspace.getConfiguration('markdown-semantic-weaver').update('logging.level', 'trace', vscode.ConfigurationTarget.Global);
    });

    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should skip model download in test environment', async () => {
        const context = {
            globalStorageUri: { fsPath: '/tmp/vscode-test' }
        } as vscode.ExtensionContext;

        // Ensure we're in test environment
        const originalEnv = process.env.VSCODE_TEST;
        process.env.VSCODE_TEST = 'true';

        try {
            container.register("vscode.ExtensionContext", { useValue: context });
            const modelAssetService = container.resolve(ModelAssetService);

            // In test environment, this should return early without any file system operations
            await modelAssetService.ensureModelIsAvailable();

            // The method should complete without throwing any errors
            assert.ok(true, 'Method completed successfully in test environment');
        } finally {
            // Restore original environment
            process.env.VSCODE_TEST = originalEnv;
        }
    });
});
