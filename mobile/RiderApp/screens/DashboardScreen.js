import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { Colors, Shadows } from '../theme/theme';

export default function DashboardScreen({ navigation }) {
  const { rider, logout } = useAuth();
  const { isOnline, goOnline, goOffline, activeOrder } = useActiveOrder();

  const toggleOnline = () => {
    if (isOnline) goOffline();
    else goOnline();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome, {rider?.name || 'Rider'}!</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statValue}>₹{rider?.earnings?.today || 0}</Text><Text>Today</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>₹{rider?.earnings?.week || 0}</Text><Text>This Week</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>₹{rider?.earnings?.month || 0}</Text><Text>This Month</Text></View>
      </View>

      <TouchableOpacity style={[styles.onlineToggle, isOnline ? styles.online : styles.offline]} onPress={toggleOnline}>
        <Text style={styles.toggleText}>{isOnline ? '🟢 Online' : '🔴 Offline'}</Text>
      </TouchableOpacity>

      {isOnline && !activeOrder && (
        <TouchableOpacity style={styles.waitingBtn} onPress={() => navigation.navigate('Waiting')}>
          <Text style={styles.waitingBtnText}>Go to Waiting Screen</Text>
        </TouchableOpacity>
      )}

      {activeOrder && (
        <TouchableOpacity style={styles.activeBtn} onPress={() => navigation.navigate('OrderAssigned')}>
          <Text style={styles.activeBtnText}>Continue Current Order</Text>
        </TouchableOpacity>
      )}

      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EarningsHistory')}>
          <Text>📈 Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrderHistory')}>
          <Text>📜 Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Profile')}>
          <Text>👤 Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
          <Text>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:Colors.background },
  greeting: { fontSize:22, fontWeight:'bold', marginBottom:16 },
  statsRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:20 },
  statCard: { flex:1, backgroundColor:Colors.white, padding:12, marginHorizontal:4, borderRadius:8, alignItems:'center', ...Shadows.light },
  statValue: { fontSize:20, fontWeight:'bold', color:Colors.primary },
  onlineToggle: { padding:16, borderRadius:12, alignItems:'center', marginBottom:16 },
  online: { backgroundColor:Colors.primary },
  offline: { backgroundColor:Colors.gray },
  toggleText: { color:Colors.white, fontWeight:'bold', fontSize:18 },
  waitingBtn: { backgroundColor:Colors.accent, padding:12, borderRadius:8, alignItems:'center', marginBottom:12 },
  waitingBtnText: { color:Colors.white, fontWeight:'bold' },
  activeBtn: { backgroundColor:Colors.accent, padding:12, borderRadius:8, alignItems:'center', marginBottom:12 },
  activeBtnText: { color:Colors.white, fontWeight:'bold' },
  menuGrid: { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between' },
  menuItem: { width:'48%', backgroundColor:Colors.white, padding:16, borderRadius:8, alignItems:'center', marginBottom:12, ...Shadows.light },
  logoutBtn: { marginTop:20, backgroundColor:Colors.error, padding:14, borderRadius:8, alignItems:'center' },
  logoutText: { color:Colors.white, fontWeight:'bold' }
});
