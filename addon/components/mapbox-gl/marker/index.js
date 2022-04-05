import Component from '@glimmer/component';
import { assert } from '@ember/debug';
import config from 'ember-get-config';
import { helper } from '@ember/component/helper';

const setLngLatHelper = helper(function ([lngLat, marker]) {
  assert('mapbox-gl.marker requires lngLat, maybe you passed latLng?', lngLat);

  // TODO: Prevent setting the lngLat two times at initialization, at the constructor and here
  marker.setLngLat(lngLat);
});

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
export default class MapboxGlMarkerComponent extends Component {
  setLngLat = setLngLatHelper;

  constructor() {
    super(...arguments);

    const { lngLat, initOptions, MapboxGl, map, classes } = this.args;
    this.domContent = document.createElement('div');
    this.domContent.classList.add(classes);

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
    super.willDestroy(...arguments);

    this.marker.remove();
  }
}
