import {
  calculateCalories,
  calculatePaceSeries,
  calculateAvgPace,
  calculateAvgSpeedKmh,
} from '../domain/metrics';

describe('metrics', () => {
  describe('calculateCalories', () => {
    it('should calculate run calories (MET 9.8)', () => {
      expect(calculateCalories('run', 65, 3600)).toBe(637);
    });

    it('should calculate ride calories (MET 7.5)', () => {
      expect(calculateCalories('ride', 65, 3600)).toBe(488);
    });

    it('should calculate walk calories (MET 3.5)', () => {
      expect(calculateCalories('walk', 65, 3600)).toBe(228);
    });
  });

  describe('calculatePaceSeries', () => {
    it('should return empty array for insufficient data', () => {
      expect(calculatePaceSeries([1000], [100])).toEqual([]);
    });

    it('should calculate pace for each kilometer', () => {
      const timestamps = [0, 60000, 120000, 180000, 240000];
      const distances = [0, 500, 1000, 1500, 2000];
      const paces = calculatePaceSeries(timestamps, distances);
      expect(paces).toEqual([120, 120]);
    });
  });

  describe('calculateAvgPace', () => {
    it('should calculate average pace in seconds per km', () => {
      expect(calculateAvgPace(600, 2000)).toBe(300);
    });

    it('should return 0 for zero distance', () => {
      expect(calculateAvgPace(600, 0)).toBe(0);
    });
  });

  describe('calculateAvgSpeedKmh', () => {
    it('should calculate average speed in km/h', () => {
      expect(calculateAvgSpeedKmh(3600, 10000)).toBe(10);
    });

    it('should return 0 for zero duration', () => {
      expect(calculateAvgSpeedKmh(0, 10000)).toBe(0);
    });
  });
});
