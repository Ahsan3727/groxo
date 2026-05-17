import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/theme';

export default function ProfileScreen({ navigation }) {
  const { wholesaler } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop Info</Text>
        <Text>Name: {wholesaler?.shopName || 'N/A'}</Text>
        <Text>Phone: {wholesaler?.phone || 'N/A'}</Text>
        <Text>Address: {wholesaler?.address || 'N/A'}</Text>
        <Text>Business Hours: {wholesaler?.businessHours || 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text>Lat: {wholesaler?.location?.lat || 'N/A'}, Lng: {wholesaler?.location?.lng || 'N/A'}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SetLocation')}>
          <Text style={{ color: Colors.primary, marginTop:8 }}>View / Set Location</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documents</Text>
        <Text>License: {wholesaler?.documents?.license || 'Pending'}</Text>
        <Text>Tax ID: {wholesaler?.documents?.taxId || 'Pending'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Account</Text>
        <Text>Account: {wholesaler?.bankAccount || 'Not set'}</Text>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:Colors.background },
  title: { fontSize:24, fontWeight:'bold', marginBottom:16 },
  section: { backgroundColor:Colors.white, padding:16, borderRadius:12, marginBottom:12 },
  sectionTitle: { fontSize:18, fontWeight:'bold', marginBottom:8 }
});
