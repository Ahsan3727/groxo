import React from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius } from '../theme';  // or your local theme

export default function InputGroup({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, editable = true, rightIcon }) {
  return (
    <View style={styles.container}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
      />
      {rightIcon ? (
        <TouchableOpacity onPress={rightIcon.onPress} style={styles.rightIconTouch}>
          <Text style={styles.rightIconText}>{rightIcon.icon}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray50,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.gray200,
    paddingHorizontal: 14, marginBottom: 10,
  },
  icon: { fontSize: 15, color: Colors.gray400, marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.gray900, letterSpacing: -0.2 },
  rightIconTouch: { padding: 4 },
  rightIconText: { fontSize: 18, color: Colors.gray500 },
});