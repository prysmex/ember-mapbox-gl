import QUnit from 'qunit';

import { ACCESS_TOKEN, MAP_STYLE } from './config.js';

const ALLOWED_ERRORS = ['The operation was aborted', 'Failed to fetch'];

export default function setupMap(hooks) {
  hooks.beforeEach(async function () {
    const MapboxGl = await import('mapbox-gl');
    this.MapboxGl = MapboxGl.default;
    this.MapboxGl.accessToken = ACCESS_TOKEN;

    await new Promise((resolve) => {
      this.map = new this.MapboxGl.Map({
        container: document
          .querySelector('#ember-testing')
          .appendChild(document.createElement('div')),
        style: MAP_STYLE,
      });

      this.map.style.once('data', () => resolve());

      const onErr = (ev) => {
        const err = {
          message: ev.error?.message || 'unknown mapbox error',
          event: ev,
          stack: ev.error?.stack,
        };

        if (ALLOWED_ERRORS.includes(err.message)) {
          console.error(err.message, ev.error);
        } else {
          QUnit.onUncaughtException(err);
        }
      };

      this.map.style.on('error', onErr);
      this.map.on('error', onErr);
    });
  });

  hooks.afterEach(function () {
    this.map.remove();
    document
      .querySelector('#ember-testing')
      .querySelectorAll('.mapboxgl-map')
      .forEach((el) => el.remove());
  });
}
