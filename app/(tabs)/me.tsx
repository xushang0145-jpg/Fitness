import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getWorkoutList, type Workout } from '@/services/workoutRepo';
import { formatDistance, formatDuration } from '@/domain/format';
import { colors, typography, spacing, radius } from '@/theme';

export default function MeScreen() {
  const router = useRouter();
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalDistanceM, setTotalDistanceM] = useState(0);
  const [totalDurationS, setTotalDurationS] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const workouts = await getWorkoutList();
    setTotalWorkouts(workouts.length);
    setTotalDistanceM(workouts.reduce((sum, w) => sum + w.distance_m, 0));
    setTotalDurationS(workouts.reduce((sum, w) => sum + w.duration_s, 0));
    setTotalCalories(workouts.reduce((sum, w) => sum + w.calories, 0));
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>F</Text>
        </View>
        <Text style={styles.name}>FitApp 用户</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>总次数</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatDistance(totalDistanceM)}</Text>
            <Text style={styles.statLabel}>总距离</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatDuration(totalDurationS)}</Text>
            <Text style={styles.statLabel}>总时长</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalCalories}</Text>
            <Text style={styles.statLabel}>总千卡</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => router.push('/settings')}
      >
        <Text style={styles.menuText}>设置</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.acc,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.bg,
  },
  name: {
    ...typography.sectionTitle,
    color: colors.txt,
  },
  statsCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.num,
    color: colors.txt,
    fontSize: 20,
  },
  statLabel: {
    ...typography.label,
    color: colors.txt3,
    marginTop: spacing.xs,
  },
  menuItem: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
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
});
