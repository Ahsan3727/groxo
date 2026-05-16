import React from 'react';
import { AuthProvider } from '../../shared/hooks/useAuth';
import { CartProvider } from '../../shared/context/CartContext';
import AppNavigator from './navigation/AppNavigator';

const App = () => (
  <AuthProvider>
    <CartProvider>
      <AppNavigator />
    </CartProvider>
  </AuthProvider>
);

export default App;
