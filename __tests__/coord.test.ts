import { wgs84ToGcj02, gcj02ToWgs84 } from '../domain/coord';
import { haversineDistance } from '../domain/geo';

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

  describe('gcj02ToWgs84', () => {
    it('should roundtrip within 1m for points in China', () => {
      const points = [
        { lat: 39.9042, lng: 116.4074 }, // 北京
        { lat: 31.2304, lng: 121.4737 }, // 上海
        { lat: 30.5728, lng: 104.0668 }, // 成都
        { lat: 22.5431, lng: 114.0579 }, // 深圳
      ];
      for (const wgs84 of points) {
        const gcj02 = wgs84ToGcj02(wgs84);
        const back = gcj02ToWgs84(gcj02);
        expect(haversineDistance(back, wgs84)).toBeLessThan(1);
      }
    });

    it('should return original coords for points outside China', () => {
      const tokyo = { lat: 35.6762, lng: 139.6503 };
      expect(gcj02ToWgs84(tokyo)).toEqual(tokyo);
    });

    it('should return original coords for points in South China Sea (outside range)', () => {
      const outside = { lat: 0.5, lng: 110.0 };
      expect(gcj02ToWgs84(outside)).toEqual(outside);
    });
  });
});
