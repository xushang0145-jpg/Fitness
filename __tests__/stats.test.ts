import {
  getWeekStart,
  calculateWeeklyStats,
  estimateSteps,
  type WorkoutRecord,
} from '../domain/stats';

describe('stats', () => {
  describe('getWeekStart', () => {
    it('should return Monday 00:00:00 for any day in week', () => {
      const wednesday = new Date('2025-01-08T15:30:00').getTime();
      const monday = getWeekStart(wednesday);
      const mondayDate = new Date(monday);
      expect(mondayDate.getDay()).toBe(1);
      expect(mondayDate.getHours()).toBe(0);
      expect(mondayDate.getMinutes()).toBe(0);
    });

    it('should handle Sunday (day 0) correctly', () => {
      const sunday = new Date('2025-01-05T15:30:00').getTime();
      const monday = getWeekStart(sunday);
      const mondayDate = new Date(monday);
      expect(mondayDate.getDay()).toBe(1);
    });
  });

  describe('calculateWeeklyStats', () => {
    const workouts: WorkoutRecord[] = [
      {
        id: '1',
        type: 'run',
        start_time: new Date('2025-01-06T08:00:00').getTime(),
        end_time: new Date('2025-01-06T09:00:00').getTime(),
        duration_s: 3600,
        distance_m: 10000,
        calories: 637,
      },
      {
        id: '2',
        type: 'ride',
        start_time: new Date('2025-01-07T18:00:00').getTime(),
        end_time: new Date('2025-01-07T19:00:00').getTime(),
        duration_s: 3600,
        distance_m: 20000,
        calories: 488,
      },
      {
        id: '3',
        type: 'run',
        start_time: new Date('2025-01-13T08:00:00').getTime(),
        end_time: new Date('2025-01-13T09:00:00').getTime(),
        duration_s: 3600,
        distance_m: 8000,
        calories: 510,
      },
    ];

    it('should calculate stats for current week only', () => {
      const weekStart = new Date('2025-01-06T00:00:00').getTime();
      const stats = calculateWeeklyStats(workouts, weekStart);
      expect(stats.workoutCount).toBe(2);
      expect(stats.totalDistanceM).toBe(30000);
      expect(stats.totalCalories).toBe(1125);
      expect(stats.byType.run.count).toBe(1);
      expect(stats.byType.ride.count).toBe(1);
    });

    it('should return zero stats for empty week', () => {
      const weekStart = new Date('2025-01-20T00:00:00').getTime();
      const stats = calculateWeeklyStats(workouts, weekStart);
      expect(stats.workoutCount).toBe(0);
      expect(stats.totalDistanceM).toBe(0);
    });
  });

  describe('estimateSteps', () => {
    it('should estimate steps with 0.75m stride', () => {
      expect(estimateSteps(750)).toBe(1000);
      expect(estimateSteps(1000)).toBe(1333);
    });
  });
});
