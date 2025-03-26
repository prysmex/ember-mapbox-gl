import { next } from '@ember/runloop';
import { Promise as RsvpPromise } from 'rsvp';
import mapboxgl, { Map as MapboxMap, MapboxOptions, ErrorEvent } from 'mapbox-gl';
import { tracked } from '@glimmer/tracking';

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

  async load(
    accessToken: string,
    options: MapboxOptions,
    onMapLoaded?: (map: MapboxMap) => void
  ) {
    if (this.isLoaded || this._isLoading || this._isCancelled) {
      return;
    }

    this._isLoading = true;

    try {
      const { default: MapboxModule } = await import('mapbox-gl');
      await this._onModule(MapboxModule, accessToken, options);
      await this._onMapLoaded(onMapLoaded);
      await this._onComplete();
    } catch (e) {
      this._onError(e);
    }
  }

  cancel() {
    if (this.map !== undefined) {
      // some map users may be late doing cleanup (seen with mapbox-draw-gl),
      // so don't remove the map until the next tick

      const cancel = () => {
        this.map.remove();
        this.map = undefined;
        this._isCancelled = true;
      };

      next(this, cancel);
    }
  }

  _onModule(MapboxModule: MapboxGL, accessToken: string, mapOptions: MapboxOptions) {
    if (this._isCancelled) {
      throw new MapboxLoaderCancelledError();
    }
    this.MapboxGl = MapboxModule;
    MapboxModule.accessToken = accessToken;

    if (!MapboxModule.supported()) {
      throw new MapboxSupportError(
        'mapbox-gl not supported in current browser'
      );
    }

    const map = (this.map = new MapboxModule.Map(mapOptions));

    return new RsvpPromise((resolve, reject) => {
      const listeners = {
        onLoad() {
          map.off('load', listeners.onLoad);
          map.off('error', listeners.onError);
          resolve();
        },
        onError(ev: ErrorEvent) {
          map.off('load', listeners.onLoad);
          map.off('error', listeners.onError);

          reject(new MapboxError(ev));
        },
      };

      map.on('load', listeners.onLoad);
      map.on('error', listeners.onError);
    });
  }


  _onMapLoaded(cb: ((map: MapboxMap) => void) | undefined) {
    if (this._isCancelled) {
      throw new MapboxLoaderCancelledError();
    }

    if (typeof cb === 'function' && this.map !== undefined) {
      return cb(this.map);
    }

    return null;
  }


  _onComplete() {
    this._isLoading = false;

    if (this._isCancelled) {
      return;
    }

    this.isLoaded = true;
  }

  _onError(err: MapboxLoaderCancelledError | MapboxSupportError | MapboxError) {
    this._isLoading = false;

    if (err instanceof MapboxLoaderCancelledError) {
      return;
    }

    if (this._isCancelled) {
      return;
    }

    this.error = err;
  }
}
