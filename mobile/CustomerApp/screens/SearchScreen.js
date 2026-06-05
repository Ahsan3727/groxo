import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import api from '../services/api';
import Card from '../components/Card';
import BottomTabBar from '../components/BottomTabBar';
import { Colors as GlobalColors, Fonts } from '../theme';

const Colors = {
  primary: '#FF7F2A', white: '#FFFFFF', gray100: '#f1f5f9', gray400: '#9CA3AF',
  darkest: '#3E2723', heroBg: '#FF9F43',
};

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const { data } = await api.get(`/products?search=${query}`);
      setResults(data.products || []);
    } catch (e) { console.error(e); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={Colors.gray400}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Search for products above</Text>}
        renderItem={({ item }) => (
          <Card style={styles.resultCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
            <Text style={styles.resultEmoji}>{item.emoji || '🛍️'}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultPrice}>Rs. {(item.adminPrice || item.price).toFixed(2)}</Text>
            </View>
          </Card>
        )}
      />
      <BottomTabBar navigation={navigation} activeScreen="Search" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 8, paddingBottom: 12, backgroundColor: Colors.heroBg },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: '#FFFFFF', fontWeight: '600' },
  searchInput: { flex: 1, backgroundColor: Colors.white, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: Colors.darkest },
  resultCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  resultEmoji: { fontSize: 36 },
  resultName: { fontWeight: '600', fontSize: 14, color: Colors.darkest },
  resultPrice: { fontSize: 14, color: Colors.primary, fontWeight: '700', marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: Colors.gray400, fontSize: 16 },
});