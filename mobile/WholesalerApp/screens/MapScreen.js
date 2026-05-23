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

// ---------- Native map components ----------
let NativeMapView, NativeMarker;
if (Platform.OS !== 'web') {
  NativeMapView = require('react-native-maps').default;
  NativeMarker = require('react-native-maps').Marker;
}

import * as Location from 'expo-location';
import 'leaflet/dist/leaflet.css';

// ---------- Default Chiniot coordinates (shown instantly) ----------
const DEFAULT_LOCATION = { latitude: 31.72, longitude: 72.98 };

export default function MapScreen({ navigation }) {
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION); // start with Chiniot
  const [locationReady, setLocationReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mapRef = useRef(null);
  const webMapRef = useRef(null);
  const isLoading = !locationReady && !permissionDenied;

  // ---------- Request real location ----------
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setPermissionDenied(true);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLocationReady(true);
        },
        () => {
          setPermissionDenied(true);
        },
        { enableHighAccuracy: true }
      );
      const watchId = navigator.geolocation.watchPosition(
        (pos) =>
          setCurrentLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
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
        if (isMounted) setPermissionDenied(true);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (isMounted) {
          setCurrentLocation(loc.coords);
          setLocationReady(true);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setPermissionDenied(true);
      }

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 5 },
        (newLoc) => {
          if (isMounted) setCurrentLocation(newLoc.coords);
        }
      );
      return () => { sub.remove(); isMounted = false; };
    })();

    return () => { isMounted = false; };
  }, []);

  const centerOnUser = () => {
    if (!currentLocation) return;
    if (Platform.OS === 'web' && webMapRef.current) {
      webMapRef.current.flyTo([currentLocation.latitude, currentLocation.longitude], 16, {
        duration: 1.5,
      });
    } else if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
    }
  };

  // ---------- Permission denied ----------
  if (permissionDenied) {
    return (
      <View style={styles.centered}>
        <Text style={styles.deniedTitle}>Location Permission Required</Text>
        <Text style={styles.deniedMessage}>
          Please enable location access to see your position on the map.
        </Text>
        {Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.permissionBtnText}>Open Settings</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------- Leaflet icon for web ----------
  const createLeafletIcon = () => {
    if (Platform.OS !== 'web') return null;
    const L = require('leaflet');
    return L.divIcon({
      html: `<div style="font-size:28px; background:transparent;">🏭</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  };

  return (
    <View style={styles.container}>
      {/* -------- Map (shown immediately with default location) -------- */}
      {Platform.OS === 'web' ? (
        <WebMapInstance
          location={currentLocation}
          onMapReady={(map) => {
            webMapRef.current = map;
          }}
          icon={createLeafletIcon()}
        />
      ) : (
        <NativeMapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
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
                <Text style={styles.markerIcon}>🏭</Text>
              </View>
            </NativeMarker>
          )}
        </NativeMapView>
      )}

      {/* ---------- Loading indicator overlay (subtle, over the map) ---------- */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Finding your location…</Text>
        </View>
      )}

      {/* ---------- Header (always on top) ---------- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Dashboard');
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

      {/* ---------- Center button ---------- */}
      <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
        <Text style={styles.centerBtnIcon}>📍</Text>
      </TouchableOpacity>
    </View>
  );
}

// ==============================
// INLINE WEB MAP (with aria fix)
// ==============================
function WebMapInstance({ location, onMapReady, icon }) {
  const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
  const position = [location.latitude, location.longitude];
  const mapRef = useRef(null);

  useEffect(() => {
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

// ==============================
// STYLES (web‑compatible boxShadow)
// ==============================
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  // Loading overlay – sits on top of the already visible map
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#333' },
  deniedTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  deniedMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  permissionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backLink: { color: '#FF9800', fontWeight: '600', fontSize: 16, marginTop: 10 },
  // Header – uses boxShadow for web
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
    // New web‑compatible shadow (replaces shadowColor/Offset/Radius)
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    elevation: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  backIcon: { fontSize: 28, color: '#FF9800', fontWeight: '300', lineHeight: 30 },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  headerSpacer: { width: 44 },
  markerBox: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40 },
  markerIcon: { fontSize: 28 },
  // Center button
  centerBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 2000,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    elevation: 5,
  },
  centerBtnIcon: { fontSize: 24 },
});