import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useLocationTracking from '../hooks/useLocationTracking';

const DashboardScreen = ({ navigation }) => {
  const { wholesaler } = useAuth();
useLocationTracking(true);
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
            {(wholesaler?.name || 'W').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.greeting}>
          Welcome, {wholesaler?.name?.split(' ')[0] || 'Wholesaler'}!
        </Text>
        <Text style={styles.email}>{wholesaler?.email}</Text>
        {wholesaler?.storeName && (
          <View style={styles.storeBadge}>
            <Text style={styles.storeText}>🏪 {wholesaler.storeName}</Text>
          </View>
        )}
        {wholesaler?.businessLicense && (
          <Text style={styles.licenseText}>License: {wholesaler.businessLicense}</Text>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹0</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* Account Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Account Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: wholesaler?.isActive ? '#4CAF50' : '#f44336' }]}>
          <Text style={styles.statusText}>{wholesaler?.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Business Actions</Text>
      <View style={styles.menuGrid}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.menuIcon}>📦</Text>
          <Text style={styles.menuText}>My Products</Text>
          <Text style={styles.menuSubtext}>Manage inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Text style={styles.menuIcon}>➕</Text>
          <Text style={styles.menuText}>Add Product</Text>
          <Text style={styles.menuSubtext}>New listing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuText}>Orders</Text>
          <Text style={styles.menuSubtext}>View orders</Text>
        </TouchableOpacity>
<TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Map')}>
  <Text style={styles.menuIcon}>🗺️</Text>
  <Text style={styles.menuText}>My Map</Text>
  <Text style={styles.menuSubtext}>View location</Text>
</TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Earnings')}
        >
          <Text style={styles.menuIcon}>💰</Text>
          <Text style={styles.menuText}>Earnings</Text>
          <Text style={styles.menuSubtext}>Revenue report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={styles.menuText}>Profile</Text>
          <Text style={styles.menuSubtext}>Edit details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>Settings</Text>
          <Text style={styles.menuSubtext}>Preferences</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF9800',
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
  avatarText: {
    color: '#FF9800',
    fontSize: 30,
    fontWeight: 'bold',
  },
  greeting: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  email: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  storeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  storeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  licenseText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
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
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
    marginBottom: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  menuItem: {
    width: '46%',
    backgroundColor: '#fff',
    margin: '2%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuSubtext: {
    fontSize: 11,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DashboardScreen;