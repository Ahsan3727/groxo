import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
  };
const changeCartQuantity = (productId, delta) => {
  setCart(prevCart => {
    const newCart = prevCart.map(item =>
      item._id === productId
        ? { ...item, quantity: item.quantity + delta }
        : item
    ).filter(item => item.quantity > 0);
    return newCart;
  });
};
  const clearCart = () => setCart([]);

  return (
<CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, changeCartQuantity }}>      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);