import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../services/api';
import { Colors } from '../theme/theme';
export default function AddressListScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  useEffect(() => { api.get('/users/addresses').then(res => setAddresses(res.data.addresses || [])).catch(console.log); }, []);
  return (
    <View style={styles.container}>
      <FlatList data={addresses} keyExtractor={item => item._id} renderItem={({ item }) => (
        <View style={styles.card}><Text style={styles.label}>{item.label}</Text><Text>{item.line1}, {item.city} - {item.pincode}</Text></View>
      )} />
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddAddress')}><Text style={styles.addBtnText}>+ Add New Address</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 12 },
  card: { backgroundColor: Colors.white, padding: 14, borderRadius: 10, marginBottom: 8 },
  label: { fontWeight: '600' },
  addBtn: { backgroundColor: Colors.primary, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  addBtnText: { color: Colors.white, fontWeight: 'bold' },
});
