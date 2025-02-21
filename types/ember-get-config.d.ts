import type {
  LayerSpecification,
  MapOptions,
  MarkerOptions,
  PopupOptions,
} from 'mapbox-gl';

type LayerType = LayerSpecification['type'];

declare module 'ember-get-config' {
  declare const config: {
    'mapbox-gl': {
      accessToken: string;
      map?: Partial<MapOptions>;
      marker?: Partial<MarkerOptions>;
      popup?: Partial<PopupOptions>;
      layers?: {
        [key in LayerType]?: Pick<LayerSpecification, 'layout' | 'paint'>;
      };
    };
    [key: string]: any;
  };
  export default config;
}
