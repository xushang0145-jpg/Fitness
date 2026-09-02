export type CourseCategory = 'fat_burn' | 'shaping' | 'stretch' | 'full_body';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type CourseActionType = 'timer' | 'counter' | 'rest';
export type CourseRecordStatus = 'active' | 'done';
export type CourseRecordStepStatus = 'pending' | 'done' | 'skipped';

export interface Course {
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

export interface CourseAction {
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

/** 当前整体进度百分比：currentIndex 为已完成动作数（0 起） */
export function calcProgress(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  const done = Math.min(Math.max(currentIndex, 0), total);
  return Math.round((done / total) * 100);
}

/** 完成度百分比 */
export function calcCompletion(doneCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  const done = Math.min(Math.max(doneCount, 0), totalCount);
  return Math.round((done / totalCount) * 100);
}

/** 下一个动作索引；无下一个时返回 -1 */
export function nextActionIndex(total: number, currentIndex: number): number {
  const next = currentIndex + 1;
  return next < total ? next : -1;
}

/** 课程级消耗估算：MET × 体重 × 时长(h) × 完成度 */
export function calcCourseCalories(
  met: number,
  weightKg: number,
  durationS: number,
  completionRate: number
): number {
  if (durationS <= 0 || completionRate <= 0) return 0;
  const rate = Math.min(completionRate, 1);
  return Math.round(met * weightKg * (durationS / 3600) * rate);
}

/** 单个动作消耗估算：MET × 体重 × 时长(h) */
export function calcActionCalories(
  met: number,
  weightKg: number,
  durationS: number
): number {
  if (durationS <= 0) return 0;
  return Math.round(met * weightKg * (durationS / 3600));
}
