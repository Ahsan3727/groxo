import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import api from '../services/api';

const UPDATE_INTERVAL = 30000; // 30 seconds

export default function useLocationTracking(isAuthenticated) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const sendLocation = async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const { latitude, longitude } = location.coords;
          await api.put('/auth/location', { lat: latitude, lng: longitude });
          console.log('Wholesaler location sent', latitude, longitude);
        } catch (error) {
          console.error('Wholesaler location send error', error);
        }
      };

      await sendLocation();
      intervalRef.current = setInterval(sendLocation, UPDATE_INTERVAL);
    };

    startTracking();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated]);
}