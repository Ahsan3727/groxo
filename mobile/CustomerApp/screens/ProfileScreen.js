import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppButton from '../components/AppButton';
import InputGroup from '../components/InputGroup';
import Card from '../components/Card';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts, Shadows } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { customer, updateProfile, logout } = useAuth();
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [street, setStreet] = useState(customer?.address?.street || '');
  const [city, setCity] = useState(customer?.address?.city || '');

  const handleSave = async () => {
    const result = await updateProfile({ name, phone, address: { street, city } });
    if (result.success) Alert.alert('Success', 'Profile updated');
    else Alert.alert('Error', result.message);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await AsyncStorage.clear(); logout(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(customer?.name || 'C')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{customer?.name}</Text>
          <Text style={styles.email}>{customer?.email}</Text>
        </View>
        <Card style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.menuIcon}>📋</Text><Text style={styles.menuText}>My Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📍</Text><Text style={styles.menuText}>Saved Addresses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>💳</Text><Text style={styles.menuText}>Payment Methods</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text><Text style={styles.menuText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.menuIcon}>⚙️</Text><Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
        </Card>
        <AppButton title="Sign Out" type="outline" style={styles.logoutBtn} textStyle={{ color: Colors.red }} onPress={handleLogout} />
      </ScrollView>
      <BottomTabBar navigation={navigation} activeScreen="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: {
    paddingTop: Constants.statusBarHeight + 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.gray900 },
  avatarContainer: { alignItems: 'center', marginVertical: 24 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary600,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '600', color: Colors.gray900 },
  email: { fontSize: 12, color: Colors.gray400, marginTop: 4 },
  menuCard: { marginHorizontal: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: Colors.gray200,
  },
  menuIcon: { fontSize: 20, width: 36, textAlign: 'center', marginRight: 12 },
  menuText: { fontSize: 14, color: Colors.gray700 },
  logoutBtn: { marginHorizontal: 16, marginTop: 24, borderColor: '#fecaca' },
});