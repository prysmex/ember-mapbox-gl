// Components
import type MapboxGl from './components/mapbox-gl/index.gts';
import type MapboxGlLayer from './components/mapbox-gl/layer.gts';
import type MapboxGlMarker from './components/mapbox-gl/marker.gts';
import type MapboxGlPopup from './components/mapbox-gl/popup.gts';
import type MapboxGlSource from './components/mapbox-gl/source.gts';
// Helpers
import type MapboxGlControl from './helpers/mapbox-gl-control.ts';
import type MapboxGlOn from './helpers/mapbox-gl-on.ts';
import type MapboxGlTerrain from './helpers/mapbox-gl-terrain.ts';

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
