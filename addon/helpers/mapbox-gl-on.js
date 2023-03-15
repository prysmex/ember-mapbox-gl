import Helper from '@ember/component/helper';
import { action } from '@ember/object';
import { assert } from '@ember/debug';
import { isPresent } from '@ember/utils';

/**
 * Listen to a map event
 *
 * @class MapboxGlOnHelper
 *
 * Named arguments
 * @argument {MapboxGlInstance|MapboxGlMarker} eventSource
 *
 * Positional arguments in order
 * @argument {string} event
 * @argument {string} layerId (optional)
 * @argument {string} action
 */
export default class MapboxGlOn extends Helper {
  eventSource = null;
  _action = null;
  _prevEvent = null;
  _prevLayerId = null;

  compute([event, layerId, action], { eventSource }) {
    assert('mapbox-gl-event requires an eventSource', isPresent(eventSource));
    assert(
      `mapbox-gl-event requires event to be a string, was ${event}`,
      typeof event === 'string'
    );

    // Calculate action and layerId on positonal params as layerId is optional
    action = action || layerId;
    if (layerId === action) {
      layerId = null;
    }

    // Save action for _onEvent
    assert('mapbox-gl-event requires an action', isPresent(action));
    this._action = action;

    // Save eventSource for willDestroy
    this.eventSource = eventSource;

    const { _prevEvent, _prevLayerId } = this;

    if (event !== _prevEvent || layerId !== _prevLayerId) {
      if (_prevEvent) {
        if (_prevLayerId) {
          eventSource.off(_prevEvent, _prevLayerId, this._onEvent);
        } else {
          eventSource.off(_prevEvent, this._onEvent);
        }
      }

      this._prevEvent = event;
      this._prevLayerId = layerId;

      if (layerId) {
        eventSource.on(event, layerId, this._onEvent);
      } else {
        eventSource.on(event, this._onEvent);
      }
    }
  }

  willDestroy() {
    super.willDestroy(...arguments);

    const { eventSource, _prevEvent, _prevLayerId } = this;
    if (eventSource && _prevEvent) {
      if (_prevLayerId) {
        eventSource.off(_prevEvent, _prevLayerId, this._onEvent);
      } else {
        eventSource.off(_prevEvent, this._onEvent);
      }
    }
  }

  @action
  _onEvent() {
    if (this.isDestroyed || this.isDestroying) {
      return;
    }

    this._action(...arguments);
  }
}
