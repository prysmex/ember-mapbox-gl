import { render, waitFor } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import MapboxGl from '#src/components/mapbox-gl/index.gts';

import { MAP_STYLE } from '../../helpers/config.ts';

module('Integration | Component | mapbox gl', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    assert.expect(0);

    await render(
      <template>
        <MapboxGl>
          <div id="loaded-sigil"></div>
        </MapboxGl>
      </template>,
    );

    await waitFor('#loaded-sigil', { timeout: 30000 });
  });

  test('it builds the map with the options from the mapbox-gl-config service', async function (assert) {
    let loadedMap;
    const mapLoaded = (map) => (loadedMap = map);

    this.owner.lookup('service:mapbox-gl-config').configure({
      map: { style: MAP_STYLE, zoom: 7 },
    });

    await render(
      <template>
        <MapboxGl @mapLoaded={{mapLoaded}}>
          <div id="loaded-sigil"></div>
        </MapboxGl>
      </template>,
    );

    await waitFor('#loaded-sigil', { timeout: 30000 });

    assert.strictEqual(loadedMap.getZoom(), 7, 'config map options are used');
  });
});
