import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useOrders } from '../context/OrderContext';
import { Colors } from '../theme/theme';
export default function RateScreen({ route, navigation }) {
  const { order } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { rateOrder } = useOrders();
  const submit = async () => { await rateOrder(order._id, rating, comment); navigation.goBack(); };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate your experience</Text>
      <View style={styles.stars}>
        {[1,2,3,4,5].map(s => (
          <TouchableOpacity key={s} onPress={() => setRating(s)}>
            <Text style={[styles.star, s <= rating && styles.selected]}>{s <= rating ? '★' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput placeholder="Comment (optional)" value={comment} onChangeText={setComment} style={styles.input} multiline />
      <TouchableOpacity style={styles.btn} onPress={submit} disabled={rating === 0}>
        <Text style={[styles.btnText, rating === 0 && { opacity: 0.5 }]}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', backgroundColor: Colors.white },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  stars: { flexDirection: 'row', marginBottom: 16 },
  star: { fontSize: 40, marginHorizontal: 4, color: '#ccc' }, selected: { color: '#FFD700' },
  input: { width: '100%', borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 10, padding: 12, marginBottom: 16, minHeight: 80 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  btnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
});
