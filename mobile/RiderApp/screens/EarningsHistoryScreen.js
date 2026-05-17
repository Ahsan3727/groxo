import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';

export default function EarningsHistoryScreen() {
  // Mock data until backend is ready
  const transactions = [
    { _id: '1', date: '2026-05-10', amount: 200 },
    { _id: '2', date: '2026-05-09', amount: 150 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Earnings History</Text>
      <FlatList
        data={transactions}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.date}</Text>
            <Text>₹{item.amount}</Text>
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:Colors.background },
  title: { fontSize:22, fontWeight:'bold', marginBottom:12 },
  item: { flexDirection:'row', justifyContent:'space-between', padding:12, backgroundColor:Colors.white, marginBottom:8, borderRadius:8 }
});
