import Component from '@glimmer/component';
import { helper } from '@ember/component/helper';
import { hash } from '@ember/helper';

import MapboxGlOn from '@prysmex-engineering/ember-mapbox-gl/helpers/mapbox-gl-on';
import config from 'ember-get-config';

import type { MapboxGL } from '../../-private/mapbox-loader';
import type Owner from '@ember/owner';
import type { WithBoundArgs } from '@glint/template';
import type {
  LngLatLike,
  Map as MapboxMap,
  Marker,
  Popup,
  PopupOptions,
} from 'mapbox-gl';

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
 */

export interface MapboxGlPopupArgs {
  map: MapboxMap;
  MapboxGl: MapboxGL;
  initOptions?: PopupOptions;
  lngLat?: LngLatLike;
  marker?: Marker;
  onClose?: () => void;
}

export interface MapboxGlPopupYield {
  on: WithBoundArgs<typeof MapboxGlOn, 'eventSource'>;
}

export interface MapboxGlPopupSignature {
  Args: MapboxGlPopupArgs;
  Blocks: {
    default: [MapboxGlPopupYield];
  };
}

export default class MapboxGlPopupComponent extends Component<MapboxGlPopupSignature> {
  popup: Popup;
  marker: Marker | undefined;
  onClose: (() => void) | undefined;
  domContent: HTMLElement;

  constructor(owner: Owner, args: MapboxGlPopupArgs) {
    super(owner, args);

    const { initOptions, marker, map, onClose } = args;

    this.domContent = document.createElement('div');
    const options = {
      ...(config['mapbox-gl'] ?? {}).popup,
      ...initOptions,
    };

    this.popup = new args.MapboxGl.Popup(options).setDOMContent(
      this.domContent,
    );

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

  setLngLat = helper(function ([lngLat, popup, map]: [
    lngLat: LngLatLike | undefined,
    popup: Popup,
    map: MapboxMap,
  ]) {
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

  <template>
    {{this.setLngLat @lngLat this.popup @map}}
    {{#in-element this.domContent}}
      {{yield (hash on=(helper MapboxGlOn eventSource=this.popup))}}
    {{/in-element}}
  </template>
}
