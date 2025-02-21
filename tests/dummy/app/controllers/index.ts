import { tracked } from '@glimmer/tracking';
import Controller from '@ember/controller';
import { cancel, later } from '@ember/runloop';

import type { LngLatLike, MapEvent } from 'mapbox-gl';

export default class AppController extends Controller {
  @tracked wanderDrone = 'https://wanderdrone.appspot.com';
  @tracked curLocation: LngLatLike | null = null;
  curRun: ReturnType<typeof later>;

  constructor(...args: any[]) {
    super(...args);

    this.curRun = later(this, this._updateWanderDrone, 1000);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.curLocation = [
          position.coords.longitude,
          position.coords.latitude,
        ];
      });
    }
  }

  willDestroy() {
    super.willDestroy();

    cancel(this.curRun);
  }

  _updateWanderDrone() {
    // eslint-disable-next-line no-self-assign
    this.wanderDrone = this.wanderDrone; // note that mapbox will reload the url everytime it is set as the data
    this.curRun = later(this, this._updateWanderDrone, 1000);
  }

  onClick(ev: MapEvent) {
    console.log('onClick', ev); // eslint-disable-line no-console
  }
}
