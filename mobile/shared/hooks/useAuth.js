import { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API, { socket } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const res = await API.get('/auth/me');
        setUser(res.data);
        socket.auth = { token };
        socket.connect();
      }
    } catch (err) {
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUser(); }, []);

  const login = async (phone, password) => {
    const res = await API.post('/auth/login', { phone, password });
    await AsyncStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    socket.auth = { token: res.data.token };
    socket.connect();
  };

  const register = async (phone, password, name) => {
    const res = await API.post('/auth/register', { phone, password, role:'customer', name });
    await AsyncStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    socket.auth = { token: res.data.token };
    socket.connect();
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    socket.disconnect();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
