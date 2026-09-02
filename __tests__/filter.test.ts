import { isValidPoint, type TrackPointInput } from '../domain/filter';

describe('filter', () => {
  describe('isValidPoint', () => {
    const basePoint: TrackPointInput = {
      lat: 39.9042,
      lng: 116.4074,
      accuracy: 10,
      timestamp: 1000000,
    };

    it('should accept first point regardless of accuracy', () => {
      const point = { ...basePoint, accuracy: 100 };
      expect(isValidPoint(point, null, 'run')).toBe(true);
    });

    it('should reject point with accuracy > 30m', () => {
      const point = { ...basePoint, accuracy: 50 };
      const last: TrackPointInput = { ...basePoint, timestamp: 990000 };
      expect(isValidPoint(point, last, 'run')).toBe(false);
    });

    it('should reject point with distance < 3m from last', () => {
      const point = { ...basePoint, timestamp: 1010000 };
      const last: TrackPointInput = {
        lat: 39.9042,
        lng: 116.4074,
        accuracy: 10,
        timestamp: 1000000,
      };
      expect(isValidPoint(point, last, 'run')).toBe(false);
    });

    it('should reject run/walk point with speed > 8m/s', () => {
      const last: TrackPointInput = { ...basePoint, timestamp: 1000000 };
      const point: TrackPointInput = {
        lat: 39.9142,
        lng: 116.4174,
        accuracy: 10,
        timestamp: 1001000,
      };
      expect(isValidPoint(point, last, 'run')).toBe(false);
      expect(isValidPoint(point, last, 'walk')).toBe(false);
    });

    it('should reject ride point with speed > 15m/s', () => {
      const last: TrackPointInput = { ...basePoint, timestamp: 1000000 };
      const point: TrackPointInput = {
        lat: 39.9242,
        lng: 116.4274,
        accuracy: 10,
        timestamp: 1001000,
      };
      expect(isValidPoint(point, last, 'ride')).toBe(false);
    });

    it('should accept valid run point', () => {
      const last: TrackPointInput = { ...basePoint, timestamp: 1000000 };
      const point: TrackPointInput = {
        lat: 39.9043,
        lng: 116.4075,
        accuracy: 10,
        timestamp: 1005000,
      };
      expect(isValidPoint(point, last, 'run')).toBe(true);
    });

    it('should reject point with negative time delta', () => {
      const last: TrackPointInput = { ...basePoint, timestamp: 1000000 };
      const point: TrackPointInput = {
        ...basePoint,
        timestamp: 990000,
      };
      expect(isValidPoint(point, last, 'run')).toBe(false);
    });
  });
});
