import type { Map as MapboxMap, MapEventOf } from 'mapbox-gl';

/**
 * Waits until a Mapbox GL JS map instance has its style fully loaded.
 *
 * Because the Mapbox `'styledata'` event can fire before the style is completely loaded,
 * this function waits for the 'idle' event, checks using `isStyleLoaded()`, and if not loaded,
 * recurses to wait for the next 'idle' event.
 *
 * ISSUE: map.isStyleLoaded() is unreliable
 * Ref: https://github.com/mapbox/mapbox-gl-js/issues/8691
 *
 * It also listens for the `'error'` event to reject the promise if an error occurs.
 *
 * @param map - A Mapbox GL JS map instance.
 * @returns A promise that resolves when the style is fully loaded.
 */
export default async function waitForStyleLoaded(
  map: MapboxMap,
): Promise<void> {
  // If the style is already loaded, resolve immediately.
  if (map.isStyleLoaded()) {
    return;
  }

  // Wait for the next styledata event or an error event.
  await new Promise<void>((resolve, reject) => {
    // Handler for map errors.
    const onError = (e: MapEventOf<'error'>) => {
      map.off('idle', onStyleData);
      reject(e.error || new Error('Error loading map style'));
    };

    // Handler for styledata events.
    const onStyleData = () => {
      // Check if the style is now fully loaded.
      if (map.isStyleLoaded()) {
        map.off('error', onError);
        resolve();
      } else {
        // The event fired but the style is still not loaded.
        // Reattach the listener to wait for the next 'styledata' event.
        map.once('idle', onStyleData);
      }
    };

    // Attach listeners for the first events.
    map.once('idle', onStyleData);
    map.once('error', onError);
  });
}
