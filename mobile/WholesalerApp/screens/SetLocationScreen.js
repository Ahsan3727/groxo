import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LiveMap from '../components/LiveMap';
import { Colors } from '../theme/theme';

export default function SetLocationScreen({ navigation }) {
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.2090 });

  const handleConfirm = () => {
    // In real app, save to backend
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LiveMap region={{ latitude: location.lat, longitude: location.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }} />
      <View style={styles.overlay}>
        <Text>Current Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</Text>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1 },
  overlay: { position:'absolute', bottom:30, left:20, right:20, backgroundColor:Colors.white, padding:20, borderRadius:12, elevation:5 },
  confirmBtn: { backgroundColor:Colors.primary, padding:14, borderRadius:8, alignItems:'center', marginTop:12 },
  confirmText: { color:Colors.white, fontWeight:'bold' }
});
