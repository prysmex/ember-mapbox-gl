import EmberRouter from '@ember/routing/router';

import PageTitleService from 'ember-page-title/services/page-title';
import EmberApp from 'ember-strict-application-resolver';

import MapCacheService from '#src/services/map-cache.ts';
import MapboxGlConfigService from '#src/services/mapbox-gl-config.ts';

import ApplicationRoute from './routes/application.ts';

class Router extends EmberRouter {
  location = 'history';
  rootURL = '/';
}

export class App extends EmberApp {
  /**
   * Any services or anything from the addon that needs to be in the app-tree registry
   * will need to be manually specified here.
   *
   * Apps built with ember-cli (classic or Embroider compat) get the addon's
   * services registered automatically.
   */
  modules = {
    './router': Router,
    './routes/application': ApplicationRoute,
    './services/page-title': PageTitleService,
    './services/map-cache': MapCacheService,
    './services/mapbox-gl-config': MapboxGlConfigService,
    /**
     * These imports are not magic, but we do require that all entries in the
     * modules object match a ./[type]/[name] pattern.
     *
     * See: https://rfcs.emberjs.com/id/1132-default-strict-resolver
     */
    ...import.meta.glob('./templates/**/*', { eager: true }),
  };
}

Router.map(function () {});
