import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { ACCESS_TOKEN, MAP_STYLE } from '../../helpers/config.ts';

module('Unit | Service | mapbox-gl-config', function (hooks) {
  setupTest(hooks);

  test('it reads the `mapbox-gl` key from config/environment', function (assert) {
    const service = this.owner.lookup('service:mapbox-gl-config');

    assert.strictEqual(service.accessToken, ACCESS_TOKEN);
    assert.deepEqual(service.map, { style: MAP_STYLE });
    assert.strictEqual(service.marker, undefined);
  });

  test('it works without a `mapbox-gl` key in config/environment', function (assert) {
    this.owner.unregister('config:environment');
    this.owner.register(
      'config:environment',
      { modulePrefix: 'test-app' },
      { instantiate: false },
    );

    const service = this.owner.lookup('service:mapbox-gl-config');

    assert.strictEqual(service.accessToken, undefined);
    assert.strictEqual(service.map, undefined);
  });

  test('configure() only overrides the given keys', function (assert) {
    const service = this.owner.lookup('service:mapbox-gl-config');

    service.configure({
      accessToken: 'pk.other',
      popup: { closeButton: false },
    });

    assert.strictEqual(service.accessToken, 'pk.other');
    assert.deepEqual(service.popup, { closeButton: false });
    assert.deepEqual(service.map, { style: MAP_STYLE }, 'map is untouched');

    service.configure({ map: undefined });

    assert.strictEqual(service.map, undefined, 'keys can be cleared');
  });
});
