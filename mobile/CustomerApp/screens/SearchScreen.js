import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import Card from '../components/Card';
import BottomTabBar from '../components/BottomTabBar';
import { Colors as GlobalColors, Fonts, Radius, Shadows } from '../theme';

// Warm orange palette (consistent with other screens)
const Colors = {
  primary: '#FF7F2A',
  primaryLight: '#FFF0E5',
  white: '#FFFFFF',
  gray400: '#9CA3AF',
  darkest: '#3E2723',
  orangeText: '#8B4513',
  heroBg: '#FF9F43',
  border: '#FFD0B5',
  gray600: '#475569',
};

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { addToCart } = useCart();

  // Debounced search – waits 500ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        performSearch(query.trim());
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchTerm) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const { data } = await api.get(`/products?search=${searchTerm}`);
      setResults(data.products || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    // Optional: show a small toast or feedback
  };

  const renderProduct = ({ item }) => (
    <Card
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <View style={styles.productRow}>
        <Text style={styles.productEmoji}>{item.emoji || '🛍️'}</Text>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>
            Rs. {(item.adminPrice || item.price).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddToCart(item)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header with search bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.gray400}
            value={query}
            onChangeText={setQuery}
            autoFocus={true}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : hasSearched && results.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySub}>Try a different search term</Text>
        </View>
      ) : !hasSearched ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Search for products</Text>
          <Text style={styles.emptySub}>Type in the box above to find what you need</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Bottom Tab Bar (if you want it here; optional, can be removed if not needed) */}
      <BottomTabBar navigation={navigation} activeScreen="Search" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF6F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Constants.statusBarHeight + 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: Colors.heroBg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Shadows.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.darkest,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 18,
    color: Colors.gray400,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkest,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.gray600,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,   // space for tab bar
  },
  productCard: {
    marginBottom: 10,
    padding: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productEmoji: {
    fontSize: 36,
    width: 48,
    textAlign: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.darkest,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});