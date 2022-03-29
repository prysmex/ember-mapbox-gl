import Helper from '@ember/component/helper';
import { assert } from '@ember/debug';
import { action } from '@ember/object';
import noop from 'ember-mapbox-gl/utils/noop';

/**
 * Adds an image for use in the map, see [here](https://www.mapbox.com/mapbox-gl-js/api/#map#addimage).
 *
 * @class MapboxGlImageHelper
 *
 * ### Example
 * ```hbs
 * <MapboxGl as |Map|>
 *   {{Map.image 'cat' '/assets/cat.png' width=48 height=48}}
 * </MapboxGl>
 * ```
 *
 * Named arguments
 * @argument {MapboxGlInstance} map
 * The width of the image in pixels.
 * @argument {int} width
 * The height of the image in pixels.
 * @argument {int} height
 * @argument {function} onError
 * @argument {function} onLoad
 *
 * Positional arguments in order
 *
 * The unique name for the image. The name will be referenced in a source layer as the `icon-image`.
 * Reference [layers-symbol](https://www.mapbox.com/mapbox-gl-js/style-spec/#layers-symbol) for more details.
 * @argument {string} name
 * The path to your image, typically `/assets/<some_image>`.
 * @argument {string} imagePath
 * @argument {object} options
 */
export default class MapboxGlImage extends Helper {
  map = null;

  name = null;
  imagePath = null;
  options = null;

  onLoad = noop;
  onError = noop;

  _prevName = null;
  _imageSet = false;

  isSvg(image) {
    if (image === null || typeof image !== 'string') {
      return false;
    }

    return /\.svg$/.test(image);
  }

  compute([name, imagePath, options], { map, width, height, onError, onLoad }) {
    assert('mapbox-gl-call map is required', typeof map === 'object');
    this.map = map;
    this.name = name;
    this.imagePath = imagePath;
    this.options = options;
    this.onError = onError;
    this.onLoad = onLoad;

    if (this._prevName !== null) {
      map.removeImage(this._prevName);
      this._prevName = null;
      this._imageSet = false;
    }

    if (imagePath === null) {
      return;
    }

    if (this.isSvg(imagePath)) {
      const img = new Image();
      if (width !== null) {
        img.width = width;
      }

      if (height !== null) {
        img.height = height;
      }

      img.onload = this._onImage(imagePath, null, img);
      img.onerror = this._onSvgErr(imagePath);
      img.src = imagePath;
    } else {
      map.loadImage(imagePath, this._onImage(imagePath));
    }
  }

  willDestroy() {
    super.willDestroy(...arguments);

    if (this._imageSet === true) {
      this.map.removeImage(this._prevName);
    }
  }

  @action
  _onImage(imagePath, err, image) {
    if (this.isDestroyed || this.isDestroying) {
      return;
    }

    if (this.imagePath !== imagePath) {
      // image has changed since we started loading
      return;
    }

    if (err) {
      return this.onError(err);
    }

    const { name, options } = this;

    // map#addImage doesn't like null for options, only undefined or an object
    if (options === null) {
      this.map.addImage(name, image);
    } else {
      this.map.addImage(name, image, options);
    }

    this._prevName = name;
    this._imageSet = true;

    this.onLoad();
  }

  @action
  _onSvgErr(imagePath, ev) {
    const err = new Error('failed to load svg');
    err.ev = ev;
    this._onImage(imagePath, err);
  }
}
