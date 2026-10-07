import { tracked } from '@glimmer/tracking';
import { hash } from '@ember/helper';
import {
  clearRender,
  render,
  settled,
  waitFor,
  waitUntil,
} from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import Sinon from 'sinon';

import MapboxGl from '#src/components/mapbox-gl/index.gts';
import MapboxGlSource from '#src/components/mapbox-gl/source.gts';

import setupMap from '../../helpers/create-map.js';

class State {
  @tracked sourceId;
  @tracked options;
  @tracked data;
}

const pointCollection = (...coordinates) => ({
  type: 'FeatureCollection',
  features: coordinates.map((c) => ({
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: c },
  })),
});

const COORDS = [-76.53063297271729, 39.18174077994108];

module('Integration | Component | mapbox gl source', function (hooks) {
  setupMap(hooks);
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.sandbox = Sinon.createSandbox();
    this.state = new State();
  });

  hooks.afterEach(function () {
    this.sandbox.restore();
  });

  test('it creates a sourceId if one is not provided', async function (assert) {
    const { map, state } = this;

    state.data = pointCollection(COORDS);

    const addSourceSpy = this.sandbox.spy(map, 'addSource');

    await render(
      <template>
        <MapboxGlSource
          @map={{map}}
          @options={{hash type="geojson" data=state.data}}
        />
      </template>,
    );

    assert.ok(addSourceSpy.calledOnce, 'addSource called once');
    assert.ok(addSourceSpy.firstCall.args[0], 'a sourceId is added');
  });

  test('it accepts source options as an options object', async function (assert) {
    const { map, state } = this;

    const sourceOptions = { type: 'geojson', data: pointCollection(COORDS) };

    const addSourceSpy = this.sandbox.spy(map, 'addSource');

    state.sourceId = 'evewvrwvwrvw';
    state.options = sourceOptions;

    await render(
      <template>
        <MapboxGlSource
          @map={{map}}
          @sourceId={{state.sourceId}}
          @options={{state.options}}
        />
      </template>,
    );

    assert.ok(addSourceSpy.calledOnce, 'addSource called once');
    assert.strictEqual(
      addSourceSpy.firstCall.args[0],
      state.sourceId,
      'correct sourceId is added',
    );
    assert.deepEqual(
      addSourceSpy.firstCall.args[1],
      sourceOptions,
      'correct source options',
    );

    // sources are only removed through the map cache, see MapboxGlSource#willDestroy
    await clearRender();
  });

  test('it passes updated data on to the source via the options property', async function (assert) {
    const { map, state } = this;

    const origData = pointCollection(COORDS);
    const updatedData = pointCollection(
      COORDS,
      [-76.5306329727172, 39.1817407799411],
    );

    const addSourceSpy = this.sandbox.spy(map, 'addSource');

    state.sourceId = 'evewvrwvwrvw';
    state.data = origData;

    await render(
      <template>
        <MapboxGlSource
          @map={{map}}
          @sourceId={{state.sourceId}}
          @options={{hash type="geojson" data=state.data}}
        />
      </template>,
    );

    assert.ok(addSourceSpy.calledOnce, 'addSource called once');
    assert.strictEqual(
      addSourceSpy.firstCall.args[0],
      state.sourceId,
      'correct sourceId is added',
    );
    assert.deepEqual(
      Object.assign({}, addSourceSpy.firstCall.args[1]), // clone so comparison against ember empty object matches
      { type: 'geojson', data: origData },
      'correct source options',
    );

    const source = map.getSource(state.sourceId);
    const setDataSpy = this.sandbox.spy(source, 'setData');

    state.data = updatedData;
    await settled();

    assert.ok(setDataSpy.calledOnce, 'source#setData called once');
    assert.deepEqual(
      setDataSpy.firstCall.args[0],
      updatedData,
      'correct data is updated',
    );
  });

  test('it passes updated coordinates on to the source via the options property', async function (assert) {
    const { map, state } = this;

    const updatedCoordinates = [
      [-76.54335737228394, 39.18579907229748],
      [-76.52803659439087, 39.1838364847587],
      [-76.5295386314392, 39.17683392507606],
      [-76.54520273208618, 39.17876344106642],
    ];

    state.sourceId = 'evewvrwvwrvw';
    state.options = {
      type: 'image',
      url: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
      coordinates: [
        [-76.54, 39.18],
        [-76.52, 39.18],
        [-76.52, 39.17],
        [-76.54, 39.17],
      ],
    };

    const addSourceSpy = this.sandbox.spy(map, 'addSource');

    await render(
      <template>
        <MapboxGlSource
          @map={{map}}
          @sourceId={{state.sourceId}}
          @options={{state.options}}
        />
      </template>,
    );

    assert.ok(addSourceSpy.calledOnce, 'addSource called once');
    assert.strictEqual(
      addSourceSpy.firstCall.args[0],
      state.sourceId,
      'correct sourceId is added',
    );
    assert.deepEqual(
      addSourceSpy.firstCall.args[1],
      state.options,
      'correct source options',
    );

    // ImageSource loads its image asynchronously and calls setCoordinates
    // itself once done, so wait for that before spying.
    await waitUntil(() => map.getSource(state.sourceId).loaded());

    const setCoordinatesSpy = this.sandbox.spy(
      map.getSource(state.sourceId),
      'setCoordinates',
    );

    state.options = { ...state.options, coordinates: updatedCoordinates };
    await settled();

    assert.ok(
      setCoordinatesSpy.calledOnce,
      'source#setCoordinates called once',
    );
    assert.deepEqual(
      setCoordinatesSpy.firstCall.args[0],
      updatedCoordinates,
      'correct coordinates is updated',
    );
  });

  test('it passes on its sourceId to its layers', async function (assert) {
    const { map, state } = this;

    state.sourceId = 'guvvguvguugvu';
    state.data = pointCollection(COORDS);

    const addLayerSpy = this.sandbox.spy(map, 'addLayer');

    await render(
      <template>
        <MapboxGlSource
          @map={{map}}
          @sourceId={{state.sourceId}}
          @options={{hash type="geojson" data=state.data}}
          as |Source|
        >
          <Source.layer
            @layer={{hash type="symbol" layout=(hash icon-image="rocket-15")}}
          />
        </MapboxGlSource>
      </template>,
    );

    assert.ok(addLayerSpy.calledOnce, 'addLayer called once');
    assert.strictEqual(
      addLayerSpy.firstCall.args[0].source,
      state.sourceId,
      'correct sourceId is used',
    );
  });

  test('it cleans up sources before its containing map is removed when the map goes away', async function (assert) {
    // a TypeError would be thrown during this test if it doesn't work
    const { state } = this;

    const sourceOptions = { type: 'geojson', data: pointCollection(COORDS) };

    let addSourceSpy = null;

    state.sourceId = 'evewvrwvwrvw';
    state.options = sourceOptions;

    const mapLoaded = (map) => {
      addSourceSpy = this.sandbox.spy(map, 'addSource');
    };

    await render(
      <template>
        <MapboxGl @mapLoaded={{mapLoaded}} as |Map|>
          <Map.source @sourceId={{state.sourceId}} @options={{state.options}} />
          <div id="loaded-sigil"></div>
        </MapboxGl>
      </template>,
    );

    await waitFor('#loaded-sigil', { timeout: 30000 });

    assert.ok(addSourceSpy.calledOnce, 'addSource called once');
    assert.strictEqual(
      addSourceSpy.firstCall.args[0],
      state.sourceId,
      'correct sourceId is added',
    );
    assert.deepEqual(
      addSourceSpy.firstCall.args[1],
      sourceOptions,
      'correct source options',
    );

    // sources are only removed through the map cache, see MapboxGlSource#willDestroy
    await clearRender();
  });

  test('it yields the sourceId', async function (assert) {
    const { map, state } = this;

    state.data = pointCollection(COORDS);

    await render(
      <template>
        <MapboxGlSource
          @sourceId="test-source-id"
          @map={{map}}
          @options={{hash type="geojson" data=state.data}}
          as |source|
        >
          <div id="source">
            {{source.id}}
          </div>
        </MapboxGlSource>
      </template>,
    );

    assert.dom('#source').hasText('test-source-id');
  });
});
