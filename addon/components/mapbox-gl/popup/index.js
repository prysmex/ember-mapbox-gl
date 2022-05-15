import Component from '@glimmer/component';
import config from 'ember-get-config';
import { helper } from '@ember/component/helper';

const setLngLatHelper = helper(function ([lngLat, popup, map]) {
  if (lngLat) {
    if (popup.isOpen()) {
      popup.setLngLat(lngLat);
    } else {
      popup.remove();
      popup.addTo(map);
      popup.setLngLat(lngLat);
    }
  }
});

/**
 * Adds a [popup](https://www.mapbox.com/mapbox-gl-js/api/#popup) to the map.
 *
 * ### Example
 * ```hbs
 * <MapboxGl as |Map|>
 *   <Map.popup @lngLat={{array -96.7969879 32.7766642}}>
 *     Dallas, TX
 *   </Map.popup>
 * </MapboxGl>
 * ```
 *
 * @class MapboxGLPopup
 * @argument {Object} initOptions
 * @argument {array} lngLat
 * @argument {MapboxGlMarker} marker
 * @argument {MapboxGlInstance} map
 * @argument {function} onClose
 * @argument {MapboxGl} MapboxGl
 */
export default class MapboxGlPopupComponent extends Component {
  setLngLat = setLngLatHelper;
  marker = null;
  onClose = null;

  constructor() {
    super(...arguments);

    const { initOptions, marker, map, onClose, MapboxGl } = this.args;

    this.domContent = document.createElement('div');
    const options = {
      ...(config['mapbox-gl'] ?? {}).popup,
      ...initOptions,
    };

    this.popup = new MapboxGl.Popup(options).setDOMContent(this.domContent);

    if (onClose) {
      this.onClose = onClose;
      this.popup.on('close', onClose);
    }

    if (marker) {
      this.marker = marker;
      marker.setPopup(this.popup);
    } else {
      this.popup.addTo(map);
    }
  }

  willDestroy() {
    super.willDestroy(...arguments);

    if (this.onClose) {
      this.popup.off('close', this.onClose);
    }

    const marker = this.marker;

    if (marker === null) {
      this.popup.remove();
    } else {
      marker.setPopup(null);
    }
  }
}
