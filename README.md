# ember-mapbox-gl

[![Latest NPM release][npm-badge]][npm-badge-url]
[![GitHub Actions Build Status][github-actions-badge]][github-actions-badge-url]
[![Ember Observer Score][ember-observer-badge]][ember-observer-url]

[npm-badge]: https://img.shields.io/npm/v/ember-mapbox-gl.svg
[npm-badge-url]: https://www.npmjs.com/package/@prysmex-engineering/ember-mapbox-gl
[github-actions-badge]: https://github.com/prysmex/ember-mapbox-gl/workflows/CI/badge.svg
[github-actions-badge-url]: https://github.com/prysmex/ember-mapbox-gl/actions/workflows/ci.yml?query=branch%3Amaster
[ember-observer-badge]: http://emberobserver.com/badges/@prysmex-engineering/ember-mapbox-gl.svg
[ember-observer-url]: http://emberobserver.com/addons/@prysmex-engineering/ember-mapbox-gl

Ember integration with [mapbox-gl-js](https://www.mapbox.com/mapbox-gl-js/api/).

## Installation

```sh
pnpm add @prysmex-engineering/ember-mapbox-gl mapbox-gl
```

`mapbox-gl` is a peer dependency. Its stylesheet is imported by the
`<MapboxGl>` component, so you don't need to include it yourself.

## Configuration

Global options (access token and default map, marker, popup and layer
options) live in the `mapbox-gl-config` service.

### Apps built with ember-cli (classic or Embroider compat)

Nothing changes from previous versions: the service reads the `mapbox-gl` key
from `config/environment.js` when it is created.

```javascript
module.exports = function (environment) {
  let ENV = {
    'mapbox-gl': {
      accessToken: 'ACCESS TOKEN HERE',
    },
  };
};
```

### Setting the config at runtime

You can also configure the service from code, for example in the application
route. `configure()` only replaces the keys you pass:

```ts
import Route from '@ember/routing/route';
import { service } from '@ember/service';

import type { MapboxGlConfigService } from '@prysmex-engineering/ember-mapbox-gl';

export default class ApplicationRoute extends Route {
  @service declare mapboxGlConfig: MapboxGlConfigService;

  beforeModel() {
    this.mapboxGlConfig.configure({
      accessToken: 'ACCESS TOKEN HERE',
      map: { style: 'mapbox://styles/mapbox/streets-v12' },
    });
  }
}
```

### Apps using the strict resolver (`ember-strict-application-resolver`, Vite)

Addon services are not registered automatically there, so add them to your
app's `modules`:

```ts
import { MapCacheService, MapboxGlConfigService } from '@prysmex-engineering/ember-mapbox-gl';

export default class App extends EmberApp {
  modules = {
    // ...
    './services/map-cache': MapCacheService,
    './services/mapbox-gl-config': MapboxGlConfigService,
  };
}
```

## Usage in `.gjs`/`.gts`

All components and helpers are exported from the package root:

```gjs
import { MapboxGl } from '@prysmex-engineering/ember-mapbox-gl';

<template>
  <MapboxGl as |map|>
    ...
  </MapboxGl>
</template>
```

## Compatibility

* Ember.js v5.8 or above
* Embroider or ember-auto-import v2
* Node.js v20 or above

## API Documentation
See the detailed [API Documentation](API.md).

## Example

<strong>Note:</strong> The example below uses [ember-composable-helpers](https://github.com/DockYard/ember-composable-helpers).

Add the following map options to `config/environment.js` to style the map, set a default zoom level, and to provide a default centerpoint:

```javascript
'mapbox-gl': {
  accessToken: 'ACCESS TOKEN HERE',
  map: {
    style: 'mapbox://styles/mapbox/basic-v9',
    zoom: 13,
    center: [ -96.7969879, 32.7766642 ]
  }
},
```

```javascript
import Controller from '@ember/controller';

export default Controller.extend({
  marker: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [ -96.7969879, 32.7766642 ] }
      }
    ]
  },

  actions: {
    mapClicked({ target: map, point }) {
      console.log(map, point);
    }
  }
});
```

```handlebars
{{#mapbox-gl class='map-container' initOptions=(hash pitch=30) as |map|}}
  {{map.on 'click' (action 'mapClicked')}}

  {{#map.source options=(hash type='geojson' data=marker) as |source|}}
    {{source.layer layer=(hash
      type='circle'
      paint=(hash circle-color='#007cbf' circle-radius=10))}}
  {{/map.source}}
{{/mapbox-gl}}
```

The above example does the following:

* Creates an instance of a map
* Attaches a `mapClicked` action when anywhere on the map is clicked
* Generates a geojson map source (`marker`)
* Draws a blue circle on the map at the coordinates provided by `marker`
