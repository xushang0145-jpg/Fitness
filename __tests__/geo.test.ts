import { haversineDistance } from '../domain/geo';

describe('geo', () => {
  describe('haversineDistance', () => {
    it('should return 0 for same point', () => {
      const p = { lat: 39.9042, lng: 116.4074 };
      expect(haversineDistance(p, p)).toBe(0);
    });

    it('should calculate distance between Beijing and Shanghai (~1067km)', () => {
      const beijing = { lat: 39.9042, lng: 116.4074 };
      const shanghai = { lat: 31.2304, lng: 121.4737 };
      const distance = haversineDistance(beijing, shanghai);
      expect(distance).toBeGreaterThan(1060000);
      expect(distance).toBeLessThan(1075000);
    });

    it('should calculate short distance (~100m)', () => {
      const a = { lat: 39.9042, lng: 116.4074 };
      const b = { lat: 39.9051, lng: 116.4074 };
      const distance = haversineDistance(a, b);
      expect(distance).toBeGreaterThan(95);
      expect(distance).toBeLessThan(105);
    });
  });
});
