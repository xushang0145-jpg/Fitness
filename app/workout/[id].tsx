import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapView, Polyline, MapType } from 'react-native-amap3d';
import { getWorkoutById, getTrackPoints, deleteWorkout, type Workout, type TrackPoint } from '@/services/workoutRepo';
import { formatDate, formatTime, formatDuration, formatDistance, formatPace, formatSpeed } from '@/domain/format';
import { colors, typography, spacing, radius } from '@/theme';

export default function DetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const mapRef = useRef<MapView>(null);

  const latLngs = points.map((p) => ({ latitude: p.lat, longitude: p.lng }));

  useEffect(() => {
    if (latLngs.length >= 2 && mapRef.current) {
      const lats = latLngs.map((p) => p.latitude);
      const lngs = latLngs.map((p) => p.longitude);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const latSpan = Math.max(...lats) - Math.min(...lats);
      const lngSpan = Math.max(...lngs) - Math.min(...lngs);
      const span = Math.max(latSpan, lngSpan);
      const zoom = span > 0.05 ? 13 : span > 0.01 ? 15 : span > 0.002 ? 16 : 17;
      mapRef.current.moveCamera({ target: { latitude: centerLat, longitude: centerLng }, zoom }, 500);
    }
  }, [latLngs.length]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  async function loadData() {
    if (!id) return;
    const w = await getWorkoutById(id);
    const p = await getTrackPoints(id);
    setWorkout(w);
    setPoints(p);
  }

  const handleDelete = () => {
    Alert.alert('删除记录', '确定要删除这条运动记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          if (id) {
            await deleteWorkout(id);
            router.back();
          }
        },
      },
    ]);
  };

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sportType}>{sportLabel}</Text>
        <Text style={styles.date}>
          {formatDate(workout.start_time)} {formatTime(workout.start_time)}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          mapType={MapType.Standard}
          scrollGesturesEnabled
          zoomGesturesEnabled
        >
          {latLngs.length >= 2 && (
            <Polyline points={latLngs} width={5} color={colors.acc} colors={[]} />
          )}
        </MapView>
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

      {workout.pace_series && JSON.parse(workout.pace_series).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>配速曲线</Text>
          <Text style={styles.hint}>（图表待集成 react-native-svg）</Text>
        </View>
      )}

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>删除记录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    ...typography.label,
    color: colors.txt2,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  sportType: {
    ...typography.sectionTitle,
    color: colors.txt,
    fontSize: 24,
  },
  date: {
    ...typography.label,
    color: colors.txt2,
    marginTop: spacing.xs,
  },
  mapContainer: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  map: {
    height: 250,
  },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
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
    fontSize: 16,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.txt,
    marginBottom: spacing.md,
  },
  hint: {
    ...typography.label,
    color: colors.txt3,
  },
  deleteButton: {
    backgroundColor: colors.red,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  deleteButtonText: {
    ...typography.label,
    color: colors.bg,
    fontWeight: '600',
  },
});
