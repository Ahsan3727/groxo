import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, Shadows } from '../theme/theme';
export default function ProfileScreen({ navigation }) {
  const { logout } = useAuth();
  const menuItems = [
    { label: 'My Addresses', screen: 'AddressList' },
    { label: 'Wallet', screen: 'WalletScreen' },
    { label: 'Settings', screen: 'SettingsScreen' },
    { label: 'Help & Support', screen: 'HelpScreen' },
  ];
  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>👤</Text></View>
        <Text style={styles.userName}>Welcome, User</Text>
      </View>
      {menuItems.map((item, idx) => (
        <TouchableOpacity key={idx} style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
          <Text style={styles.menuText}>{item.label}</Text><Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  avatarRow: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.lightGray, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { fontSize: 36 },
  userName: { fontSize: 20, fontWeight: 'bold', color: Colors.black },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.white, padding: 16, borderRadius: 12, marginBottom: 8, ...Shadows.light },
  menuText: { fontSize: 16, color: Colors.black }, arrow: { fontSize: 22, color: Colors.gray },
  logoutBtn: { marginTop: 20, backgroundColor: Colors.error, padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: Colors.white, fontWeight: 'bold' },
});
