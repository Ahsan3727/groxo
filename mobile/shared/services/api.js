import axios from 'axios';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = axios.create({ baseURL: 'http://10.0.2.2:5000/api' }); // Android emulator -> localhost

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const socket = io('http://10.0.2.2:5000', {
  autoConnect: false,
  auth: async (cb) => {
    const token = await AsyncStorage.getItem('token');
    cb({ token });
  }
});

export default API;
