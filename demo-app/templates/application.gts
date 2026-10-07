import { array, hash } from '@ember/helper';

import { pageTitle } from 'ember-page-title';

import MapboxGl from '#src/components/mapbox-gl/index.gts';

import type { MapMouseEvent } from 'mapbox-gl';

const dallas = [-96.7969879, 32.7766642] as [number, number];

const points = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [-96.85, 32.8] },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [-96.74, 32.75] },
    },
  ],
} as const;

const onClick = (ev: MapMouseEvent) => {
  console.log('onClick', ev.lngLat);
};

<template>
  {{pageTitle "ember-mapbox-gl"}}

  <h1>ember-mapbox-gl</h1>

  <MapboxGl @initOptions={{hash pitch=30}} as |map|>
    {{map.on "click" onClick}}

    <map.source @options={{hash type="geojson" data=points}} as |source|>
      <source.layer
        @layer={{hash
          type="circle"
          paint=(hash circle-color="#007cbf" circle-radius=10)
        }}
      />
    </map.source>

    <map.marker @lngLat={{dallas}} as |marker|>
      <marker.popup>
        Dallas, TX
      </marker.popup>
    </map.marker>

    <map.popup @lngLat={{array -96.9 32.7}}>
      A standalone popup
    </map.popup>
  </MapboxGl>
</template>
