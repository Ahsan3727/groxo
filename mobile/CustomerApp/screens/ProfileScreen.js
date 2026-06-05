import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppButton from '../components/AppButton';
import InputGroup from '../components/InputGroup';
import Card from '../components/Card';
import BottomTabBar from '../components/BottomTabBar';
import { Colors as GlobalColors, Fonts } from '../theme';

const Colors = {
  primary: '#FF7F2A', primaryLight: '#FFF0E5', white: '#FFFFFF', gray100: '#f1f5f9',
  gray400: '#9CA3AF', darkest: '#3E2723', orangeText: '#8B4513', heroBg: '#FF9F43',
};

export default function ProfileScreen({ navigation }) {
  const { customer, updateProfile, logout } = useAuth();
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [street, setStreet] = useState(customer?.address?.street || '');
  const [city, setCity] = useState(customer?.address?.city || '');

  const handleSave = async () => {
    const result = await updateProfile({ name, phone, address: { street, city } });
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
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(customer?.name || 'C')[0].toUpperCase()}</Text></View>
        </View>
        <Card style={{ marginHorizontal: 16 }}>
          <InputGroup icon="👤" placeholder="Name" value={name} onChangeText={setName} />
          <InputGroup icon="📧" placeholder="Email" value={customer?.email} editable={false} />
          <InputGroup icon="📱" placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <InputGroup icon="📍" placeholder="Street" value={street} onChangeText={setStreet} />
          <InputGroup icon="🏙️" placeholder="City" value={city} onChangeText={setCity} />
        </Card>
        <AppButton title="Save" onPress={handleSave} style={{ marginHorizontal: 16, marginTop: 20 }} />
        <AppButton title="🚪 Logout" type="outline" style={{ marginHorizontal: 16, marginTop: 12, borderColor: '#fecaca' }} textStyle={{ color: Colors.red }} onPress={handleLogout} />
      </ScrollView>
      <BottomTabBar navigation={navigation} activeScreen="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.heroBg, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: '#FFFFFF' },
  avatarContainer: { alignItems: 'center', marginVertical: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 30, fontWeight: '700' },
});