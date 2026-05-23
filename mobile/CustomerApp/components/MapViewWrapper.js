import { Platform } from 'react-native';

// Native: use react-native-maps
let NativeMapView, NativeMarker;
if (Platform.OS !== 'web') {
  NativeMapView = require('react-native-maps').default;
  NativeMarker = require('react-native-maps').Marker;
}

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function MapViewWrapper({ style, region, children, mapRef, ...rest }) {
  if (Platform.OS !== 'web') {
    return (
      <NativeMapView
        ref={mapRef}
        style={style}
        initialRegion={region}
        showsUserLocation={false}
        toolbarEnabled={false}
        {...rest}
      >
        {children}
      </NativeMapView>
    );
  }

  // Web: Leaflet
  const { MapContainer, TileLayer, useMap } = require('react-leaflet');
  const L = require('leaflet');
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (map && region) {
      map.flyTo([region.latitude, region.longitude], 15, { duration: 1.5 });
    }
  }, [region, map]);

  useEffect(() => {
    if (mapRef && map) {
      mapRef.current = map;
    }
  }, [map, mapRef]);

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <MapContainer
        center={[region?.latitude || 0, region?.longitude || 0]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        whenReady={(mapInstance) => setMap(mapInstance.target)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {children}
      </MapContainer>
    </View>
  );
}

export function MapMarker({ coordinate, title, description, children }) {
  if (Platform.OS !== 'web') {
    return (
      <NativeMarker coordinate={coordinate} title={title} description={description}>
        {children}
      </NativeMarker>
    );
  }

  const { Marker: LeafletMarker, Popup } = require('react-leaflet');
  const L = require('leaflet');

  const icon = L.divIcon({
    className: '',
    html: `<div style="font-size:28px; background:transparent;">🛒</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  return (
    <LeafletMarker position={[coordinate.latitude, coordinate.longitude]} icon={icon}>
      {title && (
        <Popup>
          <b>{title}</b>
          {description && <p>{description}</p>}
        </Popup>
      )}
    </LeafletMarker>
  );
}