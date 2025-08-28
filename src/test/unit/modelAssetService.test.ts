import * as assert from 'assert';
import * as sinon from 'sinon';
import { ModelAssetService } from '../../services/ModelAssetService';

suite('ModelAssetService Test Suite', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('Sample unit test', () => {
        assert.strictEqual(1, 1);
    });
});
