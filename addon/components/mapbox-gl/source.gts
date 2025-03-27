import Component from '@glimmer/component';
import { hash } from '@ember/helper';
import { guidFor } from '@ember/object/internals';
import { scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';

import MapboxGlLayer from '@prysmex-engineering/ember-mapbox-gl/components/mapbox-gl/layer';
import { resource, use } from 'ember-resources';

import type Owner from '@ember/owner';
import type { WithBoundArgs } from '@glint/template';
import type MapCacheService from '@prysmex-engineering/ember-mapbox-gl/services/map-cache';
import type {
  GeoJSONSource,
  ImageSource,
  Map as MapboxMap,
  SourceSpecification,
  VectorTileSource,
} from 'mapbox-gl';

/**
 * Adds a data source to the map. The API matches the mapbox [source docs](https://www.mapbox.com/mapbox-gl-js/api/#sources).
 *
 * Example:
 * ```hbs
 *  <MapboxGl as |Map|>
 *    <Map.source @options={{hash
 *      type='geojson'
 *      data=(hash
 *        type='FeatureCollection'
 *        features=(array
 *          (hash
 *            type='Feature'
 *            geometry=(hash
 *              type='Point'
 *              coordinates=(array -96.7969879 32.7766642)
 *            )
 *          )
 *        )
 *      )
 *    }}
 *    as |Source|>
 *
 *    </Map.source>
 *  </MapboxGl>
 * ```
 *
 * @class MapboxGLSource
 *
 * An options hash to set as the source.
 * - #### `options.type`
 *   - A string detailing the map source type. Typically `geojson`.
 *
 * - #### `options.data`
 *   - A data hash for the map, following the source.data API detailed by mapbox docs.
 * @argument {Object} options
 *
 * The ID of the source to add. Must not conflict with existing sources.
 * {@link https://www.mapbox.com/mapbox-gl-js/api/#map#addsource Mapbox}
 * @argument {string} sourceId
 */

export interface MapboxGlSourceArgs {
  map: MapboxMap;
  options: SourceSpecification;
  sourceId?: string;
  cacheKey?: string;
  cache?: boolean;
}

export interface MapboxGlSourceYield {
  layer: WithBoundArgs<
    typeof MapboxGlLayer,
    'map' | '_sourceId' | 'cacheKey' | 'cache'
  >;
  id: string;
}

export interface MapboxGlSourceSignature {
  Args: MapboxGlSourceArgs;
  Blocks: {
    default: [MapboxGlSourceYield];
  };
}

export default class MapboxGlSourceComponent extends Component<MapboxGlSourceSignature> {
  @service declare mapCache: MapCacheService;
  cacheKey: string | undefined;
  cache = false;

  get sourceId() {
    return this.args.sourceId ?? guidFor(this);
  }

  constructor(owner: Owner, args: MapboxGlSourceArgs) {
    super(owner, args);
    this.cacheKey = args.cacheKey;
    this.cache = args.cache ?? false;
  }

  @use updateSource = resource(() => {
    const source = this.args.map.getSource(this.sourceId);

    if (!source) {
      const options = { ...this.args.options };
      if (options?.type === 'geojson' && !options.data) {
        /*
          This allows you to send data as null without causing an error in first render.
          Subsecuent renders only unhide the layer, so if data is required by an
          if helper in the template, the layer won't be unhidden until the data has been loaded
        */
        options.data = { type: 'FeatureCollection', features: [] };
      }

      try {
        this.args.map.addSource(this.sourceId, options);
      } catch (e) {
        console.error('Error adding source', this.sourceId, e);
      }
    } else {
      const options = this.args.options;
      if (options.type === 'geojson' && options?.data) {
        (source as GeoJSONSource).setData(options.data);
      } else if (options.type === 'image' && options?.coordinates) {
        (source as ImageSource).setCoordinates(options.coordinates);
      } else if (options.type === 'vector' && options.tiles) {
        // For vector source type
        (source as VectorTileSource).setTiles(options.tiles);
      }
    }
  });

  willDestroy() {
    super.willDestroy();

    // If the source is not intended for resuing, remove the source
    if (!this.cache) {
      // Get the map instance from the cache
      if (this.cacheKey && this.mapCache.hasMap(this.cacheKey)) {
        const map = this.mapCache.getMap(this.cacheKey)!;
        let isBeingUsed = false;
        map.layers.forEach((layer) => {
          if (layer.sourceId === this.sourceId) {
            isBeingUsed = true;
          }
        });

        if (!isBeingUsed) {
          // wait for any layers to be removed before removing the source
          // eslint-disable-next-line ember/no-runloop
          scheduleOnce(
            'afterRender',
            this.args.map,
            'removeSource',
            this.sourceId,
          );
        }
      }
    }
  }

  <template>
    {{this.updateSource}}

    {{yield
      (hash
        layer=(component
          MapboxGlLayer
          map=@map
          _sourceId=this.sourceId
          cacheKey=@cacheKey
          cache=@cache
        )
        id=this.sourceId
      )
    }}
  </template>
}
