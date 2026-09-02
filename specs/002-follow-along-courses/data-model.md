# 数据模型：跟练课程

**Feature**: `002-follow-along-courses` | **Created**: 2026-09-02

## ER 关系

```
course 1 ──── n course_action
course 1 ──── n course_record
course_record 1 ──── n course_record_step
course_action 1 ──── n course_record_step（通过 action_id 弱引用）

settings（单行表，id=1，与 001 共用）
```

## 表结构

### course（课程，静态配置，可不建表）

MVP 将课程静态配置内置在 `assets/courses.json`（或 `data/courses.ts`），不写入 SQLite 迁移，避免后续更新课程时需要数据库迁移。但接口设计仍按表结构描述，便于未来后台化。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | TEXT PK | 唯一标识，如 `fat-burn-20` |
| title | TEXT NOT NULL | 课程标题 |
| subtitle | TEXT | 副标题 / 一句话描述 |
| category | TEXT NOT NULL | `fat_burn` / `shaping` / `stretch` / `full_body` |
| difficulty | TEXT NOT NULL | `beginner` / `intermediate` / `advanced` |
| duration_s | INTEGER NOT NULL | 预计总时长（秒） |
| calories_per_min | REAL | 每分钟估算消耗，用于动态计算 |
| met | REAL | 平均 MET 值 |
| equipment | TEXT | 器械要求，如 "无器械" / "哑铃" |
| cover_image | TEXT | 封面图本地路径或 asset 名 |
| description | TEXT | 课程简介 |

### course_action（课程动作，静态配置，可不建表）

同样以内置静态配置为主。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | TEXT PK | 唯一标识，如 `jumping-jack` |
| course_id | TEXT NOT NULL | 所属课程 id |
| order_index | INTEGER NOT NULL | 在课程中的顺序 |
| title | TEXT NOT NULL | 动作名称 |
| type | TEXT NOT NULL | `timer` / `counter` / `rest` |
| target_duration_s | INTEGER | timer / rest 类型的目标时长 |
| target_reps | INTEGER | counter 类型的目标次数 |
| sets | INTEGER DEFAULT 1 | 组数 |
| rest_between_sets_s | INTEGER DEFAULT 0 | 组间休息（秒） |
| image | TEXT | 示意图本地路径或 asset 名 |
| instruction | TEXT | 动作步骤说明 |
| breathing | TEXT | 呼吸提示 |
| common_mistake | TEXT | 常见错误 |

### course_record（跟练记录）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | TEXT PK | UUID v4 |
| course_id | TEXT NOT NULL | 课程 id |
| status | TEXT NOT NULL | `active` / `done` |
| start_time | INTEGER NOT NULL | epoch ms |
| end_time | INTEGER | epoch ms，done 时写入 |
| duration_s | INTEGER DEFAULT 0 | 实际总时长（秒） |
| completed_count | INTEGER DEFAULT 0 | 已完成动作数 |
| total_count | INTEGER NOT NULL | 课程总动作数 |
| calories | INTEGER DEFAULT 0 | 估算消耗（千卡） |
| created_at | INTEGER NOT NULL | epoch ms |

索引：`(status)`, `(start_time DESC)`, `(course_id)`

### course_record_step（跟练记录步骤）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| record_id | TEXT NOT NULL REFERENCES course_record(id) ON DELETE CASCADE | |
| action_id | TEXT NOT NULL | 动作 id（弱引用到静态配置） |
| order_index | INTEGER NOT NULL | 动作在课程中的顺序 |
| target_duration_s | INTEGER | 计划时长 |
| target_reps | INTEGER | 计划次数 |
| actual_duration_s | INTEGER DEFAULT 0 | 实际执行时长（秒） |
| actual_reps | INTEGER DEFAULT 0 | 实际完成次数 |
| status | TEXT NOT NULL | `pending` / `done` / `skipped` |
| finished_at | INTEGER | 完成时间 epoch ms |

索引：`(record_id, order_index)`

## TypeScript 类型（与 DB / 配置对应的领域模型）

```typescript
type CourseCategory = 'fat_burn' | 'shaping' | 'stretch' | 'full_body';
type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
type CourseActionType = 'timer' | 'counter' | 'rest';
type CourseRecordStatus = 'active' | 'done';
type CourseRecordStepStatus = 'pending' | 'done' | 'skipped';

interface Course {
  id: string;
  title: string;
  subtitle: string;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  durationS: number;
  caloriesPerMin?: number;
  met?: number;
  equipment: string;
  coverImage: string;
  description: string;
  actions: CourseAction[];
}

interface CourseAction {
  id: string;
  courseId: string;
  orderIndex: number;
  title: string;
  type: CourseActionType;
  targetDurationS?: number;
  targetReps?: number;
  sets?: number;
  restBetweenSetsS?: number;
  image?: string;
  instruction?: string;
  breathing?: string;
  commonMistake?: string;
}

interface CourseRecord {
  id: string;
  courseId: string;
  status: CourseRecordStatus;
  startTime: number;
  endTime?: number;
  durationS: number;
  completedCount: number;
  totalCount: number;
  calories: number;
  createdAt: number;
}

interface CourseRecordStep {
  id?: number;
  recordId: string;
  actionId: string;
  orderIndex: number;
  targetDurationS?: number;
  targetReps?: number;
  actualDurationS: number;
  actualReps: number;
  status: CourseRecordStepStatus;
  finishedAt?: number;
}
```

## 迁移策略

MVP 从 `user_version=2` 开始新增两张表：

```sql
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
```

**静态课程配置**通过 `assets/courses.json` 或 `data/courses.ts` 内置，不进入 SQLite 迁移；更新课程只需替换文件并重新打包。
