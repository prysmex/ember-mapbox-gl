import Service from '@ember/service';

/**
 * Layers cache to keep track of which layers are added to each map
 * This is used to track when the same layer is updated by changing
 * the whole layer object, the layer will try to be added again and after
 * that the destructor will remove the old layer. Instead of updating
 * the layer disappears
 */

export default class LayersCacheService extends Service {
  _cache = new Map();

  /**
   * Returns whether or not the cache contains the counter for the specified map and layer
   * @param {string} key - Id of map
   * @return {Boolean}
   */
  has(map, layerId) {
    let mapCache = this._cache.get(map);
    if (mapCache) {
      return mapCache.has(layerId);
    }
  }

  /**
   * Returns the number of times the layer has been added to the map
   * @param {string} key - Id of map
   * @return {Object | undefined}
   */
  get(map, layerId) {
    let mapCache = this._cache.get(map);
    if (mapCache) {
      return mapCache.get(layerId);
    }
    return undefined;
  }

  // Increments the counter for the specified map and layer
  push(map, layerId) {
    let mapCache = this._cache.get(map);
    if (!mapCache) {
      mapCache = new Map();
      mapCache.set(layerId, 1);
      this._cache.set(map, mapCache);
    } else {
      let layerCount = mapCache.get(layerId);
      if (layerCount) {
        mapCache.set(layerId, layerCount + 1);
      } else {
        mapCache.set(layerId, 1);
      }
    }
  }

  // Decrements the counter for the specified map and layer
  pop(map, layerId) {
    let mapCache = this._cache.get(map);
    if (mapCache) {
      let layerCount = mapCache.get(layerId);
      if (layerCount) {
        if (layerCount === 1) {
          mapCache.delete(layerId);
        } else {
          mapCache.set(layerId, layerCount - 1);
        }
      }
    }
  }
}
