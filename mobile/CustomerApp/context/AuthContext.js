import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const token = await AsyncStorage.getItem('token'); if (token) setUser({ token }); setLoading(false); })(); }, []);
  const login = async (phone, otp) => { const res = await api.post('/auth/login', { phone, otp }); const { token } = res.data; await AsyncStorage.setItem('token', token); setUser({ token }); };
  const logout = async () => { await AsyncStorage.removeItem('token'); setUser(null); };
  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
