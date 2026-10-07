import { tracked } from '@glimmer/tracking';
import { click, render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import MapboxGlPopup from '#src/components/mapbox-gl/popup.gts';

import setupMap from '../../helpers/create-map.js';

class State {
  @tracked lngLat;
}

module('Integration | Component | mapbox gl popup', function (hooks) {
  setupMap(hooks);
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    assert.expect(0);

    const { map, MapboxGl } = this;

    await render(
      <template>
        <MapboxGlPopup @map={{map}} @MapboxGl={{MapboxGl}} />
      </template>,
    );
  });

  test('popup events can be subscribed to from the template', async function (assert) {
    const { map, MapboxGl } = this;

    const onClose = () => {
      assert.step('onClose');
    };

    await render(
      <template>
        <MapboxGlPopup @map={{map}} @MapboxGl={{MapboxGl}} as |popup|>
          {{popup.on "close" onClose}}
        </MapboxGlPopup>
      </template>,
    );

    // popups close on the map's `preclick` event
    map.fire('preclick');

    assert.verifySteps(['onClose']);
  });

  test('it handles re-renders on map clicks after closing', async function (assert) {
    const { map, MapboxGl } = this;
    const state = new State();

    state.lngLat = [-93.9688, 37.1314];

    await render(
      <template>
        <MapboxGlPopup
          @lngLat={{state.lngLat}}
          @map={{map}}
          @MapboxGl={{MapboxGl}}
        >
          Hi
        </MapboxGlPopup>
      </template>,
    );

    await click('.mapboxgl-popup-close-button');

    state.lngLat = [-30.9688, 36.1314];
    await settled();

    assert.dom('.mapboxgl-popup-content').containsText('Hi');
  });
});
