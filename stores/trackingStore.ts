import { create } from 'zustand';
import type { SportType } from '../domain/filter';
import type { Coordinate } from '../domain/geo';

export type TrackingStatus = 'idle' | 'active' | 'paused';

interface TrackingState {
  status: TrackingStatus;
  workoutId: string | null;
  sportType: SportType | null;
  startTime: number | null;
  pausedDurationS: number;
  lastPauseTime: number | null;
  currentPoint: Coordinate | null;
  trackPoints: Coordinate[];
  distanceM: number;
  durationS: number;
  currentSpeedKmh: number;
  calories: number;

  start: (workoutId: string, sportType: SportType, startTime: number) => void;
  pause: () => void;
  resume: () => void;
  finish: () => void;
  addPoint: (point: Coordinate, timestamp: number) => void;
  updateMetrics: (distanceM: number, durationS: number, speedKmh: number, calories: number) => void;
  reset: () => void;
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  status: 'idle',
  workoutId: null,
  sportType: null,
  startTime: null,
  pausedDurationS: 0,
  lastPauseTime: null,
  currentPoint: null,
  trackPoints: [],
  distanceM: 0,
  durationS: 0,
  currentSpeedKmh: 0,
  calories: 0,

  start: (workoutId, sportType, startTime) =>
    set({
      status: 'active',
      workoutId,
      sportType,
      startTime,
      pausedDurationS: 0,
      lastPauseTime: null,
      currentPoint: null,
      trackPoints: [],
      distanceM: 0,
      durationS: 0,
      currentSpeedKmh: 0,
      calories: 0,
    }),

  pause: () => {
    const { status } = get();
    if (status !== 'active') return;
    set({ status: 'paused', lastPauseTime: Date.now() });
  },

  resume: () => {
    const { status, lastPauseTime, pausedDurationS } = get();
    if (status !== 'paused' || !lastPauseTime) return;
    const pauseDuration = Math.floor((Date.now() - lastPauseTime) / 1000);
    set({
      status: 'active',
      pausedDurationS: pausedDurationS + pauseDuration,
      lastPauseTime: null,
    });
  },

  finish: () => set({ status: 'idle' }),

  addPoint: (point, timestamp) => {
    const { trackPoints, lastPauseTime } = get();
    set({
      currentPoint: point,
      trackPoints: [...trackPoints, point],
    });
  },

  updateMetrics: (distanceM, durationS, speedKmh, calories) =>
    set({ distanceM, durationS, currentSpeedKmh: speedKmh, calories }),

  reset: () =>
    set({
      status: 'idle',
      workoutId: null,
      sportType: null,
      startTime: null,
      pausedDurationS: 0,
      lastPauseTime: null,
      currentPoint: null,
      trackPoints: [],
      distanceM: 0,
      durationS: 0,
      currentSpeedKmh: 0,
      calories: 0,
    }),
}));
