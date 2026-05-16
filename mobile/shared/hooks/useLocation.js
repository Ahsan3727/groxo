import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

export const useLocation = () => {
  const [location, setLocation] = useState({ lat: 0, lng: 0 });
  // For a real app, integrate react-native-geolocation-service
  return { location, requestPermission: () => {} };
};
