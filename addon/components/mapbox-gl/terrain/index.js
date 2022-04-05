import Component from '@glimmer/component';
import { assert } from '@ember/debug';

export default class MapboxGlTerrainComponent extends Component {
  constructor() {
    super(...arguments);
    assert(
      'mapbox-gl/terrain map is required',
      typeof this.args.map === 'object'
    );
    if (this.args.sourceId) {
      return this.args.map.setTerrain({ source: this.sourceId });
    }
  }

  willDestroy() {
    super.willDestroy(...arguments);
    // Null or undefined removes terrain
    this.args.map.setTerrain();
  }
}
