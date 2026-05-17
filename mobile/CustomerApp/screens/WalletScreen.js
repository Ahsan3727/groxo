import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';
export default function WalletScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}><Text style={styles.balanceLabel}>Wallet Balance</Text><Text style={styles.balanceAmount}>₹200.00</Text></View>
      <TouchableOpacity style={styles.addMoneyBtn}><Text style={styles.addMoneyText}>Add Money</Text></TouchableOpacity>
      <Text style={styles.historyTitle}>Transaction History</Text><Text style={styles.empty}>No recent transactions</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  balanceCard: { backgroundColor: Colors.primary, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  balanceLabel: { color: Colors.white, fontSize: 16 },
  balanceAmount: { color: Colors.white, fontSize: 36, fontWeight: 'bold', marginTop: 8 },
  addMoneyBtn: { backgroundColor: Colors.white, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Colors.primary },
  addMoneyText: { color: Colors.primary, fontWeight: 'bold' },
  historyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  empty: { color: Colors.gray, textAlign: 'center', marginTop: 20 },
});
