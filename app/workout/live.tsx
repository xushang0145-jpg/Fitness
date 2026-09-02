import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MapView, Polyline, MapType } from 'react-native-amap3d';
import { useTrackingStore } from '@/stores/trackingStore';
import { pauseTracking, resumeTracking } from '@/services/trackingEngine';
import { finishCurrentWorkout } from '@/services/finishWorkout';
import { formatDuration, formatDistance, formatPace } from '@/domain/format';
import { colors, typography, spacing, radius } from '@/theme';

export default function LiveScreen() {
  const router = useRouter();
  const {
    status,
    sportType,
    workoutId,
    distanceM,
    durationS,
    currentSpeedKmh,
    calories,
    startTime,
    pausedDurationS,
    lastPauseTime,
    trackPoints,
  } = useTrackingStore();

  const mapRef = useRef<MapView>(null);

  const [avgPaceS, setAvgPaceS] = useState(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status === 'idle') {
      router.replace('/');
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'active') return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (distanceM > 0 && durationS > 0) {
      setAvgPaceS(Math.round((durationS / distanceM) * 1000));
    }
  }, [distanceM, durationS]);

  const handlePauseResume = async () => {
    if (status === 'active') {
      await pauseTracking();
    } else if (status === 'paused') {
      await resumeTracking();
    }
  };

  const handleFinish = () => {
    Alert.alert('结束运动', '确定要结束并保存本次运动吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '结束',
        style: 'destructive',
        onPress: async () => {
          await finishCurrentWorkout();
          if (workoutId) {
            router.replace({ pathname: '/workout/finish', params: { id: workoutId } });
          } else {
            router.replace('/');
          }
        },
      },
    ]);
  };

  const sportLabel = sportType === 'run' ? '跑步' : sportType === 'ride' ? '骑行' : '步行';

  const displayDurationS = (() => {
    if (startTime == null) return durationS;
    const end = status === 'paused' && lastPauseTime != null ? lastPauseTime : Date.now();
    return Math.max(0, Math.floor((end - startTime) / 1000) - pausedDurationS);
  })();

  const latLngs = trackPoints.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const lastPoint = latLngs.length > 0 ? latLngs[latLngs.length - 1] : undefined;

  useEffect(() => {
    if (lastPoint && mapRef.current) {
      mapRef.current.moveCamera({ target: lastPoint, zoom: 17 }, 300);
    }
  }, [trackPoints.length]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={MapType.Standard}
        myLocationEnabled
        initialCameraPosition={
          lastPoint
            ? { target: lastPoint, zoom: 17 }
            : { target: { latitude: 39.9042, longitude: 116.4074 }, zoom: 15 }
        }
      >
        {latLngs.length >= 2 && (
          <Polyline points={latLngs} width={5} color={colors.acc} colors={[]} />
        )}
      </MapView>

      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.sportType}>{sportLabel}</Text>
          <View style={[styles.statusBadge, status === 'paused' && styles.statusPaused]}>
            <Text style={styles.statusText}>
              {status === 'active' ? '记录中' : '已暂停'}
            </Text>
          </View>
        </View>

        <Text style={styles.duration}>{formatDuration(displayDurationS)}</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatDistance(distanceM)}</Text>
            <Text style={styles.metricLabel}>距离</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatPace(avgPaceS)}</Text>
            <Text style={styles.metricLabel}>配速</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{calories}</Text>
            <Text style={styles.metricLabel}>千卡</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handlePauseResume}
          >
            <Text style={styles.buttonText}>
              {status === 'active' ? '暂停' : '继续'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={handleFinish}
          >
            <Text style={styles.buttonText}>结束</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  map: {
    flex: 1,
  },
  panel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sportType: {
    ...typography.sectionTitle,
    color: colors.txt,
  },
  statusBadge: {
    backgroundColor: colors.acc,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusPaused: {
    backgroundColor: colors.orange,
  },
  statusText: {
    ...typography.label,
    color: colors.bg,
    fontWeight: '600',
  },
  duration: {
    ...typography.num,
    color: colors.txt,
    textAlign: 'center',
    marginVertical: spacing.lg,
    fontVariant: ['tabular-nums'],
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.num,
    color: colors.acc,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    ...typography.label,
    color: colors.txt2,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.blue,
  },
  buttonDanger: {
    backgroundColor: colors.orange,
  },
  buttonText: {
    ...typography.label,
    color: colors.bg,
    fontWeight: '600',
  },
});
