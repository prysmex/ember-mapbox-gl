import Component from '@glimmer/component';
import { assert } from '@ember/debug';
import config from 'ember-get-config';
import { helper } from '@ember/component/helper';
import { Map as MapboxMap, Marker, MarkerOptions, LngLatLike } from 'mapbox-gl';
import { MapboxGL } from '../../../-private/mapbox-loader';

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

const setLngLatHelper = helper(function ([lngLat, marker]: [lngLat: LngLatLike, marker: Marker]) {
  assert('mapbox-gl.marker requires lngLat, maybe you passed latLng?', lngLat);

  // TODO: Prevent setting the lngLat two times at initialization, at the constructor and here
  return marker.setLngLat(lngLat);
});

interface MapboxGlMarkerArgs {
  map: MapboxMap;
  MapboxGl: MapboxGL;
  initOptions?: MarkerOptions;
  lngLat?: LngLatLike;
  classes?: string;
}

export default class MapboxGlMarkerComponent extends Component<MapboxGlMarkerArgs> {
  setLngLat = setLngLatHelper;
  marker: Marker;
  domContent: HTMLElement;

  constructor(owner: any, args: MapboxGlMarkerArgs) {
    super(owner, args);

    const { lngLat, initOptions, MapboxGl, map, classes } = args;
    this.domContent = document.createElement('div');
    if (classes) {
      this.domContent.classList.add(classes);
    }

    assert(
      'mapbox-gl.marker requires lngLat, maybe you passed latLng?',
      lngLat
    );

    const options = {
      ...(config['mapbox-gl'] ?? {}).marker,
      ...initOptions,
    };

    options.element = this.domContent;

    this.marker = new MapboxGl.Marker(options).setLngLat(lngLat).addTo(map);
  }

  willDestroy() {
    super.willDestroy();

    this.marker.remove();
  }
}
