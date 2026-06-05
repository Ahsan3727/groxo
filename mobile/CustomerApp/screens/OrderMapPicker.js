import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../components/AppButton';
import api from '../services/api';
import { Colors as GlobalColors, Fonts, Radius, Shadows } from '../theme';

// Warm orange palette
const Colors = {
  primary: '#FF7F2A',
  white: '#FFFFFF',
  gray400: '#9CA3AF',
  darkest: '#3E2723',
  orangeText: '#8B4513',
  heroBg: '#FF9F43',
};

export default function OrderMapPicker({ navigation, route }) {
  const { cartItems, apiFunc } = route.params;
  const insets = useSafeAreaInsets();

  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 31.72,
    longitude: 72.98,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [landmark, setLandmark] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Get current location
  const getCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant location access to use this feature.');
        setLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const newLoc = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(newLoc);
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: newLoc.latitude,
            longitude: newLoc.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          800
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not fetch your location. Drag the pin manually.');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleMarkerDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
  };

  const handleConfirm = async () => {
    if (!location) {
      Alert.alert('No Location', 'Please drag the red pin to your delivery location.');
      return;
    }

    setLoading(true);
    try {
      await apiFunc({
        items: cartItems,
        deliveryAddress: {
          lat: location.latitude,
          lng: location.longitude,
          landmark: landmark.trim(),
        },
        payment: { method: 'cod' },
      });

      await api.put('/auth/location', { lat: location.latitude, lng: location.longitude });

      Alert.alert('Order Placed', 'Your order has been placed successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Orders') },
      ]);
    } catch (error) {
      console.error('Order error:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        showsUserLocation={false}
        toolbarEnabled={false}
      >
        {location && (
          <Marker
            coordinate={location}
            draggable
            onDragEnd={handleMarkerDragEnd}
            pinColor="red"           // <-- clean red pin, easy to drag
          />
        )}
      </MapView>

      {/* Center hint (if no location yet) */}
      {!location && !locating && (
        <View style={styles.centerHint}>
          <Text style={styles.centerHintText}>📍 Drag the map to set your delivery location</Text>
        </View>
      )}

      {/* Re‑center GPS button */}
      <TouchableOpacity
        style={[styles.locateButton, { top: insets.top + 20 }]}
        onPress={getCurrentLocation}
        disabled={locating}
        activeOpacity={0.8}
      >
        {locating ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Text style={styles.locateButtonText}>📍 My Location</Text>
        )}
      </TouchableOpacity>

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 20 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>

      {/* Bottom card */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.instructionText}>
          Drag the <Text style={{ fontWeight: '800', color: Colors.primary }}>red pin</Text> to your exact delivery spot
        </Text>
        <TextInput
          style={styles.landmarkInput}
          placeholder="Landmark (e.g., Near Jamia Masjid)"
          placeholderTextColor={Colors.gray400}
          value={landmark}
          onChangeText={setLandmark}
        />
        <AppButton
          title={loading ? 'Placing Order...' : 'Confirm Location & Place Order'}
          onPress={handleConfirm}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  centerHint: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  centerHintText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  locateButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  locateButtonText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  backBtnText: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  instructionText: {
    fontSize: 15,
    color: Colors.darkest,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  landmarkInput: {
    borderWidth: 1.5,
    borderColor: '#FFD0B5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#FFF6F0',
    color: Colors.darkest,
  },
});