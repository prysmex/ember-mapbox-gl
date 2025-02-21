import Service from '@ember/service';

import type MapboxLoader from '../-private/mapbox-loader';

/**
 * This service serves as a 'cache' for the map instances and their html elements.
 * The Maps are used for optimizing the performance and rendering speed.
 */

type layerId = string;
interface CachedMap {
  mapLoader: MapboxLoader;
  metadata: object;
  layers: Map<layerId, { sourceId?: string; currentRenders: number }>;
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
   */
  setMap(key: string, mapLoader: MapboxLoader, metadata = {}) {
    let defaultValue = {
      layers: new Map(),
    };

    if (this._cache.has(key)) {
      defaultValue = this._cache.get(key)!;
    }

    let value = { ...defaultValue, ...{ mapLoader, metadata } };

    this._cache.set(key, value);
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
