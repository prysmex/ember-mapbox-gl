import type { Map as MapboxMap, MapEventOf, MapEventType } from 'mapbox-gl';

/**
 * Waits for a specific event from a Mapbox GL map or mapbox-gl object.
 * @param {Object} map - The Mapbox GL instance or source object.
 * @param {string} event - The event name to listen for.
 * @return {Promise} A Promise that resolves when the event is triggered.
 */
export default function awaitMapboxEvent(
  map: MapboxMap,
  event: MapEventType,
): Promise<MapEventOf<MapEventType>> {
  return new Promise((resolve) => {
    // Add the event listener
    function handler(e: MapEventOf<MapEventType>): void {
      map.off(event, handler); // Clean up after the event fires
      resolve(e); // Resolve the promise with the event object
    }

    map.on(event, handler);
  });
}
