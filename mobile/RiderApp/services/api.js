import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',   // change to your IP when on device
  timeout: 10000,
});

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('riderToken');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

export default api;
