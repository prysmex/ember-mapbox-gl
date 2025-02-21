import { tracked } from '@glimmer/tracking';
import { next } from '@ember/runloop';

import { Promise as RsvpPromise } from 'rsvp';

import type { ErrorEvent, Map as MapboxMap, MapOptions } from 'mapbox-gl';
import type mapboxgl from 'mapbox-gl';

export type MapboxGL = typeof mapboxgl;
export class MapboxLoaderCancelledError extends Error {}
export class MapboxSupportError extends Error {
  isMapboxSupportError = true;
}
export class MapboxError extends Error {
  event: ErrorEvent;
  constructor(ev: ErrorEvent) {
    super(ev.error?.message ?? 'unknown mapbox error');
    this.event = ev;
  }
}

export default class MapboxLoader {
  map: MapboxMap | undefined;
  MapboxGl: MapboxGL | undefined;

  @tracked error:
    | MapboxLoaderCancelledError
    | MapboxSupportError
    | MapboxError
    | undefined;
  @tracked isLoaded = false;

  _accessToken: string;
  _mapOptions: MapOptions;
  _extOnMapLoaded: ((map: MapboxMap) => void) | undefined;
  _isCancelled = false;
  _isLoading = false;

  constructor(
    accessToken: string,
    options: MapOptions,
    onMapLoaded?: (map: MapboxMap) => void,
  ) {
    this._isLoading = true;
    this._accessToken = accessToken;
    this._mapOptions = options;
    this._extOnMapLoaded = onMapLoaded;

    import('mapbox-gl')
      .then(this._onModule)
      .then(this._onMapLoaded)
      .then(this._onComplete)
      .catch(this._onError);
  }

  cancel() {
    this._isCancelled = true;

    if (this.map !== undefined) {
      // some map users may be late doing cleanup (seen with mapbox-draw-gl),
      // so don't remove the map until the next tick
      // eslint-disable-next-line ember/no-runloop
      next(this.map, 'remove');
    }
  }

  _onModule = ({ default: MapboxModule }: { default: MapboxGL }) => {
    if (this._isCancelled) {
      throw new MapboxLoaderCancelledError();
    }

    this.MapboxGl = MapboxModule;
    this.MapboxGl.accessToken = this._accessToken;

    if (!this.MapboxGl.supported()) {
      throw new MapboxSupportError(
        'mapbox-gl not supported in current browser',
      );
    }

    const map = (this.map = new this.MapboxGl.Map(this._mapOptions));

    return new RsvpPromise((resolve, reject) => {
      const listeners = {
        onLoad(this: void) {
          map.off('load', listeners.onLoad);
          map.off('error', listeners.onError);
          resolve();
        },
        onError(this: void, ev: ErrorEvent): void {
          map.off('load', listeners.onLoad);
          map.off('error', listeners.onError);

          reject(new MapboxError(ev));
        },
      };

      map.on('load', listeners.onLoad);
      map.on('error', listeners.onError);
    });
  };

  _onMapLoaded = () => {
    if (this._isCancelled) {
      throw new MapboxLoaderCancelledError();
    }

    if (typeof this._extOnMapLoaded === 'function' && this.map !== undefined) {
      return this._extOnMapLoaded(this.map);
    }

    return null;
  };

  _onComplete = () => {
    this._isLoading = false;

    if (this._isCancelled) {
      return;
    }

    this.isLoaded = true;
  };

  _onError = (
    err: MapboxLoaderCancelledError | MapboxSupportError | MapboxError,
  ) => {
    this._isLoading = false;

    if (err instanceof MapboxLoaderCancelledError) {
      return;
    }

    if (this._isCancelled) {
      return;
    }

    this.error = err;
  };
}
