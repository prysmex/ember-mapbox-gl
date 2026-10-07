import Component from '@glimmer/component';
import { hash } from '@ember/helper';
import { guidFor } from '@ember/object/internals';
import { service } from '@ember/service';

import { resource, use } from 'ember-resources';

import type MapCacheService from '../../services/map-cache.ts';
import type MapboxGlConfigService from '../../services/mapbox-gl-config.ts';
import type Owner from '@ember/owner';
import type { Layer, LayerSpecification, Map as MapboxMap } from 'mapbox-gl';

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

export interface MapboxGlLayerArgs {
  map: MapboxMap;
  layer?: Partial<LayerSpecification>;
  before?: string;
  cacheKey?: string;
  cache?: boolean;
  _sourceId?: string;
  onDidInsert?: (layer: Layer) => void;
  onDidUpdate?: (layer: Layer) => void;
}

export interface MapboxGlLayerSignature {
  Args: MapboxGlLayerArgs;
  Blocks: {
    default: [
      {
        id: string;
      },
    ];
  };
}

export default class MapboxGlLayerComponent extends Component<MapboxGlLayerSignature> {
  @service declare mapCache: MapCacheService;
  @service declare mapboxGlConfig: MapboxGlConfigService;

  declare layerId: string;
  declare cacheKey?: string;
  declare cache?: boolean;
  declare map?: MapboxMap;

  get _sourceId(): string | undefined {
    return this.args.layer?.source ?? this.args._sourceId;
  }

  get _layerType(): Layer['type'] {
    return this.args.layer?.type ?? 'line';
  }

  get _envConfig() {
    return this.mapboxGlConfig.layers?.[this._layerType] ?? {};
  }

  get _layout(): LayerSpecification['layout'] {
    return { ...this._envConfig?.layout, ...this.args.layer?.layout };
  }

  get _paint(): LayerSpecification['paint'] {
    return { ...this._envConfig?.paint, ...this.args.layer?.paint };
  }

  get _layer(): Layer {
    // do this to pick up other properties like filter, re, metadata, source-layer, minzoom, maxzoom, etc
    const layer: Layer = {
      ...this.args.layer,
      id: this.layerId,
      type: this._layerType,
      source: this._sourceId,
      layout: this._layout,
      paint: this._paint,
    };

    // Remove undefined keys
    Object.keys(layer).forEach((key) => {
      if (layer[key as keyof Layer] === undefined) {
        delete layer[key as keyof Layer];
      }
    });

    return layer;
  }

  constructor(owner: Owner, args: MapboxGlLayerArgs) {
    super(owner, args);

    const { map, before, layer: layerSpec, cacheKey, cache } = args;

    // Setup layer id before getting the layer
    this.layerId = layerSpec?.id ?? guidFor(this);

    this.cacheKey = cacheKey;
    this.cache = cache ?? false;
    // Save map for willDestroy
    this.map = map;

    const layer = this._layer;

    // Show the layer if it was hidden, otherwise add it
    if (map.getLayer(this.layerId)) {
      map.setLayoutProperty(this.layerId, 'visibility', 'visible');
    } else {
      map.addLayer(layer, before);
    }

    // Register this layer to the cache
    if (cacheKey && this.mapCache.hasMap(cacheKey)) {
      const cachedMap = this.mapCache.getMap(cacheKey)!;
      const cachedLayer = cachedMap.layers.get(this.layerId) ?? {
        sourceId: this._sourceId,
        currentRenders: 0,
      };
      cachedMap.layers.set(this.layerId, {
        ...cachedLayer,
        currentRenders: cachedLayer.currentRenders + 1,
      });
    }

    this.args.onDidInsert?.(layer);
  }

  @use updateLayer = resource(() => {
    const layer = this._layer;

    if (layer.layout) {
      Object.entries(layer.layout).forEach(([key, value]) => {
        this.args.map.setLayoutProperty(
          layer.id,
          key as Parameters<MapboxMap['setLayoutProperty']>[1],
          value as Parameters<MapboxMap['setLayoutProperty']>[2],
        );
      });
    }

    if (layer.paint) {
      Object.entries(layer.paint).forEach(([key, value]) => {
        this.args.map.setPaintProperty(
          layer.id,
          key as Parameters<MapboxMap['setPaintProperty']>[1],
          value as Parameters<MapboxMap['setPaintProperty']>[2],
        );
      });
    }

    if ('filter' in layer) {
      this.args.map.setFilter(layer.id, layer.filter);
    }

    if (layer.minzoom || layer.maxzoom) {
      const mapLayer = this.args.map.getLayer(layer.id) as LayerSpecification;
      this.args.map.setLayerZoomRange(
        layer.id,
        layer.minzoom ?? mapLayer.minzoom ?? 0,
        layer.maxzoom ?? mapLayer.maxzoom ?? 24,
      );
    }

    this.args.onDidUpdate?.(layer);

    return;
  });

  willDestroy() {
    super.willDestroy();

    if (this.cacheKey && this.mapCache.hasMap(this.cacheKey)) {
      const cachedMap = this.mapCache.getMap(this.cacheKey)!;
      const layer = cachedMap.layers.get(this.layerId);

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
    this.map = undefined;
  }

  removeOrHideLayer() {
    if (this.map) {
      if (this.cache) {
        // If the layer is intended for resuing, hide it
        this.map.setLayoutProperty(this.layerId, 'visibility', 'none');
      } else {
        // If the layer is not intended for resuing, remove the layer
        this.map.removeLayer(this.layerId);
      }
    }
  }

  <template>
    {{this.updateLayer}}

    {{yield (hash id=this.layerId)}}
  </template>
}
