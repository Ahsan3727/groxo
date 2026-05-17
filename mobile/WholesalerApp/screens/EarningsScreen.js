import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useWholesaler } from '../context/WholesalerContext';
import { Colors } from '../theme/theme';

export default function EarningsScreen() {
  const { earnings, requestWithdrawal } = useWholesaler();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Earnings & Transactions</Text>
      <View style={styles.card}><Text style={styles.amount}>?{earnings.today}</Text><Text>Today</Text></View>
      <View style={styles.card}><Text style={styles.amount}>?{earnings.week}</Text><Text>This Week</Text></View>
      <View style={styles.card}><Text style={styles.amount}>?{earnings.month}</Text><Text>This Month</Text></View>
      <TouchableOpacity style={styles.withdrawBtn} onPress={requestWithdrawal}>
        <Text style={styles.withdrawText}>Request Withdrawal</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:Colors.background },
  title: { fontSize:24, fontWeight:'bold', marginBottom:16 },
  card: { backgroundColor:Colors.white, padding:20, borderRadius:12, alignItems:'center', marginBottom:12, elevation:2 },
  amount: { fontSize:28, fontWeight:'bold', color:Colors.primary },
  withdrawBtn: { backgroundColor:Colors.primary, padding:16, borderRadius:8, alignItems:'center', marginTop:12 },
  withdrawText: { color:Colors.white, fontWeight:'bold' }
});
