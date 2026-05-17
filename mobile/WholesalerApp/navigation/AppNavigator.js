import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { WholesalerProvider } from '../context/WholesalerContext';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import ProductManagementScreen from '../screens/ProductManagementScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SetLocationScreen from '../screens/SetLocationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { wholesaler, loading } = useAuth();

  if (loading) {
    return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <WholesalerProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {wholesaler ? (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Orders" component={OrdersScreen} />
              <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
              <Stack.Screen name="Products" component={ProductManagementScreen} />
              <Stack.Screen name="Earnings" component={EarningsScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="SetLocation" component={SetLocationScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </WholesalerProvider>
  );
};

export default AppNavigator;
