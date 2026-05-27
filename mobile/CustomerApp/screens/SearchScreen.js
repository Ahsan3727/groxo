import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts } from '../theme';

export default function SearchScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Search Products</Text>
        <View style={{ width: 50 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.message}>Search for products</Text>
      </View>
      <BottomTabBar navigation={navigation} activeScreen="Search" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: Colors.white },
  backBtn: { fontSize: 16, color: Colors.primary600, fontWeight: '600' },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 60, marginBottom: 20 },
  message: { fontSize: 18, color: Colors.gray400 },
});
