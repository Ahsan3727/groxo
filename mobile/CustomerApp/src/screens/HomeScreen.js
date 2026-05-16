import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import API from '../../shared/services/api';
import { colors } from '../../shared/constants/colors';

const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Groceries','Electronics','Fashion','Home']);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, []);

  const renderProduct = ({ item }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
      <View style={styles.imagePlaceholder} />
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.price}>${item.price.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search products..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList horizontal showsHorizontalScrollIndicator={false} data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chip}>
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
        style={{ flexGrow: 0, marginBottom: 10 }}
      />
      <FlatList
        data={products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))}
        keyExtractor={item => item._id}
        numColumns={2}
        renderItem={renderProduct}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  searchBar: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    elevation: 2,
  },
  chip: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productCard: {
    flex: 1,
    backgroundColor: colors.card,
    margin: 6,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 3,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
  },
  productName: { fontWeight: '600', textAlign: 'center' },
  price: { fontWeight: 'bold', color: colors.secondary, marginTop: 4 },
});

export default HomeScreen;
