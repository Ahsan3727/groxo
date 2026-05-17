import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [wholesaler, setWholesaler] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('wholesalerToken');
      if (token) {
        setWholesaler({
          _id: 'ws-demo',
          shopName: 'FreshMart',
          phone: '+919876543210',
          role: 'wholesaler',
          address: '789 Market St',
          location: { lat: 28.6139, lng: 77.2090 },
          bankAccount: '9876543210',
          businessHours: '9 AM - 9 PM',
          documents: { license: 'Valid', taxId: 'TAX123' },
        });
      }
      setLoading(false);
    })();
  }, []);

  const login = async (phone, otp) => {
    const res = await api.post('/auth/login', { phone, otp });
    const { token } = res.data;
    await AsyncStorage.setItem('wholesalerToken', token);
    setWholesaler({
      _id: 'ws-demo',
      shopName: 'FreshMart',
      phone,
      role: 'wholesaler',
      address: '789 Market St',
      location: { lat: 28.6139, lng: 77.2090 },
      bankAccount: '9876543210',
      businessHours: '9 AM - 9 PM',
      documents: { license: 'Valid', taxId: 'TAX123' },
    });
  };

  const logout = async () => {
    await AsyncStorage.removeItem('wholesalerToken');
    setWholesaler(null);
  };

  return (
    <AuthContext.Provider value={{ wholesaler, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
