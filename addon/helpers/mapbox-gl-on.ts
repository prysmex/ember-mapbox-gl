import Helper from '@ember/component/helper';
import { action } from '@ember/object';
import { assert } from '@ember/debug';
import { isPresent } from '@ember/utils';
import { Map as MapboxMap, Marker } from 'mapbox-gl';

/**
 * Listen to a map event
 *
 * @class MapboxGlOnHelper
 *
 * Named arguments
 * @argument {MapboxMap|Marker} eventSource
 *
 * Positional arguments in order
 * @argument {string} event
 * @argument {string} layerId (optional)
 * @argument {string} action
 */
export default class MapboxGlOn extends Helper {
  eventSource: MapboxMap | Marker | undefined;
  _action: ((ev: any) => void) | undefined;
  _prevEvent: string | undefined;
  _prevLayerId: string | undefined;

  compute(
    [event, layerId, action]: [
      event: string,
      layerId: string | ((ev: any) => void) | undefined,
      action?: (ev: any) => void
    ],
    { eventSource }: { eventSource: MapboxMap | Marker }
  ) {
    assert('mapbox-gl-event requires an eventSource', isPresent(eventSource));
    assert(
      `mapbox-gl-event requires event to be a string, was ${event}`,
      typeof event === 'string'
    );

    // Calculate action and layerId on positonal params as layerId is optional
    if (typeof layerId === 'function') {
      action = layerId;
      layerId = undefined;
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
          // @ts-expect-error
          eventSource.off(_prevEvent, _prevLayerId, this._onEvent);
        } else {
          eventSource.off(_prevEvent, this._onEvent);
        }
      }

      this._prevEvent = event;
      this._prevLayerId = layerId;

      if (layerId) {
        // @ts-expect-error
        eventSource.on(event, layerId, this._onEvent);
      } else {
        eventSource.on(event, this._onEvent);
      }
    }
  }

    willDestroy() {
      super.willDestroy();

      const { eventSource, _prevEvent, _prevLayerId } = this;
      if (eventSource && _prevEvent) {
        if (_prevLayerId) {
          // @ts-expect-error
          eventSource.off(_prevEvent, _prevLayerId, this._onEvent);
        } else {
          eventSource.off(_prevEvent, this._onEvent);
        }
      }
    }

    @action
    _onEvent(ev: any) {
      if (this.isDestroyed || this.isDestroying) {
        return;
      }

      if (this._action) {
        this._action(ev);
      }
    }
  }
