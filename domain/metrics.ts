import type { SportType } from './filter';

const MET_VALUES: Record<SportType, number> = {
  run: 9.8,
  ride: 7.5,
  walk: 3.5,
};

export function calculateCalories(
  sportType: SportType,
  weightKg: number,
  durationSeconds: number
): number {
  const hours = durationSeconds / 3600;
  return Math.round(MET_VALUES[sportType] * weightKg * hours);
}

export function calculatePaceSeries(
  timestamps: number[],
  cumulativeDistances: number[]
): number[] {
  if (timestamps.length < 2 || cumulativeDistances.length < 2) {
    return [];
  }

  const paces: number[] = [];
  const kmMark = 1000;
  let lastKm = 0;
  let lastTime = timestamps[0];

  for (let i = 1; i < cumulativeDistances.length; i++) {
    const currentKm = Math.floor(cumulativeDistances[i] / kmMark);
    if (currentKm > lastKm) {
      const timeForKm = (timestamps[i] - lastTime) / 1000;
      paces.push(Math.round(timeForKm));
      lastKm = currentKm;
      lastTime = timestamps[i];
    }
  }

  return paces;
}

export function calculateAvgPace(durationSeconds: number, distanceM: number): number {
  if (distanceM <= 0) return 0;
  return Math.round((durationSeconds / distanceM) * 1000);
}

export function calculateAvgSpeedKmh(durationSeconds: number, distanceM: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.round(((distanceM / 1000) / (durationSeconds / 3600)) * 10) / 10;
}
