import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { LoggerService } from '../../../services/LoggerService.js';

/**
 * Mock context and setup utilities for ModelAssetService tests
 */

/**
 * Creates a mock extension context for testing
 */
export function createMockExtensionContext(): vscode.ExtensionContext {
    return {
        globalStorageUri: vscode.Uri.file('/tmp/vscode-test-storage')
    } as vscode.ExtensionContext;
}

/**
 * Creates a mock logger with sinon stubs
 */
export function createMockLogger(sandbox: sinon.SinonSandbox): sinon.SinonStubbedInstance<LoggerService> {
    return {
        info: sandbox.stub(),
        error: sandbox.stub()
    } as sinon.SinonStubbedInstance<LoggerService>;
}