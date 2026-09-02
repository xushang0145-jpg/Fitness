import {
  getWeekStart,
  calculateWeeklyStats,
  calculateCombinedStats,
  estimateSteps,
  type WorkoutRecord,
  type CourseRecordLite,
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

  describe('calculateCombinedStats', () => {
    const now = new Date('2025-01-08T15:00:00').getTime();

    const workouts: WorkoutRecord[] = [
      {
        id: 'w1',
        type: 'run',
        start_time: new Date('2025-01-06T08:00:00').getTime(),
        end_time: new Date('2025-01-06T09:00:00').getTime(),
        duration_s: 3600,
        distance_m: 10000,
        calories: 600,
      },
      {
        id: 'w2',
        type: 'walk',
        start_time: new Date('2024-12-20T08:00:00').getTime(),
        end_time: new Date('2024-12-20T09:00:00').getTime(),
        duration_s: 1800,
        distance_m: 3000,
        calories: 120,
      },
    ];

    const courseRecords: CourseRecordLite[] = [
      {
        id: 'c1',
        start_time: new Date('2025-01-07T19:00:00').getTime(),
        duration_s: 1200,
        calories: 180,
      },
      {
        id: 'c2',
        // 与 w1 同一天：活跃天不重复计数
        start_time: new Date('2025-01-06T20:00:00').getTime(),
        duration_s: 600,
        calories: 90,
      },
    ];

    it('should merge workout and course record totals', () => {
      const stats = calculateCombinedStats(workouts, courseRecords, now);
      expect(stats.totalCount).toBe(4);
      expect(stats.totalDurationS).toBe(3600 + 1800 + 1200 + 600);
      expect(stats.totalCalories).toBe(600 + 120 + 180 + 90);
      expect(stats.totalDistanceM).toBe(13000);
    });

    it('should count distinct active days in the last 7 days only', () => {
      const stats = calculateCombinedStats(workouts, courseRecords, now);
      // 01-06 (w1+c2 同一天) 与 01-07 (c1) 两天；w2 超出 7 天窗口
      expect(stats.activeDaysLast7).toBe(2);
    });

    it('should handle empty inputs', () => {
      const stats = calculateCombinedStats([], [], now);
      expect(stats.totalCount).toBe(0);
      expect(stats.totalDurationS).toBe(0);
      expect(stats.totalCalories).toBe(0);
      expect(stats.totalDistanceM).toBe(0);
      expect(stats.activeDaysLast7).toBe(0);
    });

    it('should not count future records as active days', () => {
      const future: CourseRecordLite[] = [
        {
          id: 'c3',
          start_time: new Date('2025-01-10T10:00:00').getTime(),
          duration_s: 600,
          calories: 50,
        },
      ];
      const stats = calculateCombinedStats([], future, now);
      expect(stats.activeDaysLast7).toBe(0);
      expect(stats.totalCount).toBe(1);
    });
  });
});
