/// <reference types="rsvp" />
import type { ErrorEvent, Map as MapboxMap, MapOptions } from 'mapbox-gl';
import type mapboxgl from 'mapbox-gl';
export type MapboxGL = typeof mapboxgl;
export declare class MapboxLoaderCancelledError extends Error {
}
export declare class MapboxSupportError extends Error {
    isMapboxSupportError: boolean;
}
export declare class MapboxError extends Error {
    event: ErrorEvent;
    constructor(ev: ErrorEvent);
}
export default class MapboxLoader {
    map: MapboxMap | undefined;
    MapboxGl: MapboxGL | undefined;
    error: MapboxLoaderCancelledError | MapboxSupportError | MapboxError | undefined;
    isLoaded: boolean;
    _accessToken: string;
    _mapOptions: MapOptions;
    _extOnMapLoaded: ((map: MapboxMap) => void) | undefined;
    _isCancelled: boolean;
    _isLoading: boolean;
    constructor(accessToken: string, options: MapOptions, onMapLoaded?: (map: MapboxMap) => void);
    cancel(): void;
    _onModule: ({ default: MapboxModule }: {
        default: MapboxGL;
    }) => import("rsvp").default.Promise<unknown>;
    _onMapLoaded: () => void | null;
    _onComplete: () => void;
    _onError: (err: MapboxLoaderCancelledError | MapboxSupportError | MapboxError) => void;
}
