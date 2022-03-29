import Helper from '@ember/component/helper';
import { assert } from '@ember/debug';
import { cancel, scheduleOnce } from '@ember/runloop';

/**
 * A component used to call a specific Mapbox GL method.
 *
 * @class MapboxGlCallHelper
 *
 * Named arguments
 * @argument {MapboxGlInstance} map
 * May be the first positional arg
 * @argument {function} func
 * May be positional arg
 * @argument {array} args
 * Action to be called with the response of the function
 * @argument {function} onResp
 *
 * Positional arguments in order
 * @argument {function} func (optional)
 * @argument {any} args (Any amount of arguments)
 */
export default class MapboxGlCall extends Helper {
  onResp = null;
  _scheduledCall = null;

  compute(params, { map, func, args, onResp }) {
    assert('mapbox-gl-call map is required', typeof map === 'object');

    if (args === undefined && params.length > 0) {
      if (func !== undefined) {
        args = params.toArray();
      } else {
        [func, ...args] = params.toArray();
      }
    }

    assert(
      'mapbox-gl-call func is required and must be a string',
      typeof func === 'string'
    );

    assert(
      `mapbox-gl-call ${func} must be a function on ${map}`,
      typeof map[func] === 'function'
    );

    if (typeof onResp === 'function') {
      this.onResp = onResp;
    }

    this._scheduledCall = scheduleOnce(
      'afterRender',
      this,
      this._call,
      map,
      func,
      args
    );
  }

  willDestroy() {
    super.willDestroy(...arguments);

    if (this._scheduledCall !== null) {
      cancel(this._scheduledCall);
    }
  }

  _call(map, func, args) {
    this._scheduledCall = null;

    this.onResp(map[func].apply(map, args));
  }
}
