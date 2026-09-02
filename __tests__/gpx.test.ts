import { buildGpx, type GpxWorkoutInput, type GpxTrackPointInput } from '../domain/gpx';
import { wgs84ToGcj02 } from '../domain/coord';

const start = new Date(2026, 8, 2, 7, 30, 0).getTime();

const workouts: GpxWorkoutInput[] = [
  { type: 'run', start_time: start },
  { type: 'ride', start_time: start + 86400000 },
];

describe('buildGpx', () => {
  it('should generate valid GPX 1.1 header', () => {
    const gpx = buildGpx([], new Map());
    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx).toContain('xmlns="http://www.topografix.com/GPX/1/1"');
    expect(gpx.trim().endsWith('</gpx>')).toBe(true);
  });

  it('should generate empty but valid GPX for no workouts', () => {
    const gpx = buildGpx([], new Map());
    expect(gpx).not.toContain('<trk>');
  });

  it('should generate one <trk> per workout with name, time and trkseg', () => {
    const gpx = buildGpx(workouts, new Map());
    expect(gpx.match(/<trk>/g)).toHaveLength(2);
    expect(gpx).toContain('<name>跑步 2026-09-02</name>');
    expect(gpx).toContain('<name>骑行 2026-09-03</name>');
    expect(gpx).toContain(`<time>${new Date(start).toISOString()}</time>`);
    expect(gpx.match(/<trkseg>/g)).toHaveLength(2);
  });

  it('should write track points in WGS-84 with ele and time', () => {
    const wgs84 = { lat: 39.9042, lng: 116.4074 };
    const gcj02 = wgs84ToGcj02(wgs84);
    const points: GpxTrackPointInput[] = [
      { lat: gcj02.lat, lng: gcj02.lng, altitude: 43.5, timestamp: start + 1000 },
    ];
    const gpx = buildGpx([workouts[0]], new Map([[0, points]]));
    const match = gpx.match(/<trkpt lat="([\d.-]+)" lon="([\d.-]+)">/);
    expect(match).not.toBeNull();
    // 反向转换为近似算法，允许 1e-5°（约 1 米）误差
    expect(Number(match![1])).toBeCloseTo(wgs84.lat, 5);
    expect(Number(match![2])).toBeCloseTo(wgs84.lng, 5);
    expect(gpx).toContain('<ele>43.5</ele>');
    expect(gpx).toContain(`<time>${new Date(start + 1000).toISOString()}</time>`);
  });

  it('should omit <ele> when altitude is missing', () => {
    const points: GpxTrackPointInput[] = [
      { lat: 39.9, lng: 116.4, altitude: null, timestamp: start },
    ];
    const gpx = buildGpx([workouts[0]], new Map([[0, points]]));
    expect(gpx).not.toContain('<ele>');
  });

  it('should not convert coordinates outside China', () => {
    const points: GpxTrackPointInput[] = [
      { lat: 35.6762, lng: 139.6503, altitude: null, timestamp: start },
    ];
    const gpx = buildGpx([workouts[0]], new Map([[0, points]]));
    expect(gpx).toContain('lat="35.6762000"');
    expect(gpx).toContain('lon="139.6503000"');
  });

  it('should escape XML special characters in custom names', () => {
    const gpx = buildGpx(
      [{ type: 'run', start_time: start, name: 'A<B> & "C"' }],
      new Map()
    );
    expect(gpx).toContain('<name>A&lt;B&gt; &amp; &quot;C&quot;</name>');
  });
});
