import * as SQLite from 'expo-sqlite';

const DB_NAME = 'fitapp.db';
const DB_VERSION = 2;

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < DB_VERSION) {
    await migrate(db, currentVersion, DB_VERSION);
  }

  return db;
}

async function migrate(
  database: SQLite.SQLiteDatabase,
  fromVersion: number,
  toVersion: number
): Promise<void> {
  if (fromVersion < 1) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS workout (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('run', 'ride', 'walk')),
        status TEXT NOT NULL CHECK(status IN ('active', 'done')),
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration_s INTEGER DEFAULT 0,
        distance_m REAL DEFAULT 0,
        avg_pace_s INTEGER DEFAULT 0,
        avg_speed_kmh REAL DEFAULT 0,
        calories INTEGER DEFAULT 0,
        pace_series TEXT DEFAULT '[]',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS track_point (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        altitude REAL,
        accuracy REAL,
        speed REAL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (workout_id) REFERENCES workout(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_track_point_workout ON track_point(workout_id);
      CREATE INDEX IF NOT EXISTS idx_workout_start_time ON workout(start_time DESC);
      CREATE INDEX IF NOT EXISTS idx_workout_status ON workout(status);

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        weekly_goal_km REAL DEFAULT 30,
        weight_kg REAL DEFAULT 65
      );

      INSERT OR IGNORE INTO settings (id) VALUES (1);

      PRAGMA user_version = 1;
    `);
  }

  if (fromVersion < 2) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS course_record (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active', 'done')),
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration_s INTEGER DEFAULT 0,
        completed_count INTEGER DEFAULT 0,
        total_count INTEGER NOT NULL,
        calories INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_course_record_status ON course_record(status);
      CREATE INDEX IF NOT EXISTS idx_course_record_start_time ON course_record(start_time DESC);
      CREATE INDEX IF NOT EXISTS idx_course_record_course_id ON course_record(course_id);

      CREATE TABLE IF NOT EXISTS course_record_step (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id TEXT NOT NULL,
        action_id TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        target_duration_s INTEGER,
        target_reps INTEGER,
        actual_duration_s INTEGER DEFAULT 0,
        actual_reps INTEGER DEFAULT 0,
        status TEXT NOT NULL CHECK(status IN ('pending', 'done', 'skipped')),
        finished_at INTEGER,
        FOREIGN KEY (record_id) REFERENCES course_record(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_course_record_step_record ON course_record_step(record_id, order_index);

      PRAGMA user_version = 2;
    `);
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
