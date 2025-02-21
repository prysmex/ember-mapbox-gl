// Components
import type MapboxGl from '@prysmex-engineering/ember-mapbox-gl/components/mapbox-gl';
import type MapboxGlLayer from '@prysmex-engineering/ember-mapbox-gl/components/mapbox-gl/layer';
import type MapboxGlMarker from '@prysmex-engineering/ember-mapbox-gl/components/mapbox-gl/marker';
import type MapboxGlPopup from '@prysmex-engineering/ember-mapbox-gl/components/mapbox-gl/popup';
import type MapboxGlSource from '@prysmex-engineering/ember-mapbox-gl/components/mapbox-gl/source';
// Helpers
import type MapboxGlControl from '@prysmex-engineering/ember-mapbox-gl/helpers/mapbox-gl-control';
import type MapboxGlOn from '@prysmex-engineering/ember-mapbox-gl/helpers/mapbox-gl-on';
import type MapboxGlTerrain from '@prysmex-engineering/ember-mapbox-gl/helpers/mapbox-gl-terrain';

export default interface EmberMapboxGlRegistry {
  // Components
  MapboxGl: typeof MapboxGl;
  MapboxGlLayer: typeof MapboxGlLayer;
  MapboxGlMarker: typeof MapboxGlMarker;
  MapboxGlPopup: typeof MapboxGlPopup;
  MapboxGlSource: typeof MapboxGlSource;

  // Helpers
  'mapbox-gl-control': typeof MapboxGlControl;
  'mapbox-gl-on': typeof MapboxGlOn;
  'mapbox-gl-terrain': typeof MapboxGlTerrain;
}
