import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getWorkoutList, deleteWorkout, type Workout } from '@/services/workoutRepo';
import { formatDate, formatDuration, formatDistance, formatPace } from '@/domain/format';
import { colors, typography, spacing, radius } from '@/theme';
import type { SportType } from '@/domain/filter';

type FilterType = 'all' | SportType;

export default function HistoryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkouts();
  }, [filter]);

  async function loadWorkouts() {
    setLoading(true);
    const type = filter === 'all' ? undefined : filter;
    const data = await getWorkoutList(type);
    setWorkouts(data);
    setLoading(false);
  }

  const handleDelete = (id: string) => {
    Alert.alert('删除记录', '确定要删除这条运动记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkout(id);
          loadWorkouts();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Workout }) => {
    const sportLabel = item.type === 'run' ? '跑步' : item.type === 'ride' ? '骑行' : '步行';
    const sportColor = item.type === 'run' ? colors.acc : item.type === 'ride' ? colors.blue : colors.orange;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/workout/${item.id}`)}
        onLongPress={() => handleDelete(item.id)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.sportBadge, { backgroundColor: sportColor }]}>
            <Text style={styles.sportBadgeText}>{sportLabel}</Text>
          </View>
          <Text style={styles.date}>{formatDate(item.start_time)}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatDistance(item.distance_m)}</Text>
            <Text style={styles.metricLabel}>距离</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatDuration(item.duration_s)}</Text>
            <Text style={styles.metricLabel}>时长</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatPace(item.avg_pace_s)}</Text>
            <Text style={styles.metricLabel}>配速</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item.calories}</Text>
            <Text style={styles.metricLabel}>千卡</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['all', 'run', 'ride', 'walk'] as FilterType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, filter === type && styles.filterChipActive]}
            onPress={() => setFilter(type)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === type && styles.filterChipTextActive,
              ]}
            >
              {type === 'all' ? '全部' : type === 'run' ? '跑步' : type === 'ride' ? '骑行' : '步行'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Text style={styles.emptyText}>加载中...</Text>
      ) : workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>暂无运动记录</Text>
          <Text style={styles.emptyHint}>开始你的第一次运动吧</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  filterRow: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  filterChipActive: {
    backgroundColor: colors.acc,
  },
  filterChipText: {
    ...typography.label,
    color: colors.txt2,
  },
  filterChipTextActive: {
    color: colors.bg,
    fontWeight: '600',
  },
  list: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sportBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  sportBadgeText: {
    ...typography.label,
    color: colors.bg,
    fontWeight: '600',
  },
  date: {
    ...typography.label,
    color: colors.txt2,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.num,
    color: colors.txt,
    fontSize: 16,
  },
  metricLabel: {
    ...typography.label,
    color: colors.txt3,
    marginTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.sectionTitle,
    color: colors.txt2,
  },
  emptyHint: {
    ...typography.label,
    color: colors.txt3,
    marginTop: spacing.sm,
  },
});
