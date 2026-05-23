import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// Theme constants (no external dependencies)
const Colors = {
  primary: '#4CAF50',
  accent: '#FF9800',
  error: '#f44336',
  white: '#ffffff',
  gray: '#999999',
  lightGray: '#f5f5f5',
  text: '#333333',
  online: '#4CAF50',
  offline: '#9E9E9E',
};

export default function DashboardScreen({ navigation }) {
  const { rider, logout } = useAuth();
  
  // Local state
  const [isOnline, setIsOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalDeliveries: 0,
    rating: 5.0,
  });

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/rider/dashboard');
      if (data) {
        setStats({
          todayEarnings: data.todayEarnings || 0,
          weekEarnings: data.weekEarnings || 0,
          monthEarnings: data.monthEarnings || 0,
          totalDeliveries: data.totalDeliveries || 0,
          rating: data.rating || 5.0,
        });
      }
    } catch (error) {
      console.log('Dashboard API not available, using defaults');
    } finally {
      setLoading(false);
    }
  };

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  // Toggle online/offline status
  const toggleOnline = () => {
    setIsOnline(prev => !prev);
  };

  // Logout with confirmation
  const handleLogout = async () => {
  // Clear everything
  await AsyncStorage.clear();
  
  // Force reload - this ALWAYS works
  if (typeof window !== 'undefined') {
    window.location.reload();
  } else {
    // For native, just navigate
    navigation.navigate('Login');
  }
};
  // Navigate to screens (with fallback if screen doesn't exist)
  const navigateTo = (screenName) => {
    try {
      navigation.navigate(screenName);
    } catch (error) {
      Alert.alert('Coming Soon', `${screenName} screen will be available soon.`);
    }
  };

  // Get first name from full name
  const firstName = rider?.name?.split(' ')[0] || 'Rider';
  
  // Get vehicle info
  const vehicleInfo = rider?.vehicle 
    ? `${rider.vehicle.type || 'Vehicle'} • ${rider.vehicle.plateNumber || 'N/A'}`
    : 'No vehicle registered';

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(rider?.name || 'R').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Welcome, {firstName}!</Text>
            <Text style={styles.email}>{rider?.email || 'No email'}</Text>
            <View style={styles.vehicleBadge}>
              <Text style={styles.vehicleText}>🛵 {vehicleInfo}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={styles.statValue}>₹{stats.todayEarnings}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statValue}>₹{stats.weekEarnings}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statValue}>₹{stats.monthEarnings}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      {/* Additional Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statsCardSmall}>
          <Text style={styles.statsSmallValue}>{stats.totalDeliveries}</Text>
          <Text style={styles.statsSmallLabel}>Deliveries</Text>
        </View>
        <View style={styles.statsCardSmall}>
          <Text style={styles.statsSmallValue}>⭐ {stats.rating}</Text>
          <Text style={styles.statsSmallLabel}>Rating</Text>
        </View>
      </View>

      {/* Online/Offline Toggle */}
      <TouchableOpacity
        style={[styles.toggleButton, isOnline ? styles.toggleOnline : styles.toggleOffline]}
        onPress={toggleOnline}
        activeOpacity={0.8}
      >
        <View style={styles.toggleContent}>
          <Text style={styles.toggleIcon}>{isOnline ? '🟢' : '🔴'}</Text>
          <View>
            <Text style={styles.toggleTitle}>
              {isOnline ? 'You are Online' : 'You are Offline'}
            </Text>
            <Text style={styles.toggleSubtitle}>
              {isOnline ? 'Receiving order requests' : 'Tap to go online'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Account Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusContent}>
          <Text style={styles.statusIcon}>📋</Text>
          <Text style={styles.statusTitle}>Account Status</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: rider?.isActive ? Colors.primary : Colors.error }
        ]}>
          <Text style={styles.statusText}>
            {rider?.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Quick Actions Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.menuGrid}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigateTo('EarningsHistory')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>📈</Text>
          <Text style={styles.menuText}>Earnings</Text>
          <Text style={styles.menuSubtext}>View history</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigateTo('OrderHistory')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>📜</Text>
          <Text style={styles.menuText}>Orders</Text>
          <Text style={styles.menuSubtext}>All deliveries</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigateTo('Profile')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={styles.menuText}>Profile</Text>
          <Text style={styles.menuSubtext}>Edit details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigateTo('Settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>Settings</Text>
          <Text style={styles.menuSubtext}>Preferences</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      {/* Bottom spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  
  // Header
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: 8,
  },
  vehicleBadge: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  vehicleText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Stats
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  statsCardSmall: {
    flex: 1,
    backgroundColor: Colors.white,
    marginHorizontal: 4,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statsSmallValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  statsSmallLabel: {
    fontSize: 11,
    color: Colors.gray,
  },

  // Toggle
  toggleButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 16,
  },
  toggleOnline: {
    backgroundColor: Colors.online,
  },
  toggleOffline: {
    backgroundColor: Colors.offline,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  toggleTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 2,
  },

  // Status
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Menu
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
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
    backgroundColor: Colors.white,
    margin: '2%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  menuSubtext: {
    fontSize: 11,
    color: Colors.gray,
  },

  // Logout
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.error,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 17,
  },

  // Bottom spacer
  bottomSpacer: {
    height: 40,
  },
});