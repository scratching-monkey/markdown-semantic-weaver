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

    test('should download model if not exists', async () => {
        const context = {
            globalStorageUri: { fsPath: '/tmp/vscode-test' }
        } as vscode.ExtensionContext;

        const modelAssetService = new ModelAssetService(context);
        const downloadStub = sandbox.stub(modelAssetService as any, 'downloadModel').resolves();
        sandbox.stub(require('fs'), 'existsSync').returns(false);

        await modelAssetService.ensureModelIsAvailable();

        assert.ok(downloadStub.calledOnce);
    });
});
