import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [wholesaler, setWholesaler] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const token = await AsyncStorage.getItem('wholesalerToken');
      const wholesalerData = await AsyncStorage.getItem('wholesalerData');
      
      if (token && wholesalerData) {
        setWholesaler(JSON.parse(wholesalerData));
        setIsAuthenticated(true);
        
        try {
          const { data } = await api.get('/auth/me');
          setWholesaler(data);
          await AsyncStorage.setItem('wholesalerData', JSON.stringify(data));
        } catch (error) {
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, phone, password, storeName, businessLicense) => {
    try {
      console.log('Wholesaler signup:', { name, email, phone, role: 'wholesaler' });

      const { data } = await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
        role: 'wholesaler',
        storeName,
        businessLicense,
      });

      await AsyncStorage.setItem('wholesalerToken', data.token);
      await AsyncStorage.setItem('wholesalerData', JSON.stringify(data));
      
      setWholesaler(data);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed';
      Alert.alert('Signup Failed', message);
      return { success: false, message };
    }
  };

  const login = async (email, phone, password) => {
    try {
      const payload = { password };
      if (email) payload.email = email;
      if (phone) payload.phone = phone;

      const { data } = await api.post('/auth/login', payload);

      if (data.role !== 'wholesaler') {
        Alert.alert('Error', 'This account is not a wholesaler');
        return { success: false, message: 'Not a wholesaler account' };
      }

      await AsyncStorage.setItem('wholesalerToken', data.token);
      await AsyncStorage.setItem('wholesalerData', JSON.stringify(data));
      
      setWholesaler(data);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      Alert.alert('Login Failed', message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['wholesalerToken', 'wholesalerData']);
    setWholesaler(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (updatedData) => {
    try {
      const { data } = await api.put('/auth/me', updatedData);
      setWholesaler(data);
      await AsyncStorage.setItem('wholesalerData', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{
      wholesaler,
      loading,
      isAuthenticated,
      signup,
      login,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);