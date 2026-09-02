import { haversineDistance, type Coordinate } from './geo';

export interface TrackPointInput {
  lat: number;
  lng: number;
  accuracy?: number | null;
  timestamp: number;
}

export type SportType = 'run' | 'ride' | 'walk';

const MAX_ACCURACY_M = 30;
const MIN_DISTANCE_M = 3;

const MAX_SPEED_MPS: Record<SportType, number> = {
  run: 8,
  walk: 8,
  ride: 15,
};

export function isValidPoint(
  point: TrackPointInput,
  lastAccepted: TrackPointInput | null,
  sportType: SportType
): boolean {
  if (!lastAccepted) {
    return true;
  }

  if (point.accuracy != null && point.accuracy > MAX_ACCURACY_M) {
    return false;
  }

  const distance = haversineDistance(point, lastAccepted);
  if (distance < MIN_DISTANCE_M) {
    return false;
  }

  const timeDeltaS = (point.timestamp - lastAccepted.timestamp) / 1000;
  if (timeDeltaS <= 0) {
    return false;
  }

  const speedMps = distance / timeDeltaS;
  if (speedMps > MAX_SPEED_MPS[sportType]) {
    return false;
  }

  return true;
}
