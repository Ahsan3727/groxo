import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import AppButton from '../components/AppButton';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts, Radius, Shadows } from '../theme';

export default function DashboardScreen({ navigation }) {
  const { wholesaler, logout } = useAuth();
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const { data: products } = await api.get('/products?wholesaler=me');
      const { data: orders } = await api.get('/orders?status=pending');
      setStats({
        products: products.products?.length || 0,
        orders: orders.length || 0,
        revenue: orders.reduce((sum, o) => sum + (o.payment?.amount || 0), 0),
      });
    } catch (e) { /* keep previous stats if endpoint fails */ }
  };

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();   // clear all stored tokens
          logout();                     // update AuthContext → navigates to Login
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(wholesaler?.name || 'W')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Hello, {wholesaler?.name?.split(' ')[0] || 'Wholesaler'}</Text>
              <Text style={styles.storeName}>{wholesaler?.storeName || 'Your Store'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
            <Text style={styles.statIcon}>📦</Text>
            <Text style={styles.statValue}>{stats.products}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
            <Text style={styles.statIcon}>📋</Text>
            <Text style={styles.statValue}>{stats.orders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>₹{stats.revenue}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        {/* Recent Orders (optional, you can add a FlatList here later) */}

        {/* Logout Button */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <AppButton
            title="🚪 Logout"
            type="outline"
            style={{ borderColor: '#fecaca' }}
            textStyle={{ color: Colors.red }}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomTabBar navigation={navigation} activeScreen="Dashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    ...Shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  greeting: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.gray900,
  },
  storeName: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
    color: Colors.gray900,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gray500,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});