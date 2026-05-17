import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useWholesaler } from '../context/WholesalerContext';
import { Colors, Shadows } from '../theme/theme';

export default function DashboardScreen({ navigation }) {
  const { wholesaler, logout } = useAuth();
  const { orders, products, earnings } = useWholesaler();

  const newOrders = orders.filter(o => o.status === 'new').length;
  const pendingProducts = products.filter(p => p.status === 'pending').length;
  const lowStock = products.filter(p => p.stock < 5).length;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Welcome, {wholesaler?.shopName || 'Shop'}!</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statValue}>?{earnings.today}</Text><Text>Today</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>?{earnings.week}</Text><Text>This Week</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>?{earnings.month}</Text><Text>This Month</Text></View>
      </View>

      <View style={styles.alertRow}>
        {newOrders > 0 && (
          <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.alertText}>?? {newOrders} New Orders</Text>
          </TouchableOpacity>
        )}
        {pendingProducts > 0 && (
          <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('Products')}>
            <Text style={styles.alertText}>? {pendingProducts} Pending Products</Text>
          </TouchableOpacity>
        )}
        {lowStock > 0 && (
          <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('Products')}>
            <Text style={styles.alertText}>?? {lowStock} Low Stock Items</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Orders')}>
          <Text>?? Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Products')}>
          <Text>?? Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Earnings')}>
          <Text>?? Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Profile')}>
          <Text>?? Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
          <Text>?? Settings</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:Colors.background },
  greeting: { fontSize:22, fontWeight:'bold', marginBottom:16 },
  statsRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:16 },
  statCard: { flex:1, backgroundColor:Colors.white, padding:12, marginHorizontal:4, borderRadius:8, alignItems:'center', ...Shadows.light },
  statValue: { fontSize:20, fontWeight:'bold', color:Colors.primary },
  alertRow: { marginBottom:16 },
  alertCard: { backgroundColor:Colors.white, padding:14, borderRadius:8, marginBottom:8, borderLeftWidth:4, borderLeftColor:Colors.accent, ...Shadows.light },
  alertText: { fontWeight:'bold' },
  menuGrid: { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', marginBottom:16 },
  menuItem: { width:'48%', backgroundColor:Colors.white, padding:16, borderRadius:8, alignItems:'center', marginBottom:12, ...Shadows.light },
  logoutBtn: { marginTop:10, backgroundColor:Colors.error, padding:14, borderRadius:8, alignItems:'center' },
  logoutText: { color:Colors.white, fontWeight:'bold' }
});
