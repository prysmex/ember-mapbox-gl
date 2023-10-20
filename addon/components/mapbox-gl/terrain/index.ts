import Component from '@glimmer/component';
import { assert } from '@ember/debug';
import { Map as MapboxMap } from 'mapbox-gl';

interface MapboxGlTerrainArgs {
  map: MapboxMap;
  sourceId?: string;
}

export default class MapboxGlTerrainComponent extends Component<MapboxGlTerrainArgs> {
  constructor(owner: any, args: MapboxGlTerrainArgs) {
    super(owner, args);
    assert(
      'mapbox-gl/terrain map is required',
      typeof this.args.map === 'object'
    );

    if (this.args.sourceId) {
      this.args.map.setTerrain({ source: this.args.sourceId });
    }
  }

  willDestroy() {
    super.willDestroy();
    // Null or undefined removes terrain
    this.args.map.setTerrain();
  }
}
