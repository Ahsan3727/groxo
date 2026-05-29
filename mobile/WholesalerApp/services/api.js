import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'https://groxo-backend.onrender.com/api';
  }
  return 'https://groxo-backend.onrender.com/api';
};

const BASE_URL = getBaseUrl();

console.log('WholesalerApp API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('wholesalerToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📡 ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status);
    return response;
  },
  async (error) => {
    console.log('❌ Error:', error.response?.status);
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['wholesalerToken', 'wholesalerData']);
    }
    return Promise.reject(error);
  }
);

export default api;