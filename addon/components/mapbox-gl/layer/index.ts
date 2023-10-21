import Component from '@glimmer/component';
import config from 'ember-get-config';
import { guidFor } from '@ember/object/internals';
import { helper } from '@ember/component/helper';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import type LayersCacheService from '@prysmex-engineering/ember-mapbox-gl/services/layers-cache';
import {
  Map as MapboxMap,
  AnyLayout,
  AnyPaint,
  CustomLayerInterface,
  AnyLayer,
} from 'mapbox-gl';

type SupportedLayers = Exclude<AnyLayer, CustomLayerInterface>;

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

const onUpdateArgsHelper = helper(function ([updateLayer, layer]: [
  (layer: SupportedLayers) => boolean,
  SupportedLayers
]) {
  updateLayer(layer);
});

interface MapboxGlLayerArgs {
  map: MapboxMap;
  layer: SupportedLayers;
  before?: string;
  cacheKey?: string | false;
  _sourceId?: string;
  onDidInsert?: (layer: SupportedLayers) => void;
  onDidUpdate?: (layer: SupportedLayers) => void;
}

export default class MapboxGlLayerComponent extends Component<MapboxGlLayerArgs> {
  @service declare layersCache: LayersCacheService;

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
    let layer: SupportedLayers = {
      ...this.args.layer,
      id: this._layerId,
      type: this._layerType,
      source: this._sourceId,
      layout: this._layout,
      paint: this._paint,
    };
    // Remove undefined keys
    Object.keys(layer).forEach(
      (key: keyof SupportedLayers) =>
        layer[key] === undefined && delete layer[key]
    );
    return layer;
  }

  constructor(owner: any, args: MapboxGlLayerArgs) {
    super(owner, args);

    const layer = this._layer;
    const { map, before, cacheKey } = args;

    if (cacheKey && map.getLayer(layer.id)) {
      map.setLayoutProperty(layer.id, 'visibility', 'visible');
    } else {
      map.addLayer(layer, before);
    }

    this.layersCache.push(map, layer.id);
    this.args.onDidInsert?.(layer);
  }

  @action
  updateLayer(layer: SupportedLayers): boolean {
    if (layer.layout) {
      Object.keys(layer.layout).forEach((key: keyof AnyLayout) => {
        this.args.map.setLayoutProperty(layer.id, key, layer.layout![key]);
      });
    }

    if (layer.paint) {
      Object.keys(layer.paint).forEach((key: keyof AnyPaint) => {
        this.args.map.setPaintProperty(layer.id, key, layer.paint![key]);
      });
    }

    if ('filter' in layer) {
      this.args.map.setFilter(layer.id, layer.filter);
    }

    if (layer.minzoom || layer.maxzoom) {
      let mapLayer = this.args.map.getLayer(layer.id) as SupportedLayers;
      this.args.map.setLayerZoomRange(
        layer.id,
        layer.minzoom ?? mapLayer.minzoom ?? 0,
        layer.maxzoom ?? mapLayer.maxzoom ?? 24
      );
    }

    this.args.onDidUpdate?.(layer);
    return true;
  }

  willDestroy() {
    super.willDestroy();

    let { map, cacheKey } = this.args;

    let layerCounter = this.layersCache.getCounter(map, this._layer.id);

    // Only if there's one instance of the layer, remove it
    if (layerCounter === 1) {
      if (cacheKey) {
        map.setLayoutProperty(this._layerId, 'visibility', 'none');
      } else {
        map.removeLayer(this._layerId);
      }
    }

    // Substracts one to the layer counter
    this.layersCache.pop(map, this._layer.id);
  }
}
