import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getWorkoutById, type Workout } from '@/services/workoutRepo';
import { formatDuration, formatDistance, formatPace, formatSpeed } from '@/domain/format';
import { colors, typography, spacing, radius } from '@/theme';

export default function FinishScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    if (id) {
      getWorkoutById(id).then(setWorkout);
    }
  }, [id]);

  if (!id) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>未找到运动记录</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
          <Text style={styles.buttonText}>返回首页</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>加载中...</Text>
      </View>
    );
  }

  const sportLabel =
    workout.type === 'run' ? '跑步' : workout.type === 'ride' ? '骑行' : '步行';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>运动完成</Text>
        <Text style={styles.subtitle}>{sportLabel}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>时长</Text>
          <Text style={styles.metricValue}>{formatDuration(workout.duration_s)}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>距离</Text>
          <Text style={styles.metricValue}>{formatDistance(workout.distance_m)}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>平均配速</Text>
          <Text style={styles.metricValue}>{formatPace(workout.avg_pace_s)}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>平均速度</Text>
          <Text style={styles.metricValue}>{formatSpeed(workout.avg_speed_kmh)}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>消耗</Text>
          <Text style={styles.metricValue}>{workout.calories} 千卡</Text>
        </View>
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>轨迹缩略图（待集成）</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
        <Text style={styles.buttonText}>返回首页</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  loading: {
    ...typography.label,
    color: colors.txt2,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.txt,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.label,
    color: colors.acc,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricLabel: {
    ...typography.label,
    color: colors.txt2,
  },
  metricValue: {
    ...typography.num,
    color: colors.txt,
    fontVariant: ['tabular-nums'],
  },
  mapPlaceholder: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  mapText: {
    ...typography.label,
    color: colors.txt2,
  },
  button: {
    backgroundColor: colors.acc,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.label,
    color: colors.bg,
    fontWeight: '600',
  },
});
