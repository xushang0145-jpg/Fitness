import type { SportType } from './filter';

export interface WorkoutRecord {
  id: string;
  type: SportType;
  start_time: number;
  end_time: number;
  duration_s: number;
  distance_m: number;
  calories: number;
}

export interface WeeklyStats {
  totalDistanceM: number;
  totalDurationS: number;
  totalCalories: number;
  workoutCount: number;
  byType: Record<SportType, { count: number; distanceM: number }>;
}

export function getWeekStart(timestamp: number): number {
  const d = new Date(timestamp);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

export function calculateWeeklyStats(
  workouts: WorkoutRecord[],
  weekStartTimestamp: number
): WeeklyStats {
  const weekEnd = weekStartTimestamp + 7 * 24 * 3600 * 1000;
  const weekWorkouts = workouts.filter(
    (w) => w.start_time >= weekStartTimestamp && w.start_time < weekEnd
  );

  const byType: Record<SportType, { count: number; distanceM: number }> = {
    run: { count: 0, distanceM: 0 },
    ride: { count: 0, distanceM: 0 },
    walk: { count: 0, distanceM: 0 },
  };

  let totalDistanceM = 0;
  let totalDurationS = 0;
  let totalCalories = 0;

  for (const w of weekWorkouts) {
    totalDistanceM += w.distance_m;
    totalDurationS += w.duration_s;
    totalCalories += w.calories;
    byType[w.type].count += 1;
    byType[w.type].distanceM += w.distance_m;
  }

  return {
    totalDistanceM,
    totalDurationS,
    totalCalories,
    workoutCount: weekWorkouts.length,
    byType,
  };
}

export function estimateSteps(distanceM: number): number {
  return Math.round(distanceM / 0.75);
}
