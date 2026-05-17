import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/theme';

export default function ProfileScreen() {
  const { rider } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Info</Text>
        <Text>Name: {rider?.name || 'N/A'}</Text>
        <Text>Phone: {rider?.phone || 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <Text>Vehicle: {rider?.vehicle || 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documents</Text>
        <Text>License: {rider?.license || 'Pending'}</Text>
        <Text>Insurance: {rider?.insurance || 'Pending'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Account</Text>
        <Text>Account: {rider?.bankAccount || 'Not set'}</Text>
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
