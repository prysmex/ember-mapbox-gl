import Component from '@glimmer/component';
import MapboxLoader from '../../-private/mapbox-loader';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { getOwner } from '@ember/application';
import { Map as MapboxMap } from 'mapbox-gl';
import type MapCacheService from '@prysmex-engineering/ember-mapbox-gl/services/map-cache';
import { guidFor } from '@ember/object/internals';

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

interface MapboxGlArgs {
  initOptions: {};
  mapLoaded?: (map: MapboxMap) => void;
  mapReloaded?: (map: MapboxMap, metadata: {}) => void;
  cacheKey?: string | false;
  cacheMetadata?: {};
}

export default class MapboxGlComponent extends Component<MapboxGlArgs> {
  @service declare mapCache: MapCacheService;

  @tracked _loader: MapboxLoader;

  /**
   * Boolean to indicate if the map should be cached for later use
   */
  get cache() {
    return this.args.cacheKey !== false;
  }

  get cacheKey() {
    return this.args.cacheKey || guidFor(this);
  }

  constructor(owner: any, args: MapboxGlArgs) {
    super(owner, args);
    this._loader = new MapboxLoader();
  }

  @action
  loadMap(element: HTMLElement) {
    if (this.cache && this.mapCache.hasMap(this.cacheKey)) {
      let {
        mapLoader: mapLoader,
        element: mapContainer,
        metadata,
      } = this.mapCache.getMap(this.cacheKey)!;
      this._loader = mapLoader;

      // Append the map html element into component
      element.appendChild(mapContainer);

      if (mapLoader.map) {
        mapLoader.map.resize();
        this.args.mapReloaded?.(mapLoader.map, metadata);
      }

      // Save new options after sending mapReloaded event
      this.mapCache.setMap(
        this.cacheKey,
        mapLoader,
        mapContainer,
        this.args.cacheMetadata
      );
    } else {
      //@ts-expect-error
      let config = getOwner(this).resolveRegistration('config:environment');
      const { accessToken, map } = config['mapbox-gl'];
      const options = { ...map, ...this.args.initOptions };

      let mapContainer = document.createElement('div');
      options.container = mapContainer;
      element.appendChild(mapContainer);

      this._loader.load(accessToken, options, this.mapLoaded);
    }
  }

  @action
  mapLoaded(map: MapboxMap) {
    // Add map instance and DOM element to cache
    this.mapCache.setMap(
      this.cacheKey,
      this._loader,
      map.getContainer(),
      this.args.cacheMetadata
    );

    this.args.mapLoaded?.(map);
  }

  willDestroy() {
    super.willDestroy();
    // If map is not intended to be cached for later use, cancel the loader
    if (!this.cache) {
      this._loader.cancel();
      this.mapCache.deleteMap(this.cacheKey);
    }
  }
}
