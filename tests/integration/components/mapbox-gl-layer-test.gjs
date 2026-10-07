import { tracked } from '@glimmer/tracking';
import { hash } from '@ember/helper';
import { clearRender, render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import Sinon from 'sinon';

import MapboxGlLayer from '#src/components/mapbox-gl/layer.gts';

import setupMap from '../../helpers/create-map.js';

class State {
  @tracked layer;
  @tracked before;
  @tracked source;
}

const point = {
  type: 'geojson',
  data: {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-76.53063297271729, 39.18174077994108],
    },
  },
};

module('Integration | Component | mapbox gl layer', function (hooks) {
  setupMap(hooks);
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.sandbox = Sinon.createSandbox();
    this.state = new State();
  });

  hooks.afterEach(function () {
    this.sandbox.restore();
  });

  test('it takes a layer object', async function (assert) {
    const { map, state } = this;

    state.layer = {
      id: 'ervewewebewbt',
      type: 'circle',
      source: 'asvaevr',
      layout: {
        visibility: 'visible',
      },
      paint: {
        'circle-color': '#00ffff',
      },
    };

    map.addSource(state.layer.source, point);

    try {
      const addLayerSpy = this.sandbox.spy(map, 'addLayer');

      await render(
        <template>
          <MapboxGlLayer @map={{map}} @layer={{state.layer}} />
        </template>,
      );

      assert.ok(addLayerSpy.calledOnce, 'addLayer called once');
      assert.deepEqual(
        addLayerSpy.firstCall.args[0],
        state.layer,
        'layer is passed through correctly',
      );

      await clearRender();
    } finally {
      map.removeSource(state.layer.source);
    }
  });

  test('it passes on the before option', async function (assert) {
    const { map, state } = this;

    state.before = 'ewvewtbewb';
    state.layer = { id: 'ivbiyob', type: 'line', source: point };

    map.addLayer({
      id: state.before,
      type: 'line',
      source: state.layer.source,
    });

    const addLayerSpy = this.sandbox.spy(map, 'addLayer');

    await render(
      <template>
        <MapboxGlLayer
          @map={{map}}
          @layer={{state.layer}}
          @before={{state.before}}
        />
      </template>,
    );

    assert.ok(addLayerSpy.calledOnce, 'addLayer called once');
    assert.strictEqual(
      addLayerSpy.firstCall.args[1],
      state.before,
      'passes on correct before',
    );

    await clearRender();
    map.removeLayer(state.before);
  });

  test('it generates a layer.id if needed', async function (assert) {
    const { map, state } = this;

    state.layer = { type: 'circle', source: point };

    const addLayerSpy = this.sandbox.spy(map, 'addLayer');
    const removeLayerSpy = this.sandbox.spy(map, 'removeLayer');

    await render(
      <template>
        <MapboxGlLayer @map={{map}} @layer={{state.layer}} />
      </template>,
    );

    assert.ok(addLayerSpy.calledOnce, 'addLayer called once');
    assert.ok(addLayerSpy.firstCall.args[0].id, 'layer has a generated id');

    await clearRender();

    assert.ok(removeLayerSpy.calledOnce, 'removeLayer called once');
    assert.strictEqual(
      removeLayerSpy.firstCall.args[0],
      addLayerSpy.firstCall.args[0].id,
      'removes correct layer',
    );
  });

  test('it defaults layer.type to "line"', async function (assert) {
    const { map, state } = this;

    const addLayerSpy = this.sandbox.spy(map, 'addLayer');

    state.source = point;

    await render(
      <template>
        <MapboxGlLayer @map={{map}} @layer={{hash source=state.source}} />
      </template>,
    );

    assert.ok(addLayerSpy.calledOnce, 'addLayer called once');
    assert.strictEqual(
      addLayerSpy.firstCall.args[0].type,
      'line',
      'default layer.type is line',
    );
  });

  test('it defaults layer.type to "line" if layer is provided', async function (assert) {
    const { map, state } = this;

    state.layer = { id: 'wevevwv', source: point };

    const addLayerSpy = this.sandbox.spy(map, 'addLayer');

    await render(
      <template>
        <MapboxGlLayer @map={{map}} @layer={{state.layer}} />
      </template>,
    );

    assert.ok(addLayerSpy.calledOnce, 'addLayer called once');
    assert.strictEqual(
      addLayerSpy.firstCall.args[0].id,
      state.layer.id,
      'layer id is passed through',
    );
    assert.strictEqual(
      addLayerSpy.firstCall.args[0].type,
      'line',
      'default layer.type is line',
    );
  });

  test('it updates layer layout properties', async function (assert) {
    const { map, state } = this;

    state.layer = {
      id: 'uhhvvuvgvvhjln vgu',
      type: 'circle',
      source: point,
      layout: {
        visibility: 'none',
      },
    };

    await render(
      <template>
        <MapboxGlLayer @map={{map}} @layer={{state.layer}} />
      </template>,
    );

    assert.strictEqual(
      map.getLayoutProperty(state.layer.id, 'visibility'),
      'none',
      'layout property was set',
    );

    state.layer = { ...state.layer, layout: { visibility: 'visible' } };
    await settled();

    assert.strictEqual(
      map.getLayoutProperty(state.layer.id, 'visibility'),
      'visible',
      'layout property was updated',
    );
  });

  test('it updates layer paint properties', async function (assert) {
    const { map, state } = this;

    state.layer = {
      id: 'u3qfgoljknjklm',
      type: 'circle',
      source: point,
      paint: {
        'circle-color': 'white',
      },
    };

    await render(
      <template>
        <MapboxGlLayer @map={{map}} @layer={{state.layer}} />
      </template>,
    );

    assert.strictEqual(
      map.getPaintProperty(state.layer.id, 'circle-color'),
      'white',
      'paint property was set',
    );

    state.layer = { ...state.layer, paint: { 'circle-color': 'black' } };
    await settled();

    assert.strictEqual(
      map.getPaintProperty(state.layer.id, 'circle-color'),
      'black',
      'paint property was updated',
    );
  });

  test('it passes layer.filter on', async function (assert) {
    const { map, state } = this;

    state.layer = {
      id: 'vbttbbb',
      type: 'circle',
      filter: ['==', '$type', 'Point'],
      source: point,
    };

    await render(
      <template>
        <MapboxGlLayer @map={{map}} @layer={{state.layer}} />
      </template>,
    );

    assert.deepEqual(
      map.getFilter(state.layer.id),
      state.layer.filter,
      'filter was set',
    );
  });

  test('it updates filter', async function (assert) {
    const { map, state } = this;

    state.layer = {
      id: 'rveilqbyveqpivhbeq',
      type: 'circle',
      filter: ['==', '$type', 'Point'],
      source: point,
    };

    await render(
      <template>
        <MapboxGlLayer @map={{map}} @layer={{state.layer}} />
      </template>,
    );

    assert.deepEqual(
      map.getFilter(state.layer.id),
      state.layer.filter,
      'filter was set',
    );

    state.layer = { ...state.layer, filter: ['!=', '$type', 'LineString'] };
    await settled();

    assert.deepEqual(
      map.getFilter(state.layer.id),
      state.layer.filter,
      'filter was updated',
    );

    state.layer = { ...state.layer, filter: null };
    await settled();

    assert.strictEqual(
      map.getFilter(state.layer.id),
      undefined,
      'filter was cleared',
    );
  });

  test('it passes through other layer options', async function (assert) {
    const { map, state } = this;

    state.layer = {
      id: 'rwbwrnytwnnm',
      type: 'circle',
      metadata: { kyle: 'turney' },
      'source-layer': 'contour',
      source: {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-terrain-v2',
      },
    };

    const addLayerSpy = this.sandbox.spy(map, 'addLayer');

    await render(
      <template>
        <MapboxGlLayer @map={{map}} @layer={{state.layer}} />
      </template>,
    );

    assert.ok(addLayerSpy.calledOnce, 'addLayer called once');
    assert.deepEqual(
      addLayerSpy.firstCall.args[0].metadata,
      state.layer.metadata,
      'metadata passed through',
    );
    assert.strictEqual(
      addLayerSpy.firstCall.args[0]['source-layer'],
      state.layer['source-layer'],
      'source-layer passed through',
    );
  });

  test('it updates minzoom and maxzoom on the layer', async function (assert) {
    const { map, state } = this;

    state.layer = {
      id: 'biyrivbibvpobv',
      type: 'circle',
      minzoom: 5,
      maxzoom: 10,
      source: point,
    };

    const addLayerSpy = this.sandbox.spy(map, 'addLayer');
    const setLayerZoomRangeSpy = this.sandbox.spy(map, 'setLayerZoomRange');

    await render(
      <template>
        <MapboxGlLayer @map={{map}} @layer={{state.layer}} />
      </template>,
    );

    assert.ok(addLayerSpy.calledOnce, 'addLayer called once');
    assert.strictEqual(
      addLayerSpy.firstCall.args[0].minzoom,
      5,
      'minzoom passed through',
    );
    assert.strictEqual(
      addLayerSpy.firstCall.args[0].maxzoom,
      10,
      'maxzoom passed through',
    );

    // the zoom range is also (re)applied on the initial render
    setLayerZoomRangeSpy.resetHistory();

    state.layer = { ...state.layer, minzoom: 2, maxzoom: 15 };
    await settled();

    assert.ok(addLayerSpy.calledOnce, 'addLayer only called once');
    assert.ok(setLayerZoomRangeSpy.calledOnce, 'setLayerZoomRange calledOnce');
    assert.deepEqual(
      setLayerZoomRangeSpy.firstCall.args,
      [state.layer.id, 2, 15],
      'setLayerZoomRange called with correct layerId, minzoom and maxzoom',
    );
  });

  test('it applies default layer options from the mapbox-gl-config service', async function (assert) {
    const { map, state } = this;

    this.owner.lookup('service:mapbox-gl-config').configure({
      layers: { circle: { paint: { 'circle-color': 'red' } } },
    });

    state.layer = { id: 'config-defaults', type: 'circle', source: point };

    await render(
      <template>
        <MapboxGlLayer @map={{map}} @layer={{state.layer}} />
      </template>,
    );

    assert.strictEqual(
      map.getPaintProperty(state.layer.id, 'circle-color'),
      'red',
      'default paint property from config was applied',
    );
  });

  test('it yields the layerId', async function (assert) {
    const { map, state } = this;

    state.layer = { id: 'test-layer-id', type: 'circle', source: point };

    await render(
      <template>
        <MapboxGlLayer @map={{map}} @layer={{state.layer}} as |layer|>
          <div id="layer">
            {{layer.id}}
          </div>
        </MapboxGlLayer>
      </template>,
    );

    assert.dom('#layer').hasText('test-layer-id');
  });
});
