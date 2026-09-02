import {
  finishWorkout as repoFinishWorkout,
  getTrackPoints,
} from '../services/workoutRepo';
import { calculatePaceSeries, calculateAvgPace, calculateAvgSpeedKmh, calculateCalories } from '../domain/metrics';
import { getSettings } from '../services/settingsRepo';
import { useTrackingStore } from '../stores/trackingStore';
import { stopTracking } from './trackingEngine';

export async function finishCurrentWorkout(): Promise<void> {
  const state = useTrackingStore.getState();
  const { workoutId, startTime, distanceM, durationS, sportType, pausedDurationS } = state;

  if (!workoutId || !startTime || !sportType) {
    throw new Error('无进行中的运动');
  }

  const finalDurationS = Math.max(
    durationS,
    Math.floor((Date.now() - startTime) / 1000) - pausedDurationS
  );

  await stopTracking();

  const points = await getTrackPoints(workoutId);
  const timestamps = points.map((p) => p.timestamp);
  let cumulativeDistances: number[] = [0];
  let totalDistance = 0;

  for (let i = 1; i < points.length; i++) {
    const { haversineDistance } = await import('../domain/geo');
    const d = haversineDistance(points[i - 1], points[i]);
    totalDistance += d;
    cumulativeDistances.push(totalDistance);
  }

  const paceSeries = calculatePaceSeries(timestamps, cumulativeDistances);
  const avgPaceS = calculateAvgPace(finalDurationS, distanceM);
  const avgSpeedKmh = calculateAvgSpeedKmh(finalDurationS, distanceM);

  const settings = await getSettings();
  const calories = calculateCalories(sportType, settings.weight_kg, finalDurationS);

  await repoFinishWorkout(workoutId, {
    endTime: Date.now(),
    durationS: finalDurationS,
    distanceM,
    avgPaceS,
    avgSpeedKmh,
    calories,
    paceSeries,
  });

  useTrackingStore.getState().reset();
}
