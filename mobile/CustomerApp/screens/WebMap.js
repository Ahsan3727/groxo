import React, { useEffect } from 'react';
import { View } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export default function WebMap({ location, onMapReady }) {
  if (!location) return null;

  const position = [location.latitude, location.longitude];

  // Custom icon (shopping cart)
  const icon = L.divIcon({
    html: `<div style="font-size:28px; background:transparent;">🛒</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        whenReady={(mapInstance) => {
          if (onMapReady) onMapReady(mapInstance.target);
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={position} icon={icon}>
          <Popup>You are here</Popup>
        </Marker>
      </MapContainer>
    </View>
  );
}