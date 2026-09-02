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

export interface CourseRecordLite {
  id: string;
  start_time: number;
  duration_s: number;
  calories: number;
}

export interface CombinedStats {
  /** 总训练次数 = 运动次数 + 跟练次数 */
  totalCount: number;
  totalDurationS: number;
  totalCalories: number;
  /** 距离仅来自运动记录 */
  totalDistanceM: number;
  /** 近 7 天有训练（运动或跟练）的天数 */
  activeDaysLast7: number;
}

export function calculateCombinedStats(
  workouts: WorkoutRecord[],
  courseRecords: CourseRecordLite[],
  now: number
): CombinedStats {
  let totalDurationS = 0;
  let totalCalories = 0;
  let totalDistanceM = 0;

  const activeDays = new Set<string>();
  const windowStart = new Date(now);
  windowStart.setHours(0, 0, 0, 0);
  const windowStartMs = windowStart.getTime() - 6 * 24 * 3600 * 1000;

  const dayKey = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  for (const w of workouts) {
    totalDurationS += w.duration_s;
    totalCalories += w.calories;
    totalDistanceM += w.distance_m;
    if (w.start_time >= windowStartMs && w.start_time <= now) {
      activeDays.add(dayKey(w.start_time));
    }
  }

  for (const c of courseRecords) {
    totalDurationS += c.duration_s;
    totalCalories += c.calories;
    if (c.start_time >= windowStartMs && c.start_time <= now) {
      activeDays.add(dayKey(c.start_time));
    }
  }

  return {
    totalCount: workouts.length + courseRecords.length,
    totalDurationS,
    totalCalories,
    totalDistanceM,
    activeDaysLast7: activeDays.size,
  };
}
