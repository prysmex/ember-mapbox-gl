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

  _isCancelled = false;
  _isLoading = false;

  constructor(
    accessToken: string,
    options: MapOptions,
    onMapLoaded?: (map: MapboxMap) => void,
  ) {
    void this.load(accessToken, options, onMapLoaded);
  }

  async load(
    accessToken: string,
    options: MapOptions,
    onMapLoaded?: (map: MapboxMap) => void,
  ): Promise<void> {
    if (this.isLoaded || this._isLoading || this._isCancelled) {
      return;
    }

    this._isLoading = true;

    try {
      const { default: MapboxModule } = await import('mapbox-gl');
      await this._onModule(MapboxModule, accessToken, options);
      this._onMapLoaded(onMapLoaded);
      this._onComplete();
    } catch (e) {
      if (
        e instanceof MapboxLoaderCancelledError ||
        e instanceof MapboxSupportError ||
        e instanceof MapboxError
      ) {
        this._onError(e);
      } else {
        this._onError(new Error('An unknown error occurred'));
      }
    }
  }

  cancel() {
    this._isCancelled = true;

    const cancel = () => {
      if (this.map !== undefined) {
        this.map.remove();
        this.map = undefined;
      }
    };

    // some map users may be late doing cleanup (seen with mapbox-draw-gl),
    // so don't remove the map until the next tick
    // eslint-disable-next-line ember/no-runloop
    next(this, cancel);
  }

  _onModule(
    MapboxModule: MapboxGL,
    accessToken: string,
    mapOptions: MapOptions,
  ) {
    if (this._isCancelled) {
      throw new MapboxLoaderCancelledError();
    }

    this.MapboxGl = MapboxModule;
    this.MapboxGl.accessToken = accessToken;

    if (!MapboxModule.supported()) {
      throw new MapboxSupportError(
        'mapbox-gl not supported in current browser',
      );
    }

    const map = (this.map = new MapboxModule.Map(mapOptions));

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
  }

  _onMapLoaded = (
    onMapLoaded: ((map: MapboxMap) => void) | undefined,
  ): void => {
    if (this._isCancelled) {
      throw new MapboxLoaderCancelledError();
    }

    if (typeof onMapLoaded === 'function' && this.map !== undefined) {
      onMapLoaded(this.map);
    }
  };

  _onComplete = (): void => {
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
