import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../shared/hooks/useAuth';
import { colors } from '../../shared/constants/colors';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={{ fontSize: 40, color: '#fff' }}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.phone}>{user?.phone}</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={{ color: colors.danger, fontWeight: '600' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingTop: 60 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  name: { fontSize: 24, fontWeight: 'bold' },
  phone: { color: colors.textSecondary, marginTop: 8 },
  logoutBtn: { marginTop: 40, padding: 16, borderWidth: 1, borderColor: colors.danger, borderRadius: 30 }
});

export default ProfileScreen;
