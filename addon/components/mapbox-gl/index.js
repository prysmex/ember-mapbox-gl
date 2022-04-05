import Component from '@glimmer/component';
import MapboxLoader from '../../-private/mapbox-loader';
import config from 'ember-get-config';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

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

export default class MapboxGlComponent extends Component {
  @service mapCache;
  _loader;

  constructor() {
    super(...arguments);
    this._loader = MapboxLoader.create();
  }

  @action
  loadMap(element) {
    const cacheKey = this.args.cacheKey;
    if (cacheKey && this.mapCache.has(cacheKey)) {
      console.log('found map on cache!');
      let { map: mapLoader, element } = this.mapCache.get(cacheKey);
      this._loader = mapLoader;

      // Append the map html element into component
      element.appendChild(element);

      // Call arg onReloaded if map was retrieved from cache
      mapLoader.map.resize();
      // TODO: Check if hasLoaded is true after a resize
      if (mapLoader.map.hasLoaded) {
        this.args.mapReloaded?.(mapLoader.map);
    } else {
      const { accessToken, map } = config['mapbox-gl'];

      const options = { ...map, ...this.args.initOptions };
      options.container = element;

      this._loader.load(accessToken, options, this.mapLoaded);
    }
  }

  @action
  mapLoaded(map) {
    // Add map instance and DOM element to cache
    const cacheKey = this.args.cacheKey;
    if (cacheKey) {
      // This needs to be after since it sets map.loaded() to false;
      map.resize();
      map.hasLoaded = true;
      this.mapCache.set(cacheKey, this._loader, map._container);
    }

    this.args.mapLoaded?.(map);
  }

  @action
  handleWillDestroy() {
    if (!this.args.cacheKey) {
      this._loader.cancel();
    }
  }
}
