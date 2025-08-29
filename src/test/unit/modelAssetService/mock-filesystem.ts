import * as sinon from 'sinon';
import * as fs from 'fs';

/**
 * File system mocking utilities for ModelAssetService tests
 */

export interface MockFileSystem {
    existsSync: sinon.SinonStub;
    mkdirSync: sinon.SinonStub;
    createWriteStream: sinon.SinonStub;
    unlink: sinon.SinonStub;
}

/**
 * Creates mock file system operations
 */
export function createMockFileSystem(sandbox: sinon.SinonSandbox): MockFileSystem {
    return {
        existsSync: sandbox.stub(fs, 'existsSync'),
        mkdirSync: sandbox.stub(fs, 'mkdirSync'),
        createWriteStream: sandbox.stub(fs, 'createWriteStream'),
        unlink: sandbox.stub(fs, 'unlink')
    };
}

/**
 * Creates a mock write stream for testing file operations
 */
export function createMockWriteStream(sandbox: sinon.SinonSandbox): fs.WriteStream {
    return {
        on: sandbox.stub().returnsThis(),
        pipe: sandbox.stub().returnsThis(),
        close: sandbox.stub()
    } as unknown as fs.WriteStream;
}
