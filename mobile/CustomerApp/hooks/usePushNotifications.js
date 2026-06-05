import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import api from '../services/api';

export default function usePushNotifications(enabled) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    let sub1, sub2;

    registerForPushNotificationsAsync().then(token => {
      if (token) saveTokenToBackend(token);
    });

    sub1 = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });
    sub2 = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      if (sub1) sub1.remove();
      if (sub2) sub2.remove();
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