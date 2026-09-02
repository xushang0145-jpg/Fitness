import { getDatabase } from '../db/database';
import type { CourseRecordStepStatus } from '../domain/course';

export interface CourseRecordRow {
  id: string;
  course_id: string;
  status: 'active' | 'done';
  start_time: number;
  end_time: number | null;
  duration_s: number;
  completed_count: number;
  total_count: number;
  calories: number;
  created_at: number;
}

export interface CourseRecordStepRow {
  id?: number;
  record_id: string;
  action_id: string;
  order_index: number;
  target_duration_s: number | null;
  target_reps: number | null;
  actual_duration_s: number;
  actual_reps: number;
  status: CourseRecordStepStatus;
  finished_at: number | null;
}

export interface FinishCourseRecordParams {
  endTime: number;
  durationS: number;
  completedCount: number;
  calories: number;
}

export interface NewStep {
  recordId: string;
  actionId: string;
  orderIndex: number;
  targetDurationS?: number;
  targetReps?: number;
}

export interface StepPatch {
  actualDurationS?: number;
  actualReps?: number;
  status?: CourseRecordStepStatus;
  finishedAt?: number;
}

export async function createActiveRecord(
  courseId: string,
  totalCount: number
): Promise<string> {
  const db = await getDatabase();
  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO course_record (id, course_id, status, start_time, total_count, created_at)
     VALUES (?, ?, 'active', ?, ?, ?)`,
    [id, courseId, now, totalCount, now]
  );

  return id;
}

export async function finishRecord(
  id: string,
  params: FinishCourseRecordParams
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE course_record
     SET status = 'done', end_time = ?, duration_s = ?, completed_count = ?, calories = ?
     WHERE id = ?`,
    [params.endTime, params.durationS, params.completedCount, params.calories, id]
  );
}

export async function listRecords(limit = 50, offset = 0): Promise<CourseRecordRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<CourseRecordRow>(
    `SELECT * FROM course_record WHERE status = 'done'
     ORDER BY start_time DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

export async function getRecordById(id: string): Promise<CourseRecordRow | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<CourseRecordRow>(
    `SELECT * FROM course_record WHERE id = ?`,
    [id]
  );
  return result ?? null;
}

export async function removeRecord(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM course_record WHERE id = ?`, [id]);
}

export async function insertSteps(steps: NewStep[]): Promise<void> {
  if (steps.length === 0) return;

  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    for (const s of steps) {
      await db.runAsync(
        `INSERT INTO course_record_step
         (record_id, action_id, order_index, target_duration_s, target_reps, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [s.recordId, s.actionId, s.orderIndex, s.targetDurationS ?? null, s.targetReps ?? null]
      );
    }
  });
}

export async function updateStep(
  recordId: string,
  orderIndex: number,
  patch: StepPatch
): Promise<void> {
  const db = await getDatabase();

  const sets: string[] = [];
  const values: (number | string | null)[] = [];

  if (patch.actualDurationS !== undefined) {
    sets.push('actual_duration_s = ?');
    values.push(patch.actualDurationS);
  }
  if (patch.actualReps !== undefined) {
    sets.push('actual_reps = ?');
    values.push(patch.actualReps);
  }
  if (patch.status !== undefined) {
    sets.push('status = ?');
    values.push(patch.status);
  }
  if (patch.finishedAt !== undefined) {
    sets.push('finished_at = ?');
    values.push(patch.finishedAt);
  }

  if (sets.length === 0) return;

  values.push(recordId, orderIndex);
  await db.runAsync(
    `UPDATE course_record_step SET ${sets.join(', ')}
     WHERE record_id = ? AND order_index = ?`,
    values
  );
}

export async function getStepsByRecordId(
  recordId: string
): Promise<CourseRecordStepRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<CourseRecordStepRow>(
    `SELECT * FROM course_record_step WHERE record_id = ? ORDER BY order_index ASC`,
    [recordId]
  );
}

/** 启动时清理：把残留的 active 记录按已完成动作结算为 done */
export async function closeOrphanedActiveRecords(): Promise<void> {
  const db = await getDatabase();
  const orphans = await db.getAllAsync<{ id: string; start_time: number }>(
    `SELECT id, start_time FROM course_record WHERE status = 'active'`
  );

  for (const orphan of orphans) {
    const done = await db.getFirstAsync<{ cnt: number; actual: number }>(
      `SELECT COUNT(*) AS cnt, COALESCE(SUM(actual_duration_s), 0) AS actual
       FROM course_record_step WHERE record_id = ? AND status = 'done'`,
      [orphan.id]
    );
    const now = Date.now();
    const durationS = Math.min(
      done?.actual ?? 0,
      Math.floor((now - orphan.start_time) / 1000)
    );
    await db.runAsync(
      `UPDATE course_record
       SET status = 'done', end_time = ?, duration_s = ?, completed_count = ?, calories = 0
       WHERE id = ?`,
      [now, durationS, done?.cnt ?? 0, orphan.id]
    );
  }
}
