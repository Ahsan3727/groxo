import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppButton from '../components/AppButton';
import InputGroup from '../components/InputGroup';
import Card from '../components/Card';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { wholesaler, updateProfile, logout } = useAuth();
  const [name, setName] = useState(wholesaler?.name || '');
  const [phone, setPhone] = useState(wholesaler?.phone || '');
  const [storeName, setStoreName] = useState(wholesaler?.storeName || '');
  const [businessLicense, setBusinessLicense] = useState(wholesaler?.businessLicense || '');

  const handleSave = async () => {
    const result = await updateProfile({ name, phone, storeName, businessLicense });
    if (result.success) Alert.alert('Success', 'Profile updated');
    else Alert.alert('Error', result.message);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await AsyncStorage.clear(); logout(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(wholesaler?.name || 'W')[0].toUpperCase()}</Text></View>
        </View>
        <Card style={{ marginHorizontal: 16 }}>
          <InputGroup icon="👤" placeholder="Name" value={name} onChangeText={setName} />
          <InputGroup icon="📧" placeholder="Email" value={wholesaler?.email} editable={false} />
          <InputGroup icon="📱" placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <InputGroup icon="🏪" placeholder="Store Name" value={storeName} onChangeText={setStoreName} />
          <InputGroup icon="📄" placeholder="Business License" value={businessLicense} onChangeText={setBusinessLicense} />
        </Card>
        <AppButton title="🚪 Logout" type="outline" style={styles.logoutBtn} textStyle={{ color: Colors.red }} onPress={handleLogout} />
      </ScrollView>
      <BottomTabBar navigation={navigation} activeScreen="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700' },
  avatarContainer: { alignItems: 'center', marginVertical: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary600, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
  logoutBtn: { marginHorizontal: 16, marginTop: 24, borderColor: '#fecaca' },
});