import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, Shadows } from '../theme/theme';
export default function DrawerContent({ navigation }) {
  const { logout } = useAuth();
  const items = [
    { label: '🏠  Home', screen: 'HomeTab' }, { label: '📋  My Orders', screen: 'OrdersTab' },
    { label: '💰  Wallet', screen: 'WalletScreen' }, { label: '📍  Addresses', screen: 'AddressList' },
    { label: '⚙️  Settings', screen: 'SettingsScreen' }, { label: '🆘  Help', screen: 'HelpScreen' },
  ];
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>👤</Text></View>
        <Text style={styles.name}>Grocery Lover</Text>
      </View>
      <View style={styles.menu}>
        {items.map((item, idx) => (
          <TouchableOpacity key={idx} style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
            <Text style={styles.menuText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}><Text style={styles.logoutText}>🚪  Logout</Text></TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { alignItems: 'center', paddingVertical: 30, borderBottomWidth: 1, borderColor: Colors.lightGray, marginBottom: 12 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { fontSize: 32 }, name: { fontSize: 18, fontWeight: 'bold', color: Colors.black },
  menu: { flex: 1 }, menuItem: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: Colors.lightGray },
  menuText: { fontSize: 16, color: Colors.black },
  logoutBtn: { padding: 16, marginHorizontal: 20, marginBottom: 20, backgroundColor: Colors.error, borderRadius: 12, alignItems: 'center', ...Shadows.light },
  logoutText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
});
