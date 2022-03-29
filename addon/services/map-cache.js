import Service from '@ember/service';

/**
  This service serves as a 'cache' for the map instances and their html elements.
  The values are saved in a hash {element: element, map: map} and are used
  for optimizing the performance and rendering speed.
*/

export default class MapCacheService extends Service {
  _cache = new Map();

  /**
   * Returns whether or not the cache contains the map
   * @param {string} key - Id of map
   * @return {Boolean}
   */
  has(key) {
    return this._cache.has(key);
  }

  /**
   * Returns the specified map object as { map: MapboxLoader Instance, element: HTML Element } if exist on the cache
   * @param {string} key - Id of map
   * @return {Object | undefined}
   */
  get(key) {
    return this._cache.get(key);
  }

  /**
   * Sets or update the map instance and html element of a map
   * @param {string} key - Id of map
   * @param {MapboxLoader Instance} map - MapboxLoader Instance of map
   * @param {HTML Element} element - HTML element where map instance is rendered
   */
  set(key, map, element) {
    this._cache.set(key, { map, element });
  }

  /**
   * Deletes a map if exist by its key
   * @param {string} key - Id of map
   * @return {Boolean}
   */
  delete(key) {
    return this._cache.delete(key);
  }
}
