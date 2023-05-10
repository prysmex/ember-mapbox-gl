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
      this.args.map.setTerrain({ source: this.args.sourceId });
    }
  }

  willDestroy() {
    super.willDestroy(...arguments);
    // Null or undefined removes terrain
    this.args.map.setTerrain();
  }
}
