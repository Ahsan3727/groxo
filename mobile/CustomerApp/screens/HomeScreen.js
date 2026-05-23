import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
  const { customer } = useAuth();

  const handleLogout = async () => {
    await AsyncStorage.clear();
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(customer?.name || 'C').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.greeting}>
          Welcome, {customer?.name?.split(' ')[0] || 'Customer'}!
        </Text>
        <Text style={styles.email}>{customer?.email}</Text>
        {customer?.address && (
          <View style={styles.addressBadge}>
            <Text style={styles.addressText}>
              📍 {customer.address.city || customer.address.street || 'Address added'}
            </Text>
          </View>
        )}
      </View>

      {/* Account Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Account Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: customer?.isActive ? '#4CAF50' : '#f44336' }]}>
          <Text style={styles.statusText}>{customer?.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.menuGrid}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.menuIcon}>🛍️</Text>
          <Text style={styles.menuText}>Shop Now</Text>
          <Text style={styles.menuSubtext}>Browse products</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.menuIcon}>🛒</Text>
          <Text style={styles.menuText}>My Cart</Text>
          <Text style={styles.menuSubtext}>View items</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.menuIcon}>🔍</Text>
          <Text style={styles.menuText}>Search</Text>
          <Text style={styles.menuSubtext}>Find products</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={styles.menuText}>Profile</Text>
          <Text style={styles.menuSubtext}>Edit details</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#2196F3',
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#2196F3', fontSize: 30, fontWeight: 'bold' },
  greeting: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  email: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  addressBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  addressText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
    marginBottom: 12,
  },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  menuItem: {
    width: '46%',
    backgroundColor: '#fff',
    margin: '2%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  menuIcon: { fontSize: 36, marginBottom: 8 },
  menuText: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  menuSubtext: { fontSize: 11, color: '#999' },
  logoutButton: {
    backgroundColor: '#f44336',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default HomeScreen;