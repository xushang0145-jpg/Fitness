import { calcCourseCalories } from '../domain/course';
import { getCourseById } from './courseConfig';
import {
  createActiveRecord,
  finishRecord,
  insertSteps,
  updateStep,
} from './courseRepo';
import { getSettings } from './settingsRepo';
import { useCourseStore } from '../stores/courseStore';

let timer: ReturnType<typeof setInterval> | null = null;
let weightKg = 65;

function startTimer(): void {
  stopTimer();
  timer = setInterval(onTick, 1000);
}

function stopTimer(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function onTick(): void {
  const store = useCourseStore.getState();
  if (store.status !== 'running' || !store.course) return;

  store.tick();

  const state = useCourseStore.getState();
  const action = state.course?.actions[state.currentIndex];
  if (!action) return;

  if (
    (action.type === 'timer' || action.type === 'rest') &&
    action.targetDurationS &&
    state.elapsedS >= action.targetDurationS
  ) {
    void completeCurrent();
  }
}

export async function startCourse(courseId: string): Promise<void> {
  if (useCourseStore.getState().status !== 'idle') {
    throw new Error('已有进行中的跟练课程');
  }

  const course = getCourseById(courseId);
  if (!course) {
    throw new Error('课程不存在或配置无效');
  }

  const recordId = await createActiveRecord(course.id, course.actions.length);
  await insertSteps(
    course.actions.map((a) => ({
      recordId,
      actionId: a.id,
      orderIndex: a.orderIndex,
      targetDurationS: a.targetDurationS,
      targetReps: a.targetReps,
    }))
  );

  const settings = await getSettings();
  weightKg = settings.weight_kg;

  useCourseStore.getState().start(course, recordId);
  startTimer();
}

export function pauseCourse(): void {
  useCourseStore.getState().pause();
  stopTimer();
}

export function resumeCourse(): void {
  useCourseStore.getState().resume();
  if (useCourseStore.getState().status === 'running') {
    startTimer();
  }
}

function persistCurrentStep(status: 'done' | 'skipped'): void {
  const { course, recordId, currentIndex, elapsedS, completedReps } =
    useCourseStore.getState();
  if (!course || !recordId) return;

  const action = course.actions[currentIndex];
  const isCounter = action.type === 'counter';

  updateStep(recordId, action.orderIndex, {
    status,
    actualDurationS: isCounter ? 0 : elapsedS,
    actualReps: isCounter ? completedReps : 0,
    finishedAt: Date.now(),
  }).catch((error) => console.error('写入跟练步骤失败', error));
}

/** 完成当前动作并推进；最后一个动作完成时自动结算课程 */
export async function completeCurrent(): Promise<string | null> {
  const state = useCourseStore.getState();
  if (!state.course || state.status === 'idle') return null;

  persistCurrentStep('done');

  if (state.currentIndex >= state.course.actions.length - 1) {
    return finishCourse('done');
  }

  state.markCurrent('done');
  return null;
}

/** 跳过当前动作；最后一个动作被跳过时自动结算课程 */
export async function skipCurrent(): Promise<string | null> {
  const state = useCourseStore.getState();
  if (!state.course || state.status === 'idle') return null;

  persistCurrentStep('skipped');

  if (state.currentIndex >= state.course.actions.length - 1) {
    return finishCourse('skipped');
  }

  state.markCurrent('skipped');
  return null;
}

export function incrementReps(): void {
  const store = useCourseStore.getState();
  store.increment();

  const state = useCourseStore.getState();
  const action = state.course?.actions[state.currentIndex];
  if (
    action?.type === 'counter' &&
    action.targetReps &&
    state.completedReps >= action.targetReps
  ) {
    void completeCurrent();
  }
}

export function decrementReps(): void {
  useCourseStore.getState().decrement();
}

/**
 * 结算课程：更新 course_record，清理内存状态，返回记录 id。
 * 正常完成与提前结束都走这里；最后一个动作的状态由参数传入。
 */
async function finishCourse(lastStepStatus: 'done' | 'skipped'): Promise<string | null> {
  stopTimer();

  const state = useCourseStore.getState();
  const { course, recordId, totalElapsedS, stepsState, currentIndex } = state;
  if (!course || !recordId) return null;

  const finalSteps = [...stepsState];
  finalSteps[currentIndex] = lastStepStatus;
  const completedCount = finalSteps.filter((s) => s === 'done').length;
  const completionRate =
    course.actions.length > 0 ? completedCount / course.actions.length : 0;
  const calories = calcCourseCalories(
    course.met ?? 5,
    weightKg,
    totalElapsedS,
    completionRate
  );

  try {
    await finishRecord(recordId, {
      endTime: Date.now(),
      durationS: totalElapsedS,
      completedCount,
      calories,
    });
  } catch (error) {
    console.error('保存跟练记录失败', error);
  }

  useCourseStore.getState().reset();
  return recordId;
}

/** 提前结束课程：当前未完成的动作保持 pending，已完成的计入统计 */
export async function stopCourse(): Promise<string | null> {
  const state = useCourseStore.getState();
  if (!state.course || state.status === 'idle') return null;

  const finalSteps = [...state.stepsState];
  const completedCount = finalSteps.filter((s) => s === 'done').length;
  const completionRate =
    state.course.actions.length > 0 ? completedCount / state.course.actions.length : 0;
  const calories = calcCourseCalories(
    state.course.met ?? 5,
    weightKg,
    state.totalElapsedS,
    completionRate
  );

  stopTimer();

  const recordId = state.recordId;
  if (recordId) {
    try {
      await finishRecord(recordId, {
        endTime: Date.now(),
        durationS: state.totalElapsedS,
        completedCount,
        calories,
      });
    } catch (error) {
      console.error('保存跟练记录失败', error);
    }
  }

  useCourseStore.getState().reset();
  return recordId;
}
