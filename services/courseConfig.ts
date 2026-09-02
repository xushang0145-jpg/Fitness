import { COURSES } from '../data/courses';
import type { Course, CourseAction, CourseCategory, CourseDifficulty } from '../domain/course';

const VALID_CATEGORIES: CourseCategory[] = ['fat_burn', 'shaping', 'stretch', 'full_body'];
const VALID_DIFFICULTIES: CourseDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const VALID_TYPES = ['timer', 'counter', 'rest'];

let cached: Course[] | null = null;

function isValidAction(action: CourseAction, courseId: string): boolean {
  if (!action.id || !action.title || !VALID_TYPES.includes(action.type)) {
    return false;
  }
  if (action.courseId !== courseId) return false;
  if (action.type === 'counter' && !(action.targetReps && action.targetReps > 0)) {
    return false;
  }
  if ((action.type === 'timer' || action.type === 'rest') &&
      !(action.targetDurationS && action.targetDurationS > 0)) {
    return false;
  }
  return true;
}

function isValidCourse(course: Course): boolean {
  if (!course.id || !course.title) return false;
  if (!VALID_CATEGORIES.includes(course.category)) return false;
  if (!VALID_DIFFICULTIES.includes(course.difficulty)) return false;
  if (!(course.durationS > 0)) return false;
  if (!Array.isArray(course.actions) || course.actions.length === 0) return false;
  return course.actions.every((a) => isValidAction(a, course.id));
}

/** 加载并校验内置课程；字段缺失的课程会被过滤并记录日志，不阻塞其他课程 */
export function getCourses(): Course[] {
  if (cached) return cached;

  cached = COURSES.filter((course) => {
    const valid = isValidCourse(course);
    if (!valid) {
      console.error(`内置课程配置无效，已跳过: ${course?.id ?? 'unknown'}`);
    }
    return valid;
  });

  return cached;
}

export function getCourseById(id: string): Course | null {
  return getCourses().find((c) => c.id === id) ?? null;
}

export function getActionById(
  actionId: string
): { action: CourseAction; course: Course } | null {
  for (const course of getCourses()) {
    const action = course.actions.find((a) => a.id === actionId);
    if (action) return { action, course };
  }
  return null;
}
