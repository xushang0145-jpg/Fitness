import { getDatabase } from '../db/database';
import type { SportType } from '../domain/filter';

export interface Workout {
  id: string;
  type: SportType;
  status: 'active' | 'done';
  start_time: number;
  end_time: number | null;
  duration_s: number;
  distance_m: number;
  avg_pace_s: number;
  avg_speed_kmh: number;
  calories: number;
  pace_series: string;
  created_at: number;
}

export interface TrackPoint {
  id?: number;
  workout_id: string;
  lat: number;
  lng: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  timestamp: number;
}

export interface CreateWorkoutParams {
  type: SportType;
  startTime: number;
}

export interface FinishWorkoutParams {
  endTime: number;
  durationS: number;
  distanceM: number;
  avgPaceS: number;
  avgSpeedKmh: number;
  calories: number;
  paceSeries: number[];
}

export async function createWorkout(params: CreateWorkoutParams): Promise<string> {
  const db = await getDatabase();
  const id = `w_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO workout (id, type, status, start_time, created_at)
     VALUES (?, ?, 'active', ?, ?)`,
    [id, params.type, params.startTime, now]
  );

  return id;
}

export async function finishWorkout(
  id: string,
  params: FinishWorkoutParams
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE workout
     SET status = 'done', end_time = ?, duration_s = ?, distance_m = ?,
         avg_pace_s = ?, avg_speed_kmh = ?, calories = ?, pace_series = ?
     WHERE id = ?`,
    [
      params.endTime,
      params.durationS,
      params.distanceM,
      params.avgPaceS,
      params.avgSpeedKmh,
      params.calories,
      JSON.stringify(params.paceSeries),
      id,
    ]
  );
}

export async function insertTrackPoints(points: TrackPoint[]): Promise<void> {
  if (points.length === 0) return;

  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    for (const p of points) {
      await db.runAsync(
        `INSERT INTO track_point (workout_id, lat, lng, altitude, accuracy, speed, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.workout_id, p.lat, p.lng, p.altitude, p.accuracy, p.speed, p.timestamp]
      );
    }
  });
}

export async function getActiveWorkout(): Promise<Workout | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Workout>(
    `SELECT * FROM workout WHERE status = 'active' ORDER BY start_time DESC LIMIT 1`
  );
  return result ?? null;
}

export async function getWorkoutById(id: string): Promise<Workout | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Workout>(
    `SELECT * FROM workout WHERE id = ?`,
    [id]
  );
  return result ?? null;
}

export async function getWorkoutList(
  type?: SportType,
  limit = 50,
  offset = 0
): Promise<Workout[]> {
  const db = await getDatabase();

  if (type) {
    return db.getAllAsync<Workout>(
      `SELECT * FROM workout WHERE status = 'done' AND type = ?
       ORDER BY start_time DESC LIMIT ? OFFSET ?`,
      [type, limit, offset]
    );
  }

  return db.getAllAsync<Workout>(
    `SELECT * FROM workout WHERE status = 'done'
     ORDER BY start_time DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

/** 导出用：全部已完成记录，按开始时间倒序，无分页上限 */
export async function listAllDone(): Promise<Workout[]> {
  const db = await getDatabase();
  return db.getAllAsync<Workout>(
    `SELECT * FROM workout WHERE status = 'done' ORDER BY start_time DESC`
  );
}

export async function getTrackPoints(workoutId: string): Promise<TrackPoint[]> {
  const db = await getDatabase();
  return db.getAllAsync<TrackPoint>(
    `SELECT * FROM track_point WHERE workout_id = ? ORDER BY timestamp ASC`,
    [workoutId]
  );
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM workout WHERE id = ?`, [id]);
}

export async function updateWorkoutDistance(id: string, distanceM: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE workout SET distance_m = ? WHERE id = ?`,
    [distanceM, id]
  );
}
