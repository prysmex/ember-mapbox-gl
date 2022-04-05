import Helper from '@ember/component/helper';
import { assert } from '@ember/debug';

/**
 * Add a map control
 *
 * @class MapboxGlControlHelper
 *
 * Named arguments
 * @argument {MapboxGlInstance} map
 * @argument {string} cacheKey
 * @argument {string} idName
 *
 * Positional arguments in order
 * @argument {string} control
 * @argument {'top-left'|'top-right'|'bottom-left'|'bottom-right'} position
 */
export default class MapboxGlControl extends Helper {
  map = null;
  cacheKey = null;
  idName = null;
  _prevControl = null;

  compute([control, position], { map, cacheKey, idName }) {
    assert('mapbox-gl-call map is required', typeof map === 'object');
    this.map = map;
    this.cacheKey = cacheKey;
    this.idName = idName;

    assert(
      'Need to pass idName if control is meant to be cached',
      !cacheKey || idName
    );

    if (this._prevControl === null && cacheKey) {
      // Get _prevControl if there is one present in the map instance
      this._prevControl =
        this.map._controls.find((c) => c.idName == idName) ?? null;
      if (this._prevControl) {
        // Unhide if it was hidden
        this._prevControl._container.classList.remove('hide');
        return;
      }
    }

    if (this._prevControl !== null) {
      this.map.removeControl(this._prevControl);
    }

    if (control) {
      if (idName) {
        control.idName = this.idName;
      }
      this.map.addControl(control, position);
      this._prevControl = control;
    } else {
      this._prevControl = null;
    }
  }

  willDestroy() {
    super.willDestroy(...arguments);

    if (this._prevControl !== null) {
      if (this.cacheKey) {
        this._prevControl._container.classList.add('hide');
      } else {
        this.map.removeControl(this._prevControl);
      }
    }
  }
}
