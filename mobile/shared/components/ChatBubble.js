import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChatBubble = ({ message, isMine }) => (
  <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
    <Text style={{ color: isMine ? '#fff' : '#000' }}>{message.message}</Text>
    <Text style={[styles.time, isMine ? { color: '#eee' } : { color: '#666' }]}>{
      new Date(message.createdAt).toLocaleTimeString()
    }</Text>
  </View>
);

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginVertical: 4
  },
  mine: { alignSelf: 'flex-end', backgroundColor: '#4A90D9', borderBottomRightRadius: 0 },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#F0F0F0', borderBottomLeftRadius: 0 },
  time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' }
});

export default ChatBubble;
