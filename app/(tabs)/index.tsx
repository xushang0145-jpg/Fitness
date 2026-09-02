import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { startTracking } from '@/services/trackingEngine';
import { getWorkoutList, type Workout } from '@/services/workoutRepo';
import { getSettings } from '@/services/settingsRepo';
import { getWeekStart, calculateWeeklyStats, estimateSteps } from '@/domain/stats';
import { formatDistance } from '@/domain/format';
import { colors, typography, spacing, radius } from '@/theme';
import type { SportType } from '@/domain/filter';

export default function HomeScreen() {
  const router = useRouter();
  const [weeklyGoalKm, setWeeklyGoalKm] = useState(30);
  const [weeklyDistanceM, setWeeklyDistanceM] = useState(0);
  const [todaySteps, setTodaySteps] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const settings = await getSettings();
    setWeeklyGoalKm(settings.weekly_goal_km);

    const workouts = await getWorkoutList();
    const workoutRecords = workouts.map((w) => ({
      ...w,
      end_time: w.end_time ?? w.start_time + w.duration_s * 1000,
    }));
    const weekStart = getWeekStart(Date.now());
    const stats = calculateWeeklyStats(workoutRecords, weekStart);
    setWeeklyDistanceM(stats.totalDistanceM);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWorkouts = workouts.filter((w) => w.start_time >= today.getTime());
    const todayDistance = todayWorkouts.reduce((sum, w) => sum + w.distance_m, 0);
    setTodaySteps(estimateSteps(todayDistance));
    setTodayCalories(todayWorkouts.reduce((sum, w) => sum + w.calories, 0));
  }

  const handleStart = async (type: SportType) => {
    try {
      const workoutId = await startTracking(type);
      router.push('/workout/live');
    } catch (error: any) {
      Alert.alert('启动失败', error.message);
    }
  };

  const progress = Math.min(weeklyDistanceM / (weeklyGoalKm * 1000), 1);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>今天也要加油哦</Text>
      </View>

      <View style={styles.goalCard}>
        <Text style={styles.goalTitle}>本周目标</Text>
        <View style={styles.progressRing}>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
        <Text style={styles.goalSubtitle}>
          {formatDistance(weeklyDistanceM)} / {weeklyGoalKm}km
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todaySteps}</Text>
          <Text style={styles.statLabel}>步数</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todayCalories}</Text>
          <Text style={styles.statLabel}>千卡</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>开始运动</Text>

      <TouchableOpacity
        style={[styles.sportCard, { backgroundColor: colors.acc }]}
        onPress={() => handleStart('run')}
      >
        <Text style={styles.sportTitle}>跑步</Text>
        <Text style={styles.sportSubtitle}>户外跑步</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sportCard, { backgroundColor: colors.blue }]}
        onPress={() => handleStart('ride')}
      >
        <Text style={styles.sportTitle}>骑行</Text>
        <Text style={styles.sportSubtitle}>户外骑行</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sportCard, { backgroundColor: colors.orange }]}
        onPress={() => handleStart('walk')}
      >
        <Text style={styles.sportTitle}>步行</Text>
        <Text style={styles.sportSubtitle}>户外步行</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.sectionTitle,
    color: colors.txt,
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  goalTitle: {
    ...typography.label,
    color: colors.txt2,
    marginBottom: spacing.md,
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: colors.acc,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressText: {
    ...typography.num,
    color: colors.acc,
    fontSize: 32,
  },
  goalSubtitle: {
    ...typography.label,
    color: colors.txt2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...typography.num,
    color: colors.txt,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...typography.label,
    color: colors.txt2,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.txt,
    marginBottom: spacing.md,
  },
  sportCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sportTitle: {
    ...typography.sectionTitle,
    color: colors.bg,
    fontWeight: '700',
  },
  sportSubtitle: {
    ...typography.label,
    color: colors.bg,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
});
