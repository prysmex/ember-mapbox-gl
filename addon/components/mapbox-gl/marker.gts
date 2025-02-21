import Component from '@glimmer/component';
import { helper } from '@ember/component/helper';
import { assert } from '@ember/debug';
import { hash } from '@ember/helper';

import MapboxGlPopup from '@prysmex-engineering/ember-mapbox-gl/components/mapbox-gl/popup';
import config from 'ember-get-config';

import type { MapboxGL } from '../../-private/mapbox-loader';
import type Owner from '@ember/owner';
import type { WithBoundArgs } from '@glint/template';
import type {
  LngLatLike,
  Map as MapboxMap,
  Marker,
  MarkerOptions,
} from 'mapbox-gl';

/**
 * User interface elements that can be added to the map. The items in this section exist
 * outside of the map's canvas element.
 *
 * @class MapboxGlMarker
 * @argument {Object} initOptions
 * @argument {array} lngLat
 * @argument {MapboxGl} MapboxGl
 * @argument {MapboxGInstance} map
 */

export interface MapboxGlMarkerArgs {
  map: MapboxMap;
  MapboxGl: MapboxGL;
  initOptions?: MarkerOptions;
  lngLat: LngLatLike;
  classes?: string;
}

export interface MapboxGlMarkerYield {
  popup: WithBoundArgs<typeof MapboxGlPopup, 'marker'>;
}

export interface MapboxGlMarkerSignature {
  Args: MapboxGlMarkerArgs;
  Blocks: {
    default: [MapboxGlMarkerYield];
  };
}

export default class MapboxGlMarkerComponent extends Component<MapboxGlMarkerSignature> {
  marker: Marker;
  domContent: HTMLElement;

  constructor(owner: Owner, args: MapboxGlMarkerArgs) {
    super(owner, args);

    const { lngLat, initOptions, map, classes } = args;
    this.domContent = document.createElement('div');
    if (classes) {
      this.domContent.classList.add(classes);
    }

    assert('lngLat is required for the marker component', lngLat);

    const options = {
      ...(config['mapbox-gl'] ?? {}).marker,
      ...initOptions,
    };

    options.element = this.domContent;

    this.marker = new args.MapboxGl.Marker(options)
      .setLngLat(lngLat)
      .addTo(map);
  }

  willDestroy() {
    super.willDestroy();

    this.marker.remove();
  }

  setLngLat = helper(function ([lngLat, marker]: [
    lngLat: LngLatLike,
    marker: Marker,
  ]) {
    // TODO: Prevent setting the lngLat two times at initialization, at the constructor and here
    marker.setLngLat(lngLat);
  });

  <template>
    {{this.setLngLat @lngLat this.marker}}
    {{#in-element this.domContent}}
      {{yield (hash popup=(component MapboxGlPopup marker=this.marker))}}
    {{/in-element}}
  </template>
}
