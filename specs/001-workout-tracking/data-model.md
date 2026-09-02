# 数据模型：运动记录

**Feature**: `001-workout-tracking` | **Created**: 2026-09-01

## ER 关系

```
workout 1 ──── n track_point
settings（单行表，id=1）
```

## 表结构

### workout（运动记录）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| type | TEXT NOT NULL | `run` / `ride` / `walk` |
| status | TEXT NOT NULL | `active` / `done`（active 仅应存在 1 条） |
| start_time | INTEGER NOT NULL | epoch ms |
| end_time | INTEGER | epoch ms，done 时写入 |
| duration_s | REAL NOT NULL DEFAULT 0 | 运动时长（秒，不含暂停） |
| distance_m | REAL NOT NULL DEFAULT 0 | 总距离（米） |
| avg_pace_s | REAL | 平均配速 秒/公里（run/walk） |
| avg_speed_kmh | REAL | 平均速度（ride） |
| calories | REAL | 估算千卡（MET 公式） |
| pace_series | TEXT | JSON 数组，每公里配速序列（配速曲线用） |
| created_at | INTEGER NOT NULL | epoch ms |

索引：`(status)`, `(start_time DESC)`, `(type, start_time DESC)`

### track_point（轨迹点）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| workout_id | INTEGER NOT NULL REFERENCES workout(id) ON DELETE CASCADE | |
| lat | REAL NOT NULL | 纬度（GCJ-02） |
| lng | REAL NOT NULL | 经度（GCJ-02） |
| altitude | REAL | 海拔（米，可空） |
| accuracy | REAL | 水平精度（米） |
| speed | REAL | 瞬时速度 m/s（系统返回值，可空） |
| timestamp | INTEGER NOT NULL | epoch ms |

索引：`(workout_id, timestamp)`

### settings（用户设置，单行）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK CHECK (id = 1) | 恒为 1 |
| weekly_goal_km | REAL NOT NULL DEFAULT 30 | 每周距离目标（公里） |
| weight_kg | REAL NOT NULL DEFAULT 65 | 体重（卡路里估算） |

## TypeScript 类型（与 DB 对应的领域模型）

```typescript
type WorkoutType = 'run' | 'ride' | 'walk';
type WorkoutStatus = 'active' | 'done';

interface Workout {
  id: number;
  type: WorkoutType;
  status: WorkoutStatus;
  startTime: number;
  endTime?: number;
  durationS: number;
  distanceM: number;
  avgPaceS?: number;
  avgSpeedKmh?: number;
  calories?: number;
  paceSeries?: number[];
  createdAt: number;
}

interface TrackPoint {
  id?: number;
  workoutId: number;
  lat: number;
  lng: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  timestamp: number;
}

interface Settings {
  weeklyGoalKm: number;
  weightKg: number;
}
```

## 迁移策略

MVP 单版本：`db.execAsync` 执行 `CREATE TABLE IF NOT EXISTS` 三张表 + `PRAGMA user_version = 1`。后续版本通过 user_version 递增迁移。
