import Component from '@glimmer/component';
import { scheduleOnce } from '@ember/runloop';
import { guidFor } from '@ember/object/internals';
import { helper } from '@ember/component/helper';
import { action } from '@ember/object';

const onUpdateArgsHelper = helper(function ([updateSource, options]) {
  // Raster sources can't update
  if (options.type !== 'raster') {
    updateSource(options);
  }
});

/**
 * Adds a data source to the map. The API matches the mapbox [source docs](https://www.mapbox.com/mapbox-gl-js/api/#sources).
 *
 * Example:
 * ```hbs
 *  <MapboxGl as |Map|>
 *    <Map.source @options={{hash
 *      type='geojson'
 *      data=(hash
 *        type='FeatureCollection'
 *        features=(array
 *          (hash
 *            type='Feature'
 *            geometry=(hash
 *              type='Point'
 *              coordinates=(array -96.7969879 32.7766642)
 *            )
 *          )
 *        )
 *      )
 *    }}
 *    as |Source|>
 *
 *    </Map.source>
 *  </MapboxGl>
 * ```
 *
 * @class MapboxGLSource
 *
 * An options hash to set as the source.
 * - #### `options.type`
 *   - A string detailing the map source type. Typically `geojson`.
 *
 * - #### `options.data`
 *   - A data hash for the map, following the source.data API detailed by mapbox docs.
 * @argument {Object} options
 *
 * The ID of the source to add. Must not conflict with existing sources.
 * {@link https://www.mapbox.com/mapbox-gl-js/api/#map#addsource Mapbox}
 * @argument {string} sourceId
 */
export default class MapboxGlComponentSource extends Component {
  onUpdateArgs = onUpdateArgsHelper;
  _skipUpdate = false;

  get sourceId() {
    return this.args.sourceId ?? guidFor(this);
  }

  constructor() {
    super(...arguments);

    this.updateSource(this.args.options);
    // Skip the first udpate of the helper
    this._skipUpdate = true;
  }

  @action
  updateSource(options) {
    if (!this._skipUpdate) {
      console.log('running: source updateSource helper');
      if (!this.args.map.getSource(this.sourceId)) {
        if (options?.type === 'geojson' && !options.data) {
          /*
            This allows you to send data as null without causing an error in first render.
            Subsecuent renders only unhide the layer, so if data is required by an
            if helper in the template, the layer won't be unhidden until the data has been loaded
          */
          options.data = { type: 'FeatureCollection', features: [] };
        }
        this.args.map.addSource(this.sourceId, options);
      } else {
        if (options?.data) {
          this.args.map.getSource(this.sourceId).setData(options.data);
        } else if (options?.coordinates) {
          this.args.map
            .getSource(this.sourceId)
            .setCoordinates(options.coordinates);
        } else if (options?.type === 'vector') {
          // For vector source type
          this.args.map.getSource(this.sourceId).setTiles(options.tiles);
        }
      }
    }
    this._skipUpdate = false;
  }

  willDestroy() {
    super.willDestroy(...arguments);

    if (!this.args.cacheKey) {
      // wait for any layers to be removed before removing the source
      scheduleOnce(
        'afterRender',
        this.args.map,
        this.args.map.removeSource,
        this.sourceId
      );
    }
  }
}
