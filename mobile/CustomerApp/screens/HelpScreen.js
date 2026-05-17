import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';
export default function HelpScreen() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item}><Text>📖 FAQ</Text></TouchableOpacity>
      <TouchableOpacity style={styles.item}><Text>💬 Live Chat</Text></TouchableOpacity>
      <TouchableOpacity style={styles.item}><Text>📧 Email Support</Text></TouchableOpacity>
      <TouchableOpacity style={styles.item}><Text>🐞 Report an Issue</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, padding: 16 },
  item: { paddingVertical: 16, borderBottomWidth: 1, borderColor: Colors.lightGray, fontSize: 16 },
});
