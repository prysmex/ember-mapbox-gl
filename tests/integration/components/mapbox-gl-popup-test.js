import { click,render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import setupMap from '../../helpers/create-map';

module('Integration | Component | mapbox gl popup', function (hooks) {
  setupMap(hooks);
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    assert.expect(0);

    await render(hbs`<MapboxGlPopup map={{this.map}} MapboxGl={{this.MapboxGl}} />`);
  });

  test('popup events can be subscribed to from the template', async function (assert) {
    this.onClose = () => {
      assert.step('onClose');
    };

    await render(hbs`
      <MapboxGlPopup map={{this.map}} MapboxGl={{this.MapboxGl}} as |popup| >
        {{popup.on 'close' this.onClose}}
      </MapboxGlPopup>
    `);

    // popups close when the map is clicked
    this.map.fire('click');

    assert.verifySteps(['onClose']);
  });

  test('it handles re-renders on map clicks after closing', async function (assert) {
    this.set('lngLat', [-93.9688, 37.1314]);

    await render(hbs`
      <MapboxGlPopup lngLat={{this.lngLat}} map={{this.map}} MapboxGl={{this.MapboxGl}} >
        Hi
      </MapboxGlPopup>
    `);

    await click('.mapboxgl-popup-close-button');

    this.set('lngLat', [-30.9688, 36.1314]);

    assert.dom('.mapboxgl-popup-content').containsText('Hi');
  });
});
