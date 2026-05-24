import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import EarningsHistoryScreen from './screens/EarningsHistoryScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import { ActivityIndicator, View } from 'react-native';
import MapScreen from './screens/MapScreen';
import 'leaflet/dist/leaflet.css';
import OrderAssignedScreen from './screens/OrderAssignedScreen';
import WaitingScreen from './screens/WaitingScreen';
import { ActiveOrderProvider } from './context/ActiveOrderContext';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
        <Stack.Screen name="OrderAssigned" component={OrderAssignedScreen} />
        <Stack.Screen name="Waiting" component={WaitingScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
                    <Stack.Screen name="EarningsHistory" component={EarningsHistoryScreen} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          {/* other authenticated screens */}
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ActiveOrderProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ActiveOrderProvider>
    </AuthProvider>
  );
}