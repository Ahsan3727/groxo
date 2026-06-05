import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useCart } from '../context/CartContext';
import { Colors as GlobalColors, Fonts, Radius, Shadows } from '../theme';

// Theme colours
const Colors = {
  primary: '#FF7F2A',
  primaryLight: '#FFF0E5',
  white: '#FFFFFF',
  gray400: '#9CA3AF',
  darkest: '#3E2723',
  orangeText: '#8B4513',
  green: '#16a34a',
};

const FREE_DELIVERY_THRESHOLD = 1000;   // Rs. 1000

export default function CartSummaryBar({ navigation }) {
  const { cart, cartTotalItems } = useCart();
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const totalAmount = cart.reduce((sum, item) => sum + (item.adminPrice || item.price) * item.quantity, 0);
  const itemCount = cartTotalItems();
  const progress = Math.min(totalAmount / FREE_DELIVERY_THRESHOLD, 1);
  const remaining = FREE_DELIVERY_THRESHOLD - totalAmount;

  // Animate progress bar & fade in/out when cart changes
  useEffect(() => {
    if (itemCount > 0) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      // Animate progress bar
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: 600,
        useNativeDriver: false,
      }).start();
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      animatedWidth.setValue(0);
    }
  }, [itemCount, totalAmount]);

  if (itemCount === 0) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={() => navigation.navigate('Cart')}
        activeOpacity={0.85}
      >
        {/* Left side – cart summary */}
        <View style={styles.leftSection}>
          <Text style={styles.itemCount}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
          <Text style={styles.totalAmount}>Rs. {totalAmount.toFixed(2)}</Text>
        </View>

        {/* Center – progress info */}
        <View style={styles.centerSection}>
          {progress >= 1 ? (
            <Text style={styles.freeDeliveryText}>🎉 Free Delivery Earned!</Text>
          ) : (
            <Text style={styles.remainingText}>
              Add Rs. {remaining.toFixed(2)} more for free delivery
            </Text>
          )}
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: animatedWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: progress >= 1 ? Colors.green : Colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Right arrow */}
        <View style={styles.rightSection}>
          <Text style={styles.arrow}>→</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 70,                     // above the bottom tab bar
    left: 12,
    right: 12,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    ...Shadows.md,
    zIndex: 20,
    overflow: 'hidden',
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  leftSection: {
    marginRight: 12,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray400,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkest,
    marginTop: 2,
  },
  centerSection: {
    flex: 1,
  },
  freeDeliveryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.green,
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 11,
    color: Colors.orangeText,
    marginBottom: 4,
  },
  progressBarBackground: {
    height: 5,
    backgroundColor: '#FFD0B5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  rightSection: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '700',
  },
});