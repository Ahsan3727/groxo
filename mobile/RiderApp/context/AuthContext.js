import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('riderToken');
      if (token) {
        // Simulate fetching rider profile (will be a real endpoint later)
        setRider({
          _id: 'demo-rider',
          name: 'Demo Rider',
          phone: '+919876543210',
          role: 'rider',
          vehicle: 'Motorcycle',
          license: 'DL12345',
          insurance: 'Valid',
          bankAccount: '1234567890',
          earnings: { today: 0, week: 0, month: 0 },
        });
      }
      setLoading(false);
    })();
  }, []);

  const login = async (phone, otp) => {
    // Use existing auth endpoint (dummy) and create a rider session
    const res = await api.post('/auth/login', { phone, otp });
    const { token } = res.data;
    await AsyncStorage.setItem('riderToken', token);
    setRider({
      _id: 'demo-rider',
      name: 'Demo Rider',
      phone,
      role: 'rider',
      vehicle: 'Motorcycle',
      license: 'DL12345',
      insurance: 'Valid',
      bankAccount: '1234567890',
      earnings: { today: 0, week: 0, month: 0 },
    });
  };

  const logout = async () => {
    await AsyncStorage.removeItem('riderToken');
    setRider(null);
  };

  return (
    <AuthContext.Provider value={{ rider, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
