import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type MapboxGlConfigService from '#src/services/mapbox-gl-config.ts';

export default class ApplicationRoute extends Route {
  @service declare mapboxGlConfig: MapboxGlConfigService;

  beforeModel() {
    this.mapboxGlConfig.configure({
      // set in the git-ignored .env.development.local, see CONTRIBUTING.md
      accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as
        string | undefined,
      map: {
        style: 'mapbox://styles/mapbox/streets-v9?optimize=true',
        center: [-96.7969879, 32.7766642],
        zoom: 10,
      },
    });
  }
}
