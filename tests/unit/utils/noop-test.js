import { module, test } from 'qunit';

import noop from '#src/utils/noop.ts';

module('Unit | Utility | noop', function () {
  // Replace this with your real tests.
  test('it works', function (assert) {
    let result = noop();

    assert.strictEqual(result, undefined);
  });
});
