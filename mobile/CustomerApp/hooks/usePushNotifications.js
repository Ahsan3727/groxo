import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import api from '../services/api';

export default function usePushNotifications(enabled) {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // 1) Don't run on web AND when not authenticated
    if (!enabled || Platform.OS === 'web') return;

    // 2) Register for push notifications (real device only)
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        saveTokenToBackend(token);
      }
    });

    // 3) Listen for incoming notifications while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // 4) Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // You can navigate here based on response.notification.request.content.data
    });

    return () => {
      // Use the subscription remove() method directly
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [enabled]);

  const saveTokenToBackend = async (token) => {
    try {
      await api.put('/auth/push-token', { expoPushToken: token });
    } catch (error) {
      console.error('Failed to save push token', error);
    }
  };
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for notifications!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token;
}