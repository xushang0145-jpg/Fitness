import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme';

export default function TrainScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🏋️</Text>
      <Text style={styles.title}>跟练功能</Text>
      <Text style={styles.sub}>敬请期待 · 将在第二阶段开发</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 56 },
  title: { color: colors.txt, fontSize: 22, fontWeight: '700', marginTop: 16 },
  sub: { color: colors.txt3, fontSize: 14, marginTop: 8 },
});
