import { create } from 'zustand';
import type { Course, CourseRecordStepStatus } from '../domain/course';

export type CourseSessionStatus = 'idle' | 'running' | 'paused';

interface CourseSessionState {
  status: CourseSessionStatus;
  course: Course | null;
  recordId: string | null;
  currentIndex: number;
  /** 当前动作已进行秒数（timer / rest） */
  elapsedS: number;
  /** 当前计数动作已完成次数 */
  completedReps: number;
  /** 整节课实际训练秒数（不含暂停） */
  totalElapsedS: number;
  /** 每个动作的完成状态，与 course.actions 顺序对齐 */
  stepsState: CourseRecordStepStatus[];

  start: (course: Course, recordId: string) => void;
  pause: () => void;
  resume: () => void;
  tick: () => void;
  increment: () => void;
  decrement: () => void;
  /** 标记当前动作 done / skipped 并推进到下一个动作 */
  markCurrent: (status: 'done' | 'skipped') => void;
  reset: () => void;
}

const initialState = {
  status: 'idle' as CourseSessionStatus,
  course: null,
  recordId: null,
  currentIndex: 0,
  elapsedS: 0,
  completedReps: 0,
  totalElapsedS: 0,
  stepsState: [] as CourseRecordStepStatus[],
};

export const useCourseStore = create<CourseSessionState>((set, get) => ({
  ...initialState,

  start: (course, recordId) =>
    set({
      status: 'running',
      course,
      recordId,
      currentIndex: 0,
      elapsedS: 0,
      completedReps: 0,
      totalElapsedS: 0,
      stepsState: course.actions.map(() => 'pending' as CourseRecordStepStatus),
    }),

  pause: () => {
    if (get().status !== 'running') return;
    set({ status: 'paused' });
  },

  resume: () => {
    if (get().status !== 'paused') return;
    set({ status: 'running' });
  },

  tick: () => {
    const { status } = get();
    if (status !== 'running') return;
    set((s) => ({ elapsedS: s.elapsedS + 1, totalElapsedS: s.totalElapsedS + 1 }));
  },

  increment: () => {
    const { status, course, currentIndex, completedReps } = get();
    if (status !== 'running' || !course) return;
    const action = course.actions[currentIndex];
    if (action?.type !== 'counter') return;
    const target = action.targetReps ?? 0;
    if (completedReps >= target) return;
    set({ completedReps: completedReps + 1 });
  },

  decrement: () => {
    const { status, course, currentIndex, completedReps } = get();
    if (status !== 'running' || !course) return;
    if (course.actions[currentIndex]?.type !== 'counter') return;
    if (completedReps <= 0) return;
    set({ completedReps: completedReps - 1 });
  },

  markCurrent: (stepStatus) => {
    const { course, currentIndex, stepsState } = get();
    if (!course) return;
    const next = [...stepsState];
    next[currentIndex] = stepStatus;
    set({
      stepsState: next,
      currentIndex: Math.min(currentIndex + 1, course.actions.length - 1),
      elapsedS: 0,
      completedReps: 0,
    });
  },

  reset: () => set({ ...initialState }),
}));
