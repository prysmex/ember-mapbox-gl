import EmberRouter from '@ember/routing/router';
import { setApplication } from '@ember/test-helpers';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import { setupEmberOnerrorValidation, start as qunitStart } from 'ember-qunit';
import { setTesting } from '@embroider/macros';

import EmberApp from 'ember-strict-application-resolver';

import MapCacheService from '#src/services/map-cache.ts';
import MapboxGlConfigService from '#src/services/mapbox-gl-config.ts';

import config, { ACCESS_TOKEN } from './helpers/config.ts';

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

class TestApp extends EmberApp {
  modules = {
    './router': Router,
    './config/environment': config,
    // v2 addon services are not auto-registered under the strict resolver
    './services/map-cache': MapCacheService,
    './services/mapbox-gl-config': MapboxGlConfigService,
  };
}

Router.map(function () {});

export function start() {
  if (!ACCESS_TOKEN) {
    throw new Error(
      'VITE_MAPBOX_ACCESS_TOKEN is not set. Export it or add it to .env.development.local (see CONTRIBUTING.md).',
    );
  }

  setTesting(true);
  setApplication(
    TestApp.create({
      autoboot: false,
      rootElement: '#ember-testing',
    }),
  );
  setup(QUnit.assert);
  setupEmberOnerrorValidation();
  qunitStart();
}
