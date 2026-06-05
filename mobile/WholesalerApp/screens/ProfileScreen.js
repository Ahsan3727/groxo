import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation }) => {
  const { wholesaler, updateProfile } = useAuth();
  const [name, setName] = useState(wholesaler?.name || '');
  const [phone, setPhone] = useState(wholesaler?.phone || '');
  const [storeName, setStoreName] = useState(wholesaler?.storeName || '');
  const [businessLicense, setBusinessLicense] = useState(wholesaler?.businessLicense || '');

  const handleSave = async () => {
    const result = await updateProfile({ name, phone, storeName, businessLicense });
    if (result.success) Alert.alert('Success', 'Profile updated');
    else Alert.alert('Error', result.message);
  };

  const handleLogout = async () => {
  // Clear everything
  await AsyncStorage.clear();
  
  // Force reload - this ALWAYS works
  if (typeof window !== 'undefined') {
    window.location.reload();
  } else {
    // For native, just navigate
    navigation.navigate('Login');
  }
};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={[styles.input, styles.disabled]} value={wholesaler?.email} editable={false} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Store Name</Text>
          <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business License</Text>
          <TextInput style={styles.input} value={businessLicense} onChangeText={setBusinessLicense} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
  backButton: { fontSize: 16, color: '#FF9800', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  saveButton: { fontSize: 16, color: '#FF9800', fontWeight: '600' },
  content: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 16 },
  disabled: { backgroundColor: '#eee', color: '#999' },
  logoutButton: { backgroundColor: '#f44336', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default ProfileScreen;