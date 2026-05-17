import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function NoInternetBanner({ onRetry }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>No internet connection</Text>
      <TouchableOpacity onPress={onRetry}><Text style={styles.retry}>Retry</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  banner: { backgroundColor:'#ffcc00', padding:10, flexDirection:'row', justifyContent:'space-between' },
  text: { fontWeight:'bold' },
  retry: { fontWeight:'bold', color:'blue' }
});
