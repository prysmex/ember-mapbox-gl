import Helper from '@ember/component/helper';
import { guidFor } from '@ember/object/internals';

import type { Map as MapboxMap } from 'mapbox-gl';
import type {
  RasterDEMSourceSpecification,
  TerrainSpecification,
} from 'mapbox-gl';

export interface MapboxGlTerrainSignature {
  Args: {
    Positional: [
      Partial<RasterDEMSourceSpecification>?,
      Partial<TerrainSpecification>?,
    ];
    Named: { map: MapboxMap; sourceId?: string };
  };
  Return: void;
}

/**
 * Helper to add and manage terrain on a Mapbox map instance.
 *
 * This helper allows the addition of a raster DEM source and configuration
 * of terrain settings on a provided MapboxMap instance. It ensures proper
 * cleanup of resources when the helper is destroyed.
 *
 * @class MapboxGlTerrainHelper
 *
 * Positional arguments:
 * @argument {Partial<RasterDEMSourceSpecification>} [sourceSpec] - The source specification for the raster DEM. Optional.
 * @argument {Partial<TerrainSpecification>} [terrainSpec] - The terrain specification. Optional.
 *
 * Named arguments:
 * @argument {MapboxMap} map - The MapboxMap instance where terrain is added.
 * @argument {string} [sourceId] - Optional identifier for the terrain source. Defaults to a unique identifier.
 */
export default class MapboxGlTerrain extends Helper<MapboxGlTerrainSignature> {
  private sourceId: string = guidFor(this);
  private map?: MapboxMap;

  compute(
    [
      sourceSpec,
      terrainSpec,
    ]: MapboxGlTerrainSignature['Args']['Positional'] = [],
    { map, sourceId }: MapboxGlTerrainSignature['Args']['Named'],
  ) {
    // Use provided sourceId or default to a unique identifier
    this.sourceId = sourceId ?? this.sourceId;
    this.map = map;

    // Merge with default source specification
    const sourceSpecification: RasterDEMSourceSpecification = {
      ...sourceSpec,
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
    };

    const terrainSpecification: TerrainSpecification = {
      ...terrainSpec,
      source: this.sourceId,
    };

    this.addTerrain(sourceSpecification, terrainSpecification);
  }

  private addTerrain(
    sourceSpecification: RasterDEMSourceSpecification,
    terrainSpecification: TerrainSpecification,
  ) {
    if (!this.map) {
      return;
    }

    // Add source to the map if it doesn't already exist
    if (!this.map.getSource(this.sourceId)) {
      this.map.addSource(this.sourceId, sourceSpecification);
    }

    // Set terrain on the map
    this.map.setTerrain(terrainSpecification);
  }

  willDestroy() {
    super.willDestroy();

    // Clean up source and terrain when the helper is destroyed
    if (this.map) {
      if (this.map.getTerrain()) {
        this.map.setTerrain(null);
      }

      this.map.removeSource(this.sourceId);
    }
  }
}
