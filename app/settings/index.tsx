import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getSettings, updateWeeklyGoal, updateWeight } from '@/services/settingsRepo';
import { colors, typography, spacing, radius } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const [weeklyGoalKm, setWeeklyGoalKm] = useState('30');
  const [weightKg, setWeightKg] = useState('65');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const settings = await getSettings();
    setWeeklyGoalKm(String(settings.weekly_goal_km));
    setWeightKg(String(settings.weight_kg));
  }

  const handleSave = async () => {
    const goal = parseFloat(weeklyGoalKm);
    const weight = parseFloat(weightKg);

    if (isNaN(goal) || goal <= 0) {
      Alert.alert('输入错误', '周目标必须是大于 0 的数字');
      return;
    }

    if (isNaN(weight) || weight <= 0) {
      Alert.alert('输入错误', '体重必须是大于 0 的数字');
      return;
    }

    await updateWeeklyGoal(goal);
    await updateWeight(weight);

    Alert.alert('保存成功', '', [
      { text: '确定', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/settings/export')}
        >
          <Text style={styles.menuText}>数据导出</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>每周目标（公里）</Text>
            <TextInput
              style={styles.input}
              value={weeklyGoalKm}
              onChangeText={setWeeklyGoalKm}
              keyboardType="decimal-pad"
              placeholder="30"
              placeholderTextColor={colors.txt3}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>体重（公斤）</Text>
            <TextInput
              style={styles.input}
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
              placeholder="65"
              placeholderTextColor={colors.txt3}
            />
            <Text style={styles.hint}>用于计算运动消耗的卡路里</Text>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>保存</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  menuItem: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuText: {
    ...typography.label,
    color: colors.txt,
  },
  menuArrow: {
    fontSize: 24,
    color: colors.txt3,
  },
  form: {
    padding: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.txt,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.num,
    color: colors.txt,
    fontSize: 16,
  },
  hint: {
    ...typography.label,
    color: colors.txt3,
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.acc,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: {
    ...typography.label,
    color: colors.bg,
    fontWeight: '600',
    fontSize: 16,
  },
});
