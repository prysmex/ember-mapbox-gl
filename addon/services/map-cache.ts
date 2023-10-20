import Service from '@ember/service';
import MapboxLoader from '../-private/mapbox-loader';

/**
 * This service serves as a 'cache' for the map instances and their html elements.
 * The Maps are used for optimizing the performance and rendering speed.
 */

interface CachedMap {
  mapLoader: MapboxLoader;
  element: HTMLElement;
  metadata: {};
}

export default class MapCacheService extends Service {
  _cache = new Map<string, CachedMap>();

  /**
   * Returns whether or not the cache contains the map
   * @param {string} key - Id of map
   * @return {Boolean}
   */
  hasMap(key: string): boolean {
    return this._cache.has(key);
  }

  /**
   * Returns the specified map object if exist on the cache
   * @param {string} key - Id of map
   * @return {CachedMap | undefined}
   */
  getMap(key: string): CachedMap | undefined {
    return this._cache.get(key);
  }

  /**
   * Sets or update the map instance and html element of a map
   * @param {string} key - Id of map
   * @param {MapboxLoader} mapLoader - MapboxLoader Instance of map
   * @param {HTMLElement} element - HTML element where map instance is rendered
   */
  setMap(
    key: string,
    mapLoader: MapboxLoader,
    element: HTMLElement,
    metadata = {}
  ) {
    this._cache.set(key, { mapLoader, element, metadata });
  }

  /**
   * Deletes a map if exist by its key
   * @param {string} key - Id of map
   * @return {Boolean}
   */
  deleteMap(key: string): boolean {
    return this._cache.delete(key);
  }
}
