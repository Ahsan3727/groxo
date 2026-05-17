import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';
export default function SettingsScreen() {
  const [dark, setDark] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.row}><Text>Dark Mode</Text><Switch value={dark} onValueChange={setDark} /></View>
      <TouchableOpacity style={styles.item}><Text>Privacy Policy</Text></TouchableOpacity>
      <TouchableOpacity style={styles.item}><Text>Clear Cache</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.item, { borderBottomWidth: 0 }]}><Text style={{ color: Colors.error }}>Delete Account</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: Colors.lightGray },
  item: { paddingVertical: 16, borderBottomWidth: 1, borderColor: Colors.lightGray },
});
