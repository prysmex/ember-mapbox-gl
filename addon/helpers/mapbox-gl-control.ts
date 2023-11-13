import Helper from '@ember/component/helper';
import { assert } from '@ember/debug';
import { Map as MapboxMap, IControl, Control } from 'mapbox-gl';

/**
 * Add a map control
 *
 * @class MapboxGlControlHelper
 *
 * Named arguments
 * @argument {MapboxGlInstance} map
 * @argument {boolean} [cache=false]
 * @argument {string} idName
 *
 * Positional arguments in order
 * @argument {string} control
 * @argument {'top-left'|'top-right'|'bottom-left'|'bottom-right'} position
 */
export default class MapboxGlControl extends Helper {
  map: MapboxMap | undefined;
  cache = false;
  idName: string | undefined;
  _prevControl: IControl | Control | undefined;

  compute(
    [control, position]: [
      IControl | Control,
      'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    ],
    {
      map,
      cache,
      idName,
    }: { map: MapboxMap; cache?: boolean, idName?: string }
  ) {
    assert('mapbox-gl-call map is required', typeof map === 'object');
    this.map = map;
    this.cache = cache ?? false;
    this.idName = idName;

    assert(
      'Need to pass idName if control is meant to be cached',
      !this.cache || idName
    );

    if (this._prevControl === undefined && this.cache) {
      // Get _prevControl if there is one present in the map instance
      this._prevControl =
        // @ts-expect-error
        this.map._controls.find((c) => c.idName == idName) ?? null;
      if (this._prevControl) {
        // Unhide if it was hidden
        // @ts-expect-error
        this._prevControl._container.classList.remove('hide');
        return;
      }
    }

    if (this._prevControl) {
      this.map.removeControl(this._prevControl);
    }

    if (control) {
      if (idName) {
        // @ts-expect-error
        control.idName = this.idName;
      }
      this.map.addControl(control, position);
      this._prevControl = control;
    } else {
      this._prevControl = undefined;
    }
  }

  willDestroy() {
    super.willDestroy();

    if (this._prevControl !== undefined) {
      if (this.cache) {
        // Hide the control instead of removing it
        // @ts-expect-error
        this._prevControl._container.classList.add('hide');
      } else {
        this.map?.removeControl(this._prevControl);
      }
    }
  }
}
