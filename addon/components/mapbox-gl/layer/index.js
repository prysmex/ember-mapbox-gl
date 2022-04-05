import Component from '@glimmer/component';
import config from 'ember-get-config';
import { guidFor } from '@ember/object/internals';
import { helper } from '@ember/component/helper';
import { action } from '@ember/object';

const onUpdateArgsHelper = helper(function ([updateLayer, layer]) {
  updateLayer(layer);
});

/**
 * Adds a data source to the map.
 * The API matches the mapbox [source docs](https://www.mapbox.com/mapbox-gl-js/api/#sources).
 *
 * Example:
 * ```hbs
 * <MapboxGl as |Map|>
 *   <Map.source @options={{hash
 *     type='geojson'
 *     data=(hash
 *       type='FeatureCollection'
 *       features=(array
 *         (hash
 *           type='Feature'
 *           geometry=(hash
 *             type='Point'
 *             coordinates=(array -96.7969879 32.7766642)
 *           )
 *         )
 *       )
 *     )
 *   }} as |Source|>
 *     <Source.layer @layer={{hash
 *        type='circle'
 *        paint=(hash circle-color='#007cbf' circle-radius=10)}}/>
 *   </Map.source>
 * </MapboxGl>
 * ```
 *
 * @class MapboxGLSource
 *
 * A hash to pass on to the mapbox [layer](https://www.mapbox.com/mapbox-gl-js/style-spec/#layers).
 * @argument {Object} layer
 *
 * The ID of an existing layer to insert the new layer before.
 * If this argument is omitted, the layer will be appended to the end of the layers array.
 * @argument {string} before
 */
export default class MapboxGlMarkerComponent extends Component {
  onUpdateArgs = onUpdateArgsHelper;

  get _sourceId() {
    return this.args.layer?.source ?? this.args._sourceId;
  }

  get _layerId() {
    return this.args.layer?.id ?? guidFor(this);
  }

  get _layerType() {
    return this.args.layer?.type ?? 'line';
  }

  get _envConfig() {
    return (config['mapbox-gl'] ?? {})[this._layerType];
  }

  get _layout() {
    return { ...this._envConfig?.layout, ...this.args.layer?.layout };
  }

  get _paint() {
    return { ...this._envConfig?.paint, ...this.args.layer?.paint };
  }

  get _layer() {
    // do this to pick up other properties like filter, re, metadata, source-layer, minzoom, maxzoom, etc
    let layer = {
      ...this.args.layer,
      id: this._layerId,
      type: this._layerType,
      source: this._sourceId,
      layout: this._layout,
      paint: this._paint,
    };
    // Remove undefined keys
    Object.keys(layer).forEach(
      (key) => layer[key] === undefined && delete layer[key]
    );
    return layer;
  }

  constructor() {
    super(...arguments);

    const layer = this._layer;
    const { map, before, cacheKey } = this.args;

    if (cacheKey && map.getLayer(layer.id)) {
      map.setLayoutProperty(layer.id, 'visibility', 'visible');
    } else {
      map.addLayer(layer, before);
    }
  }

  @action
  updateLayer(layer) {
    for (const k in layer.layout) {
      this.args.map.setLayoutProperty(layer.id, k, layer.layout[k]);
    }

    for (const k in layer.paint) {
      this.args.map.setPaintProperty(layer.id, k, layer.paint[k]);
    }

    if ('filter' in layer) {
      this.args.map.setFilter(layer.id, layer.filter);
    }

    this.args.map.setLayerZoomRange(layer.id, layer.minzoom, layer.maxzoom);
  }

  willDestroy() {
    super.willDestroy(...arguments);

    if (this.args.cacheKey) {
      this.args.map.setLayoutProperty(this._layerId, 'visibility', 'none');
    } else {
      this.args.map.removeLayer(this._layerId);
    }
  }
}
