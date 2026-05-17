import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/theme';

export default function SettingsScreen() {
  const [dark, setDark] = useState(false);
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.row}>
        <Text>Dark Mode</Text>
        <Switch value={dark} onValueChange={setDark} />
      </View>
      <TouchableOpacity style={styles.item}><Text>Notifications</Text></TouchableOpacity>
      <TouchableOpacity style={styles.item}><Text>Language</Text></TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={logout}><Text style={{ color:Colors.error }}>Logout</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:Colors.background },
  title: { fontSize:24, fontWeight:'bold', marginBottom:16 },
  row: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderColor:Colors.lightGray },
  item: { paddingVertical:14, borderBottomWidth:1, borderColor:Colors.lightGray }
});
