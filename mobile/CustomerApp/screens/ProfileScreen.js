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
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <AppButton title="← Back" type="ghost" size="sm" onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Profile</Text>
          <AppButton title="Save" type="ghost" size="sm" textStyle={{ color: Colors.primary600 }} onPress={handleSave} />
        </View>
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(customer?.name||'C')[0].toUpperCase()}</Text></View>
        </View>
        <Card style={{ marginHorizontal: 16 }}>
          <InputGroup icon="👤" placeholder="Name" value={name} onChangeText={setName} />
          <InputGroup icon="📧" placeholder="Email" value={customer?.email} editable={false} />
          <InputGroup icon="📱" placeholder="Phone" value={phone} onChangeText={setPhone} />
          <InputGroup icon="📍" placeholder="Street" value={street} onChangeText={setStreet} />
          <InputGroup icon="🏙️" placeholder="City" value={city} onChangeText={setCity} />
        </Card>
        <AppButton title="🚪 Logout" type="outline" style={{ marginHorizontal: 16, marginTop: 20, borderColor: '#fecaca' }} textStyle={{ color: Colors.red }} onPress={handleLogout} />
      </ScrollView>
      <BottomTabBar navigation={navigation} activeScreen="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 8 },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary600, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
});
