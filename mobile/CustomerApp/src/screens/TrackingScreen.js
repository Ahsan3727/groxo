import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../shared/constants/colors';
import API from '../../shared/services/api';
import { useSocket } from '../../shared/hooks/useSocket';
import GroxoMapView from '../../shared/components/MapView';

const TrackingScreen = ({ route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);

  useEffect(() => {
    API.get(`/orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch(console.log);
  }, [orderId]);

  useSocket('rider_location', (data) => {
    if (data.riderId === order?.rider?._id)
      setRiderLocation({ lat: data.lat, lng: data.lng });
  });

  return (
    <View style={styles.container}>
      <GroxoMapView
        region={
          riderLocation
            ? {
                latitude: riderLocation.lat,
                longitude: riderLocation.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : undefined
        }
        markers={
          riderLocation
            ? [
                {
                  coordinate: {
                    latitude: riderLocation.lat,
                    longitude: riderLocation.lng,
                  },
                  title: 'Rider',
                },
              ]
            : []
        }
      />
      <View style={styles.infoPanel}>
        <Text style={styles.status}>Status: {order?.status}</Text>
        <Text style={styles.eta}>Estimated arrival: 10 mins</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  infoPanel: {
    backgroundColor: colors.card,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    elevation: 5,
  },
  status: { fontWeight: 'bold', fontSize: 18 },
  eta: { marginTop: 8, color: colors.textSecondary },
});

export default TrackingScreen;
