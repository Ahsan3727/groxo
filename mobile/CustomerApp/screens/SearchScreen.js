import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../services/api';
import { Colors } from '../theme/theme';
export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const handleSearch = async () => { if (!query) return; const res = await api.get('/products?search=' + query); setResults(res.data.products || []); };
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput style={styles.input} placeholder="Search for products..." placeholderTextColor={Colors.gray} value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} />
        <TouchableOpacity onPress={handleSearch}><Text style={styles.icon}>🔍</Text></TouchableOpacity>
      </View>
      <FlatList
        data={results} keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>₹{item.price}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No results found</Text>}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, elevation: 2 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: Colors.black },
  icon: { fontSize: 20 },
  item: { backgroundColor: Colors.white, padding: 16, marginBottom: 8, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', elevation: 1 },
  name: { fontWeight: '600', color: Colors.black },
  price: { fontWeight: 'bold', color: Colors.primary },
  empty: { textAlign: 'center', marginTop: 40, color: Colors.gray },
});
