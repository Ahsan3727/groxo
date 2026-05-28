import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts } from '../theme';

export default function SearchScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.title}>Search</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48 }}>🔍</Text>
        <Text style={{ fontSize: 16, color: Colors.gray400, marginTop: 12 }}>Search for products</Text>
      </View>
      <BottomTabBar navigation={navigation} activeScreen="Search" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Constants.statusBarHeight + 16,
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  backText: { fontSize: 20, color: Colors.primary600 },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700' },
});