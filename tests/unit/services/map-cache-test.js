import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | map-cache', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:map-cache');

    assert.ok(service);
  });
});
