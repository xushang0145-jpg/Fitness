import {
  formatDuration,
  formatPace,
  formatDistance,
  formatSpeed,
  formatCalories,
  formatDate,
  formatTime,
} from '../domain/format';

describe('format', () => {
  describe('formatDuration', () => {
    it('should format seconds < 1h as MM:SS', () => {
      expect(formatDuration(125)).toBe('02:05');
    });

    it('should format seconds >= 1h as H:MM:SS', () => {
      expect(formatDuration(3725)).toBe('1:02:05');
    });
  });

  describe('formatPace', () => {
    it('should format pace as M\'SS"', () => {
      expect(formatPace(305)).toBe("5'05\"");
    });

    it('should return placeholder for zero pace', () => {
      expect(formatPace(0)).toBe("--'--\"");
    });
  });

  describe('formatDistance', () => {
    it('should format < 1km as meters', () => {
      expect(formatDistance(500)).toBe('500m');
    });

    it('should format >= 1km as km with 2 decimals', () => {
      expect(formatDistance(1500)).toBe('1.50km');
    });
  });

  describe('formatSpeed', () => {
    it('should format speed with 1 decimal', () => {
      expect(formatSpeed(10.5)).toBe('10.5km/h');
    });
  });

  describe('formatCalories', () => {
    it('should format calories', () => {
      expect(formatCalories(250)).toBe('250kcal');
    });
  });

  describe('formatDate', () => {
    it('should format timestamp as YYYY-MM-DD', () => {
      expect(formatDate(1735689600000)).toBe('2025-01-01');
    });
  });

  describe('formatTime', () => {
    it('should format timestamp as HH:MM', () => {
      expect(formatTime(1735689600000)).toBe('08:00');
    });
  });
});
