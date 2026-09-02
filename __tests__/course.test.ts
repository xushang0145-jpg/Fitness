import {
  calcProgress,
  calcCompletion,
  nextActionIndex,
  calcCourseCalories,
  calcActionCalories,
} from '../domain/course';

describe('course domain', () => {
  describe('calcProgress', () => {
    it('should return 0% at start', () => {
      expect(calcProgress(0, 8)).toBe(0);
    });

    it('should return 100% when all done', () => {
      expect(calcProgress(8, 8)).toBe(100);
    });

    it('should round intermediate progress', () => {
      expect(calcProgress(3, 8)).toBe(38);
    });

    it('should clamp out-of-range values', () => {
      expect(calcProgress(-1, 8)).toBe(0);
      expect(calcProgress(10, 8)).toBe(100);
    });

    it('should return 0 for empty course', () => {
      expect(calcProgress(0, 0)).toBe(0);
    });
  });

  describe('calcCompletion', () => {
    it('should calculate completion percentage', () => {
      expect(calcCompletion(7, 8)).toBe(88);
      expect(calcCompletion(8, 8)).toBe(100);
      expect(calcCompletion(0, 8)).toBe(0);
    });

    it('should be safe for zero total', () => {
      expect(calcCompletion(0, 0)).toBe(0);
    });

    it('should clamp done count above total', () => {
      expect(calcCompletion(9, 8)).toBe(100);
    });
  });

  describe('nextActionIndex', () => {
    it('should advance to next index', () => {
      expect(nextActionIndex(8, 0)).toBe(1);
      expect(nextActionIndex(8, 6)).toBe(7);
    });

    it('should return -1 when on last action', () => {
      expect(nextActionIndex(8, 7)).toBe(-1);
      expect(nextActionIndex(1, 0)).toBe(-1);
    });
  });

  describe('calcCourseCalories', () => {
    it('should compute MET * weight * hours', () => {
      // 8 MET * 65kg * 0.5h = 260
      expect(calcCourseCalories(8, 65, 1800, 1)).toBe(260);
    });

    it('should scale by completion rate', () => {
      expect(calcCourseCalories(8, 65, 1800, 0.5)).toBe(130);
    });

    it('should return 0 for zero duration or zero completion', () => {
      expect(calcCourseCalories(8, 65, 0, 1)).toBe(0);
      expect(calcCourseCalories(8, 65, 1800, 0)).toBe(0);
    });

    it('should clamp completion rate above 1', () => {
      expect(calcCourseCalories(8, 65, 1800, 1.5)).toBe(260);
    });
  });

  describe('calcActionCalories', () => {
    it('should compute action-level calories', () => {
      // 8 MET * 65kg * (30/3600)h ≈ 4.33 -> 4
      expect(calcActionCalories(8, 65, 30)).toBe(4);
    });

    it('should return 0 for zero duration', () => {
      expect(calcActionCalories(8, 65, 0)).toBe(0);
    });
  });
});
