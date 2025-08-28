import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { ModelAssetService } from '../../services/ModelAssetService';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('Sample integration test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
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
