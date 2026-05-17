import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const HubMap = () => {
  const riders = [
    { id:1, name:'Rider 1', lat:28.6139, lng:77.2090 },
    { id:2, name:'Rider 2', lat:28.6129, lng:77.2190 },
  ];

  return (
    <div>
      <h2>Hub Map</h2>
      <MapContainer center={[28.6139, 77.2090]} zoom={13} style={{ height:'500px', width:'100%', marginTop:16 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {riders.map(rider => (
          <Marker key={rider.id} position={[rider.lat, rider.lng]}>
            <Popup>{rider.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default HubMap;
