import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { wgs84ToGcj02 } from '../domain/coord';
import { isValidPoint, type TrackPointInput, type SportType } from '../domain/filter';
import { haversineDistance } from '../domain/geo';
import { calculateCalories, calculateAvgSpeedKmh } from '../domain/metrics';
import {
  createWorkout,
  insertTrackPoints,
  updateWorkoutDistance,
  type TrackPoint,
} from '../services/workoutRepo';
import { getSettings } from '../services/settingsRepo';
import { useTrackingStore } from '../stores/trackingStore';

const LOCATION_TASK_NAME = 'fitapp-background-location';
const BATCH_SIZE = 5;
const BATCH_INTERVAL_MS = 15000;

let locationSubscription: Location.LocationSubscription | null = null;
let pendingPoints: TrackPoint[] = [];
let lastAcceptedPoint: TrackPointInput | null = null;
let batchTimer: ReturnType<typeof setInterval> | null = null;

export async function startTracking(sportType: SportType): Promise<string> {
  const { status } = useTrackingStore.getState();
  if (status !== 'idle') {
    throw new Error('已有进行中的运动');
  }

  const { status: permission } = await Location.requestForegroundPermissionsAsync();
  if (permission !== 'granted') {
    throw new Error('定位权限被拒绝');
  }

  const { status: bgPermission } = await Location.requestBackgroundPermissionsAsync();
  if (bgPermission !== 'granted') {
    console.warn('后台定位权限未授予，锁屏后将停止记录');
  }

  const startTime = Date.now();
  const workoutId = await createWorkout({ type: sportType, startTime });

  useTrackingStore.getState().start(workoutId, sportType, startTime);

  lastAcceptedPoint = null;
  pendingPoints = [];

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 3000,
    distanceInterval: 5,
    foregroundService: {
      notificationTitle: 'FitApp 运动记录中',
      notificationBody: '正在记录你的运动轨迹',
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
  });

  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 3000,
      distanceInterval: 5,
    },
    (location) => handleLocationUpdate(location, sportType, workoutId)
  );

  startBatchTimer();

  return workoutId;
}

function handleLocationUpdate(
  location: Location.LocationObject,
  sportType: SportType,
  workoutId: string
): void {
  const { status } = useTrackingStore.getState();
  if (status !== 'active') return;

  const wgs84 = {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  };
  const gcj02 = wgs84ToGcj02(wgs84);

  const point: TrackPointInput = {
    lat: gcj02.lat,
    lng: gcj02.lng,
    accuracy: location.coords.accuracy,
    timestamp: location.timestamp,
  };

  if (!isValidPoint(point, lastAcceptedPoint, sportType)) {
    return;
  }

  const trackPoint: TrackPoint = {
    workout_id: workoutId,
    lat: gcj02.lat,
    lng: gcj02.lng,
    altitude: location.coords.altitude,
    accuracy: location.coords.accuracy,
    speed: location.coords.speed,
    timestamp: location.timestamp,
  };

  pendingPoints.push(trackPoint);
  lastAcceptedPoint = point;

  useTrackingStore.getState().addPoint(gcj02, location.timestamp);

  updateMetrics(workoutId);

  if (pendingPoints.length >= BATCH_SIZE) {
    flushPendingPoints();
  }
}

async function updateMetrics(workoutId: string): Promise<void> {
  const state = useTrackingStore.getState();
  const { trackPoints, startTime, pausedDurationS, sportType } = state;

  if (!startTime || !sportType) return;

  let distanceM = 0;
  for (let i = 1; i < trackPoints.length; i++) {
    distanceM += haversineDistance(trackPoints[i - 1], trackPoints[i]);
  }

  const durationS = Math.floor((Date.now() - startTime) / 1000) - pausedDurationS;
  const speedKmh = calculateAvgSpeedKmh(durationS, distanceM);

  const settings = await getSettings();
  const calories = calculateCalories(sportType, settings.weight_kg, durationS);

  state.updateMetrics(distanceM, durationS, speedKmh, calories);

  await updateWorkoutDistance(workoutId, distanceM);
}

function startBatchTimer(): void {
  if (batchTimer) clearInterval(batchTimer);
  batchTimer = setInterval(() => {
    flushPendingPoints();
  }, BATCH_INTERVAL_MS);
}

async function flushPendingPoints(): Promise<void> {
  if (pendingPoints.length === 0) return;

  const points = [...pendingPoints];
  pendingPoints = [];

  try {
    await insertTrackPoints(points);
  } catch (error) {
    console.error('批量插入轨迹点失败', error);
    pendingPoints.unshift(...points);
  }
}

export async function pauseTracking(): Promise<void> {
  useTrackingStore.getState().pause();
}

export async function resumeTracking(): Promise<void> {
  useTrackingStore.getState().resume();
}

export async function stopTracking(): Promise<void> {
  await flushPendingPoints();

  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }

  const hasTask = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasTask) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }

  if (batchTimer) {
    clearInterval(batchTimer);
    batchTimer = null;
  }

  useTrackingStore.getState().finish();
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('后台定位任务错误', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const state = useTrackingStore.getState();

    if (state.status !== 'active' || !state.workoutId || !state.sportType) {
      return;
    }

    for (const location of locations) {
      handleLocationUpdate(location, state.sportType, state.workoutId);
    }
  }
});

export async function recoverActiveWorkout(): Promise<boolean> {
  const { getActiveWorkout, getTrackPoints } = await import('../services/workoutRepo');
  const activeWorkout = await getActiveWorkout();

  if (!activeWorkout) {
    return false;
  }

  const points = await getTrackPoints(activeWorkout.id);

  const trackPoints = points.map((p) => ({ lat: p.lat, lng: p.lng }));
  const lastPoint = points[points.length - 1];

  if (lastPoint) {
    lastAcceptedPoint = {
      lat: lastPoint.lat,
      lng: lastPoint.lng,
      accuracy: lastPoint.accuracy,
      timestamp: lastPoint.timestamp,
    };
  }

  let distanceM = 0;
  for (let i = 1; i < trackPoints.length; i++) {
    distanceM += haversineDistance(trackPoints[i - 1], trackPoints[i]);
  }

  const now = Date.now();
  const durationS = Math.floor((now - activeWorkout.start_time) / 1000);
  const speedKmh = calculateAvgSpeedKmh(durationS, distanceM);

  const settings = await getSettings();
  const calories = calculateCalories(activeWorkout.type, settings.weight_kg, durationS);

  useTrackingStore.setState({
    status: 'active',
    workoutId: activeWorkout.id,
    sportType: activeWorkout.type,
    startTime: activeWorkout.start_time,
    pausedDurationS: 0,
    lastPauseTime: null,
    currentPoint: trackPoints[trackPoints.length - 1] ?? null,
    trackPoints,
    distanceM,
    durationS,
    currentSpeedKmh: speedKmh,
    calories,
  });

  const { status: permission } = await Location.getForegroundPermissionsAsync();
  if (permission === 'granted') {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 3000,
      distanceInterval: 5,
      foregroundService: {
        notificationTitle: 'FitApp 运动记录中',
        notificationBody: '正在记录你的运动轨迹',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 3000,
        distanceInterval: 5,
      },
      (location) => handleLocationUpdate(location, activeWorkout.type, activeWorkout.id)
    );

    startBatchTimer();
  }

  return true;
}
