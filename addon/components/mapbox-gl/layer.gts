import Component from '@glimmer/component';
import { hash } from '@ember/helper';
import { guidFor } from '@ember/object/internals';
import { inject as service } from '@ember/service';

import MapCacheService from '@prysmex-engineering/ember-mapbox-gl/services/map-cache';
import config from 'ember-get-config';
import { resource, use } from 'ember-resources';

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

// Helper type to make a single property optional
type OptionalProperty<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface MapboxGlLayerArgs {
  map: MapboxMap;
  layer: OptionalProperty<LayerSpecification, 'source'>;
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

  layerId = guidFor(this);
  cacheKey?: string;
  cache?: boolean;

  get _sourceId(): string | undefined {
    return this.args.layer?.source ?? this.args._sourceId;
  }

  get _layerType(): Layer['type'] {
    return this.args.layer?.type ?? 'line';
  }

  get _envConfig() {
    return config['mapbox-gl']?.layers?.[this._layerType] ?? {};
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

    console.log(
      `Adding layer: ${this.layerId}, guidFor: ${guidFor(this)}, cahceKey: ${
        this.cacheKey
      }`,
    );

    const layer = this._layer;

    // Show the layer if it was hidden, otherwise add it
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', 'visible');
    } else {
      map.addLayer(layer, before);
    }

    // Register this layer to the cache
    if (cacheKey && this.mapCache.hasMap(cacheKey)) {
      const cachedMap = this.mapCache.getMap(cacheKey)!;
      const cachedLayer = cachedMap.layers.get(layerId) ?? {
        sourceId: this._sourceId,
        currentRenders: 0,
      };
      cachedMap.layers.set(layerId, {
        ...cachedLayer,
        currentRenders: cachedLayer.currentRenders + 1,
      });
    }

    this.args.onDidInsert?.(layer);
  }

  @use updateLayer = resource(() => {
    const layer = this._layer;

    if (layer.layout) {
      Object.keys(layer.layout).forEach((key) => {
        // @ts-expect-error: Object.keys() doesn't guarantee the type of the key
        this.args.map.setLayoutProperty(layer.id, key, layer.layout[key]);
      });
    }

    if (layer.paint) {
      Object.keys(layer.paint).forEach((key) => {
        // @ts-expect-error: Object.keys() doesn't guarantee the type of the key
        this.args.map.setPaintProperty(layer.id, key, layer.paint[key]);
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

    console.log(
      `Will destroying layer: ${this.layerId}, guidFor: ${guidFor(
        this,
      )}, cahceKey: ${this.cacheKey}`,
    );

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
  }

  removeOrHideLayer() {
    console.log(
      `Actually removing layer: ${this.layerId}, guidFor: ${guidFor(
        this,
      )}, cahceKey: ${this.cacheKey}`,
    );
    if (this.cache) {
      // If the layer is intended for resuing, hide it
      this.args.map.setLayoutProperty(this.layerId, 'visibility', 'none');
    } else {
      // If the layer is not intended for resuing, remove the layer
      this.args.map.removeLayer(this.layerId);
    }
  }

  <template>
    {{this.updateLayer}}

    {{yield (hash id=this.layerId)}}
  </template>
}
