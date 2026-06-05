import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import ToggleSwitch from '../components/ToggleSwitch';
import BottomTabBar from '../components/BottomTabBar';
import { Colors as GlobalColors, Fonts } from '../theme';

const Colors = {
  primary: '#FF7F2A', white: '#FFFFFF', gray100: '#f1f5f9', gray700: '#334155',
  heroBg: '#FF9F43',
};

export default function SettingsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <AppButton title="← Back" type="ghost" size="sm" onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <Card style={{ marginHorizontal: 16 }}>
          <View style={styles.row}><Text style={styles.label}>Notifications</Text><ToggleSwitch value={notifications} onToggle={() => setNotifications(!notifications)} /></View>
          <View style={styles.row}><Text style={styles.label}>Sound</Text><ToggleSwitch value={sound} onToggle={() => setSound(!sound)} /></View>
        </Card>
      </ScrollView>
      <BottomTabBar navigation={navigation} activeScreen="" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 8, marginBottom: 20 },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  label: { fontSize: Fonts.sizes.md, color: Colors.gray700 },
});