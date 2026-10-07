import { tracked } from '@glimmer/tracking';
import Service from '@ember/service';

import type ApplicationInstance from '@ember/application/instance';
import type Owner from '@ember/owner';
import type {
  LayerSpecification,
  MapOptions,
  MarkerOptions,
  PopupOptions,
} from 'mapbox-gl';

type LayerType = LayerSpecification['type'];

export interface MapboxGlConfig {
  accessToken?: string;
  map?: Partial<MapOptions>;
  marker?: Partial<MarkerOptions>;
  popup?: Partial<PopupOptions>;
  layers?: {
    [key in LayerType]?: Pick<LayerSpecification, 'layout' | 'paint'>;
  };
}

/**
 * Holds the global configuration used by the mapbox-gl components
 * (access token and default map, marker, popup and layer options).
 *
 * On creation it reads the `mapbox-gl` key of the host app's
 * `config/environment.js` (when one is registered), so classic apps keep
 * working without changes. Values can be set or overridden at runtime with
 * `configure()`, e.g. from the application route or an instance-initializer:
 *
 * ```ts
 * this.mapboxGlConfig.configure({ accessToken: 'pk.…' });
 * ```
 */
export default class MapboxGlConfigService extends Service {
  @tracked accessToken: string | undefined;
  @tracked map: MapboxGlConfig['map'];
  @tracked marker: MapboxGlConfig['marker'];
  @tracked popup: MapboxGlConfig['popup'];
  @tracked layers: MapboxGlConfig['layers'];

  constructor(owner: Owner) {
    super(owner);

    // `resolveRegistration` is not part of the public Owner type, but every
    // application instance implements it.
    const envConfig = (
      (owner as ApplicationInstance).resolveRegistration?.(
        'config:environment',
      ) as { 'mapbox-gl'?: MapboxGlConfig } | undefined
    )?.['mapbox-gl'];

    if (envConfig) {
      this.configure(envConfig);
    }
  }

  /**
   * Sets the given config keys, leaving the omitted ones untouched.
   */
  configure(config: MapboxGlConfig) {
    const { accessToken, map, marker, popup, layers } = config;

    if ('accessToken' in config) this.accessToken = accessToken;
    if ('map' in config) this.map = map;
    if ('marker' in config) this.marker = marker;
    if ('popup' in config) this.popup = popup;
    if ('layers' in config) this.layers = layers;
  }
}
