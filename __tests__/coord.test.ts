import { wgs84ToGcj02 } from '../domain/coord';

describe('coord', () => {
  describe('wgs84ToGcj02', () => {
    it('should convert WGS84 to GCJ-02 for Beijing (tolerance ±0.001°)', () => {
      const wgs84 = { lat: 39.9042, lng: 116.4074 };
      const gcj02 = wgs84ToGcj02(wgs84);
      expect(gcj02.lat).toBeCloseTo(39.9055, 3);
      expect(gcj02.lng).toBeCloseTo(116.4136, 3);
    });

    it('should convert WGS84 to GCJ-02 for Shanghai (tolerance ±0.001°)', () => {
      const wgs84 = { lat: 31.2304, lng: 121.4737 };
      const gcj02 = wgs84ToGcj02(wgs84);
      expect(gcj02.lat).toBeCloseTo(31.2285, 3);
      expect(gcj02.lng).toBeCloseTo(121.4782, 3);
    });

    it('should return original coords for points outside China', () => {
      const tokyo = { lat: 35.6762, lng: 139.6503 };
      expect(wgs84ToGcj02(tokyo)).toEqual(tokyo);
    });

    it('should return original coords for points in South China Sea (outside range)', () => {
      const outside = { lat: 0.5, lng: 110.0 };
      expect(wgs84ToGcj02(outside)).toEqual(outside);
    });
  });
});
