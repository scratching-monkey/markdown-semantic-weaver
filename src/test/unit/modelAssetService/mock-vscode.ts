import * as sinon from 'sinon';
import * as vscode from 'vscode';

/**
 * VS Code API mocking utilities for ModelAssetService tests
 */

export interface MockVSCode {
    withProgress: sinon.SinonStub;
    showInformationMessage: sinon.SinonStub;
    showErrorMessage: sinon.SinonStub;
}

/**
 * Creates mock VS Code API operations
 */
export function createMockVSCode(sandbox: sinon.SinonSandbox): MockVSCode {
    const withProgress = sandbox.stub(vscode.window, 'withProgress');
    const showInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
    const showErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');

    // Default implementation for withProgress
    withProgress.callsFake(async (_options, task) => {
        const progress = { report: sandbox.stub() };
        const token = { isCancellationRequested: false, onCancellationRequested: sandbox.stub() } as vscode.CancellationToken;
        return await task(progress, token);
    });

    return {
        withProgress,
        showInformationMessage,
        showErrorMessage
    };
}