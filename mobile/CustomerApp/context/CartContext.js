import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const CartContext = createContext();
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  useEffect(() => { (async () => { const stored = await AsyncStorage.getItem('cart'); if (stored) setItems(JSON.parse(stored)); })(); }, []);
  const saveCart = async (cart) => { await AsyncStorage.setItem('cart', JSON.stringify(cart)); setItems(cart); };
  const addToCart = (product, qty = 1) => {
    const existing = items.find(i => i._id === product._id);
    let updated;
    if (existing) updated = items.map(i => i._id === product._id ? { ...i, qty: i.qty + qty } : i);
    else updated = [...items, { ...product, qty }];
    saveCart(updated);
  };
  const removeFromCart = (id) => saveCart(items.filter(i => i._id !== id));
  const updateQuantity = (id, qty) => { if (qty <= 0) return removeFromCart(id); saveCart(items.map(i => i._id === id ? { ...i, qty } : i)); };
  const clearCart = () => saveCart([]);
  const applyPromo = (code) => { setPromoCode(code); if (code === 'SAVE10') setDiscount(0.1); else setDiscount(0); };
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = subtotal * (1 - discount);
  return <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, promoCode, applyPromo, discount, subtotal, total }}>{children}</CartContext.Provider>;
};
export const useCart = () => useContext(CartContext);
