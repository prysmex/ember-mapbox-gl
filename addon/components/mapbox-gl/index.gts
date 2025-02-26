import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { hash } from '@ember/helper';
import { guidFor } from '@ember/object/internals';
import { inject as service } from '@ember/service';

import MapboxGlControl from '@prysmex-engineering/ember-mapbox-gl/helpers/mapbox-gl-control';
import MapboxGlOn from '@prysmex-engineering/ember-mapbox-gl/helpers/mapbox-gl-on';
import MapboxGlTerrain from '@prysmex-engineering/ember-mapbox-gl/helpers/mapbox-gl-terrain';
import config from 'ember-get-config';
import { modifier } from 'ember-modifier';

import MapboxLoader from '../../-private/mapbox-loader';
import MapboxGlLayer from './layer';
import MapboxGlMarker from './marker';
import MapboxGlPopup from './popup';
import MapboxGlSource from './source';

import type Owner from '@ember/owner';
import type { WithBoundArgs } from '@glint/template';
import type MapCacheService from '@prysmex-engineering/ember-mapbox-gl/services/map-cache';
import type { Map as MapboxMap, MapOptions } from 'mapbox-gl';

/**
 * Component that creates a new [mapbox-gl-js instance](https://www.mapbox.com/mapbox-gl-js/api/#map):
 *
 * ```hbs
 *  <MapboxGl @initOptions={{this.initOptions}} @mapLoaded={{this.mapLoaded}} as |Map|>
 *
 *  </MapboxGl>
 * ```
 *
 * @class MapboxGL
 *
 * An options hash to pass on to the [mapbox-gl-js instance](https://www.mapbox.com/mapbox-gl-js/api/).
 * This is only used during map construction, and updates will have no effect.
 * @argument {Object} initOptions
 *
 * An action function to call when the map has finished loading. Note that the component does not yield until the map has loaded,
 * so this is the only way to listen for the mapbox load event.
 * @argument {function} mapLoaded
 *
 * Key use to identify the map on the map cache
 * Only when specified, the map instance and its HTML element is cached on the map-cache service
 * When map is cached, the next time the same map is rendered it will load instantly the exact way it was left
 * Useful when rerending a map with large amounts of data, like layers with big geojsons
 * Note: Not recommended when rendering multiple times the same map at the same time
 * @argument {string} cacheKey
 *
 * @yield {Hash} map
 * @yield {Component} map.call
 * @yield {Component} map.control
 * @yield {Component} map.image
 * @yield {Component} map.layer
 * @yield {Component} map.marker
 * @yield {Component} map.on
 * @yield {Component} map.popup
 * @yield {Component} map.source
 */

export interface MapboxGlArgs {
  initOptions?: Partial<MapOptions>;
  mapLoaded?: (map: MapboxMap) => void;
  mapReloaded?: (map: MapboxMap, metadata: object) => void;
  cacheKey?: string | false;
  cacheMetadata?: object;
}

export interface MapboxGlYield {
  instance: MapboxMap | undefined;
  cache: boolean;
  on: WithBoundArgs<typeof MapboxGlOn, 'eventSource'>;
  terrain: WithBoundArgs<typeof MapboxGlTerrain, 'map'>;
  control: WithBoundArgs<typeof MapboxGlControl, 'map' | 'cache'>;
  source: WithBoundArgs<typeof MapboxGlSource, 'map' | 'cacheKey' | 'cache'>;
  layer: WithBoundArgs<typeof MapboxGlLayer, 'map' | 'cacheKey' | 'cache'>;
  marker: WithBoundArgs<typeof MapboxGlMarker, 'map' | 'MapboxGl'>;
  popup: WithBoundArgs<typeof MapboxGlPopup, 'map' | 'MapboxGl'>;
}

export interface MapboxGlSignature {
  Args: MapboxGlArgs;
  Element: HTMLDivElement;
  Blocks: {
    default: [MapboxGlYield];
    else: [Error];
  };
}

export default class MapboxGlComponent extends Component<MapboxGlSignature> {
  @service declare mapCache: MapCacheService;

  @tracked _loader: MapboxLoader | undefined;
  // Save initial cache key
  declare _cacheKey: string | false;
  declare initOptions: MapboxGlArgs['initOptions'];
  declare mapReloaded: MapboxGlArgs['mapReloaded'];
  declare cacheMetadata: MapboxGlArgs['cacheMetadata'];

  get shouldCache() {
    return this._cacheKey !== false;
  }

  get cacheKey() {
    return this._cacheKey || guidFor(this);
  }

  constructor(owner: Owner, args: MapboxGlArgs) {
    super(owner, args);

    // Untracked arguments
    this.initOptions = args.initOptions;
    this.mapReloaded = args.mapReloaded;
    this._cacheKey = args.cacheKey ?? false;
    this.cacheMetadata = args.cacheMetadata;
  }

  loadMap = modifier((element: HTMLDivElement) => {
    let loader: MapboxLoader | undefined;

    if (this.shouldCache && this.mapCache.hasMap(this.cacheKey)) {
      const { mapLoader, metadata } = this.mapCache.getMap(this.cacheKey)!;
      loader = mapLoader;

      if (mapLoader.map) {
        const mapContainer = mapLoader.map.getContainer();

        // Append the map html element into component
        element.appendChild(mapContainer);
        mapLoader.map.resize();
        this.mapReloaded?.(mapLoader.map, metadata);
      }

      // Save new options after sending mapReloaded event
      this.mapCache.setMap(this.cacheKey, mapLoader, this.cacheMetadata);
    } else {
      const mapContainer = document.createElement('div');
      const { accessToken, map } = config['mapbox-gl'];
      const options = {
        ...map,
        ...this.initOptions,
        container: mapContainer,
      };

      element.appendChild(mapContainer);

      loader = new MapboxLoader(accessToken, options, this.mapLoaded);
    }

    this._loader = loader;

    return () => {
      if (this.shouldCache) {
        const mapContainer = loader?.map?.getContainer();
        const mapParentElement = mapContainer?.parentElement;

        // Validate if the map parent element is still the same as the wrapper
        if (element === mapParentElement) {
          mapParentElement.removeChild(mapContainer!);
        }
      }
    };
  });

  mapLoaded = (map: MapboxMap) => {
    // Add map instance and DOM element to cache
    if (this._loader) {
      this.mapCache.setMap(
        this.cacheKey,
        this._loader,
        this.args.cacheMetadata,
      );
    }

    this.args.mapLoaded?.(map);
  };

  willDestroy() {
    super.willDestroy();

    // If map is not intended to be cached for later use, cancel the loader
    if (!this.shouldCache) {
      this._loader?.cancel();
      this.mapCache.deleteMap(this.cacheKey);
    }
  }

  <template>
    <div class="map-wrapper" {{this.loadMap}} ...attributes>
      {{#if this._loader.isLoaded}}
        {{yield
          (hash
            instance=this._loader.map
            cache=this.shouldCache
            on=(helper MapboxGlOn eventSource=this._loader.map)
            terrain=(helper MapboxGlTerrain map=this._loader.map)
            control=(helper
              MapboxGlControl map=this._loader.map cache=this.shouldCache
            )
            source=(component
              MapboxGlSource
              map=this._loader.map
              cacheKey=this.cacheKey
              cache=this.shouldCache
            )
            layer=(component
              MapboxGlLayer
              map=this._loader.map
              cacheKey=this.cacheKey
              cache=this.shouldCache
            )
            marker=(component
              MapboxGlMarker map=this._loader.map MapboxGl=this._loader.MapboxGl
            )
            popup=(component
              MapboxGlPopup map=this._loader.map MapboxGl=this._loader.MapboxGl
            )
          )
        }}
      {{else if this._loader.error}}
        {{#if (has-block "inverse")}}
          {{yield this._loader.error to="inverse"}}
        {{else}}
          {{! template-lint-disable no-log }}
          {{log "error rendering mapbox-gl" this._loader.error}}
        {{/if}}
      {{/if}}
    </div>
  </template>
}
