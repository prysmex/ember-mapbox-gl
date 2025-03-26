import Helper from '@ember/component/helper';
import { assert } from '@ember/debug';
import { isPresent } from '@ember/utils';

import type { Map as MapboxMap, Marker, Popup } from 'mapbox-gl';

type EventSource = MapboxMap | Popup | Marker;

export interface MapboxGlOnSignature {
  Args: {
    Positional: [event: string, action: (ev: any) => void];
    Named: { eventSource: EventSource; layerId?: string };
  };
  Return: void;
}

/**
 * Listen to a map event
 *
 * @class MapboxGlOnHelper
 *
 * Named arguments
 * @argument {EventSource} eventSource
 *
 * Positional arguments in order
 * @argument {string} event
 * @argument {string} layerId (optional)
 * @argument {string} action
 */
export default class MapboxGlOn extends Helper<MapboxGlOnSignature> {
  eventSource: EventSource | undefined;
  _action: ((ev: any) => void) | undefined;
  _prevEvent: string | undefined;
  _prevLayerId: string | undefined;

  compute(
    [event, action]: MapboxGlOnSignature['Args']['Positional'],
    { eventSource, layerId }: MapboxGlOnSignature['Args']['Named'],
  ) {
    assert('mapbox-gl-event requires an eventSource', isPresent(eventSource));
    assert(
      `mapbox-gl-event requires event to be a string, was ${event}`,
      typeof event === 'string',
    );

    // Save action for _onEvent
    assert('mapbox-gl-event requires an action', isPresent(action));
    this._action = action;

    // Save eventSource for willDestroy
    this.eventSource = eventSource;

    const { _prevEvent, _prevLayerId } = this;

    if (event !== _prevEvent || layerId !== _prevLayerId) {
      if (_prevEvent) {
        this.removeEvent(eventSource, _prevEvent, _prevLayerId);
      }

      this._prevEvent = event;
      this._prevLayerId = layerId;

      this.addEvent(eventSource, event, layerId);
    }
  }

  willDestroy() {
    super.willDestroy();

    const { eventSource, _prevEvent, _prevLayerId } = this;

    if (eventSource && _prevEvent) {
      this.removeEvent(eventSource, _prevEvent, _prevLayerId);
    }

    // Cleanup
    this.eventSource = undefined;
    this._action = undefined;
    this._prevEvent = undefined;
    this._prevLayerId = undefined;
  }

  _onEvent = (ev: any) => {
    if (this.isDestroyed || this.isDestroying) {
      return;
    }

    if (this._action) {
      this._action(ev);
    }
  };

  private addEvent(eventSource: EventSource, event: string, layerId?: string) {
    if (layerId) {
      // @ts-expect-error: on() is typed different per type of eventSource, but this is fine
      eventSource.on(event, layerId, this._onEvent);
    } else {
      // @ts-expect-error: on() is typed different per type of eventSource, but this is fine
      eventSource.on(event, this._onEvent);
    }
  }

  private removeEvent(
    eventSource: EventSource,
    event: string,
    layerId?: string,
  ) {
    if (layerId) {
      // @ts-expect-error: on() is typed different per type of eventSource, but this is fine
      eventSource.off(event, layerId, this._onEvent);
    } else {
      // @ts-expect-error: on() is typed different per type of eventSource, but this is fine
      eventSource.off(event, this._onEvent);
    }
  }
}
