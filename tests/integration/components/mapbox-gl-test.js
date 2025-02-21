import { render, waitFor } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

module('Integration | Component | mapbox gl', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    assert.expect(0);

    // Template block usage:
    await render(hbs`
      <MapboxGl>
        <div id='loaded-sigil'></div>
      </MapboxGl>
    `);

    await waitFor('#loaded-sigil');
  });
});
