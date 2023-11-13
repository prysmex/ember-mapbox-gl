import Component from '@glimmer/component';
import config from 'ember-get-config';
import { guidFor } from '@ember/object/internals';
import { helper } from '@ember/component/helper';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import MapCacheService from '@prysmex-engineering/ember-mapbox-gl/services/map-cache';
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
  cacheKey?: string;
  cache?: boolean;
  _sourceId?: string;
  onDidInsert?: (layer: SupportedLayers) => void;
  onDidUpdate?: (layer: SupportedLayers) => void;
}

export default class MapboxGlLayerComponent extends Component<MapboxGlLayerArgs> {
  @service declare mapCache: MapCacheService;

  onUpdateArgs = onUpdateArgsHelper;
  layerId = guidFor(this);
  cacheKey?: string;
  cache?: boolean;

  get _sourceId() {
    return this.args.layer?.source ?? this.args._sourceId;
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
      id: this.layerId,
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

    const {
      map,
      before,
      layer: { id: layerId },
      cacheKey,
      cache,
    } = args;
    // Setup layer id before getting the layer
    if (layerId) {
      this.layerId = layerId;
    }
    this.cacheKey = cacheKey;
    this.cache = cache ?? false;

    const layer = this._layer;

    // Show the layer if it was hidden, otherwise add it
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', 'visible');
    } else {
      map.addLayer(layer, before);
    }

    // Register this layer to the cache
    if (cacheKey && this.mapCache.hasMap(cacheKey)) {
      let map = this.mapCache.getMap(cacheKey)!;
      let cachedLayer = map.layers.get(layerId) ?? {
        sourceId:
          typeof this._sourceId === 'string' ? this._sourceId : undefined,
        currentRenders: 0,
      };
      map.layers.set(layerId, {
        ...cachedLayer,
        currentRenders: cachedLayer.currentRenders + 1,
      });
    }

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

    if (this.cacheKey && this.mapCache.hasMap(this.cacheKey)) {
      let cachedMap = this.mapCache.getMap(this.cacheKey)!;
      let layer = cachedMap.layers.get(this.layerId);

      if (layer) {
        // Only if there's one instance of the layer, remove it
        if (layer.currentRenders === 1) {
          this.removeOrHideLayer();
        }

        // Substracts one to the layer counter
        cachedMap.layers.set(this.layerId, {
          ...layer,
          currentRenders: layer.currentRenders - 1,
        });
        return;
      }
    }

    // Remove the layer if cache not available or layer not found in cache
    this.removeOrHideLayer();
  }

  @action
  removeOrHideLayer() {
    if (this.cache) {
      // If the layer is intended for resuing, hide it
      this.args.map.setLayoutProperty(this.layerId, 'visibility', 'none');
    } else {
      // If the layer is not intended for resuing, remove the layer
      this.args.map.removeLayer(this.layerId);
    }
  }
}
