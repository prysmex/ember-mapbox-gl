import { click, render } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import MapboxGlMarker from '#src/components/mapbox-gl/marker.gts';

import setupMap from '../../helpers/create-map.js';

module('Integration | Component | mapbox gl marker', function (hooks) {
  setupMap(hooks);
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    const { map, MapboxGl } = this;
    const lngLat = [0, 0];

    await render(
      <template>
        <MapboxGlMarker
          @map={{map}}
          @lngLat={{lngLat}}
          @MapboxGl={{MapboxGl}}
        />
      </template>,
    );

    assert.dom('.mapboxgl-marker').exists();
  });

  test('it applies default marker options from the mapbox-gl-config service', async function (assert) {
    const { map, MapboxGl } = this;
    const lngLat = [0, 0];

    this.owner
      .lookup('service:mapbox-gl-config')
      .configure({ marker: { anchor: 'bottom-left' } });

    await render(
      <template>
        <MapboxGlMarker
          @map={{map}}
          @lngLat={{lngLat}}
          @MapboxGl={{MapboxGl}}
        />
      </template>,
    );

    assert
      .dom('.mapboxgl-marker')
      .hasClass('mapboxgl-marker-anchor-bottom-left');
  });

  test('it yields a popup bound to the marker', async function (assert) {
    const { map, MapboxGl } = this;
    const lngLat = [0, 0];

    await render(
      <template>
        <MapboxGlMarker
          @map={{map}}
          @lngLat={{lngLat}}
          @MapboxGl={{MapboxGl}}
          as |marker|
        >
          <marker.popup>
            Hello
          </marker.popup>
        </MapboxGlMarker>
      </template>,
    );

    await click('.mapboxgl-marker');

    assert.dom('.mapboxgl-popup-content').containsText('Hello');
  });
});
