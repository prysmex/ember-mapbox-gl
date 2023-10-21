import Component from '@glimmer/component';
import config from 'ember-get-config';
import { helper } from '@ember/component/helper';
import { Map as MapboxMap, Popup, PopupOptions, Marker, LngLatLike } from 'mapbox-gl';
import { MapboxGL } from '../../../-private/mapbox-loader';

const setLngLatHelper = helper(function ([lngLat, popup, map]: [lngLat: LngLatLike, popup: Popup, map: MapboxMap]) {
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

interface MapboxGlPopupArgs {
  map: MapboxMap;
  MapboxGl: MapboxGL;
  initOptions?: PopupOptions;
  lngLat?: LngLatLike;
  marker?: Marker;
  onClose?: () => void;
}

export default class MapboxGlPopupComponent extends Component<MapboxGlPopupArgs> {
  setLngLat = setLngLatHelper;
  popup: Popup;
  marker: Marker | undefined;
  onClose: (() => void) | undefined;
  domContent: HTMLElement;

  constructor(owner: any, args: MapboxGlPopupArgs) {
    super(owner, args);

    const { initOptions, marker, map, onClose, MapboxGl } = args;

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
    super.willDestroy();

    if (this.onClose) {
      this.popup.off('close', this.onClose);
    }

    const marker = this.marker;

    if (marker === undefined) {
      this.popup.remove();
    } else {
      marker.setPopup(undefined);
    }
  }
}
