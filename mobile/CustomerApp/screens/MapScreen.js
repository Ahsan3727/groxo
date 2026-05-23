import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';

// ---------- Native map components (only on iOS/Android) ----------
let NativeMapView, NativeMarker;
if (Platform.OS !== 'web') {
  NativeMapView = require('react-native-maps').default;
  NativeMarker = require('react-native-maps').Marker;
}

// ---------- Location ----------
import * as Location from 'expo-location';

// ---------- Web map dependencies (Leaflet, loaded only when needed) ----------
import 'leaflet/dist/leaflet.css';

export default function MapScreen({ navigation }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mapRef = useRef(null);      // native
  const webMapRef = useRef(null);   // Leaflet map instance

  // ---------- Acquire and watch location ----------
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLoading(false);
        },
        () => {
          setPermissionDenied(true);
          setLoading(false);
        },
        { enableHighAccuracy: true }
      );
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setCurrentLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        null,
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }

    // Native flow
    let isMounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (isMounted) { setPermissionDenied(true); setLoading(false); }
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (isMounted) setCurrentLocation(loc.coords);
      } catch (e) { console.error(e); } finally { if (isMounted) setLoading(false); }

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 5 },
        (newLoc) => { if (isMounted) setCurrentLocation(newLoc.coords); }
      );
      return () => { sub.remove(); isMounted = false; };
    })();

    return () => { isMounted = false; };
  }, []);

  // ---------- Center on user ----------
  const centerOnUser = () => {
    if (!currentLocation) return;
    if (Platform.OS === 'web' && webMapRef.current) {
      webMapRef.current.flyTo([currentLocation.latitude, currentLocation.longitude], 16, { duration: 1.5 });
    } else if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  // ---------- Loading state ----------
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.statusText}>Finding your location…</Text>
      </View>
    );
  }

  // ---------- Permission denied ----------
  if (permissionDenied) {
    return (
      <View style={styles.centered}>
        <Text style={styles.deniedTitle}>Location Permission Required</Text>
        <Text style={styles.deniedMessage}>Please enable location access to see your position on the map.</Text>
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.permissionBtn} onPress={() => Linking.openSettings()}>
            <Text style={styles.permissionBtnText}>Open Settings</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------- Helper: custom Leaflet icon (only used on web) ----------
  const createLeafletIcon = () => {
    if (Platform.OS !== 'web') return null;
    const L = require('leaflet');
    return L.divIcon({
      html: `<div style="font-size:28px; background:transparent;">🛒</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  };

  // ---------- Render ----------
  return (
    <View style={styles.container}>
      {/* ===== WEB MAP ===== */}
      {Platform.OS === 'web' && currentLocation && (
        <WebMapInstance
          location={currentLocation}
          onMapReady={(map) => { webMapRef.current = map; }}
          icon={createLeafletIcon()}
        />
      )}

      {/* ===== NATIVE MAP ===== */}
      {Platform.OS !== 'web' && (
        <NativeMapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation?.latitude || 0,
            longitude: currentLocation?.longitude || 0,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={false}
          toolbarEnabled={false}
        >
          {currentLocation && (
            <NativeMarker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="You are here"
            >
              <View style={styles.markerBox}>
                <Text style={styles.markerIcon}>🛒</Text>
              </View>
            </NativeMarker>
          )}
        </NativeMapView>
      )}

      {/* ===== HEADER (always on top) ===== */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Location</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ===== CENTER BUTTON ===== */}
      <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
        <Text style={styles.centerBtnIcon}>📍</Text>
      </TouchableOpacity>
    </View>
  );
}

function WebMapInstance({ location, onMapReady, icon }) {
  const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
  const position = [location.latitude, location.longitude];
  const mapRef = useRef(null);

  useEffect(() => {
    // Fix Leaflet aria-hidden warning by setting proper ARIA attributes
    if (mapRef.current) {
      const container = mapRef.current.getContainer();
      if (container) {
        container.removeAttribute('aria-hidden');
        container.setAttribute('role', 'application');
        container.setAttribute('aria-label', 'Map showing your current location');
      }
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        ref={mapRef}
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        whenReady={(mapInstance) => {
          if (onMapReady) onMapReady(mapInstance.target);
          // Also fix ARIA when map is ready
          const container = mapInstance.target.getContainer();
          if (container) {
            container.removeAttribute('aria-hidden');
            container.setAttribute('role', 'application');
            container.setAttribute('aria-label', 'Map showing your current location');
          }
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

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  statusText: { marginTop: 12, fontSize: 16, color: '#666' },
  deniedTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  deniedMessage: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 20 },
  permissionBtn: { backgroundColor: '#2196F3', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginBottom: 15 },
  permissionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backLink: { color: '#2196F3', fontWeight: '600', fontSize: 16, marginTop: 10 },
  // Header
  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 2000,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  backIcon: { fontSize: 28, color: '#2196F3', fontWeight: '300', lineHeight: 30 },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  headerSpacer: { width: 44 },
  markerBox: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40 },
  markerIcon: { fontSize: 28 },
  centerBtn: {
    position: 'absolute', bottom: 30, right: 20, zIndex: 2000,
    backgroundColor: 'white', borderRadius: 30, width: 50, height: 50,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  centerBtnIcon: { fontSize: 24 },
});