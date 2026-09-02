import { buildCsv, type CsvRow } from '../domain/csv';

const HEADER = '日期,类型,距离(km),时长(s),卡路里(kcal),平均配速/速度';

function makeRow(partial: Partial<CsvRow> = {}): CsvRow {
  return {
    type: 'run',
    start_time: new Date(2026, 8, 2, 7, 30, 0).getTime(),
    duration_s: 1800,
    distance_m: 5230,
    calories: 320,
    avg_pace_s: 344,
    avg_speed_kmh: 0,
    ...partial,
  };
}

describe('buildCsv', () => {
  it('should start with UTF-8 BOM', () => {
    const csv = buildCsv([]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('should contain the fixed header', () => {
    const csv = buildCsv([]);
    expect(csv).toBe('\uFEFF' + HEADER);
  });

  it('should generate only header for empty rows', () => {
    const csv = buildCsv([]);
    expect(csv.split('\n')).toHaveLength(1);
  });

  it('should format run row with date, distance, duration, calories and pace', () => {
    const csv = buildCsv([makeRow()]);
    const line = csv.split('\n')[1];
    expect(line).toBe(`2026-09-02,跑步,5.23,1800,320,"5'44""/km"`);
  });

  it('should format ride row with speed in km/h', () => {
    const csv = buildCsv([
      makeRow({ type: 'ride', avg_speed_kmh: 24.56, avg_pace_s: 0 }),
    ]);
    const line = csv.split('\n')[1];
    expect(line).toContain('骑行');
    expect(line).toContain('24.6 km/h');
  });

  it('should format walk row with pace and 步行 label', () => {
    const csv = buildCsv([makeRow({ type: 'walk', avg_pace_s: 720 })]);
    const line = csv.split('\n')[1];
    expect(line).toContain('步行');
    expect(line).toContain(`"12'00""/km"`);
  });

  it('should keep distance at 2 decimals and calories as integer', () => {
    const csv = buildCsv([makeRow({ distance_m: 1234.567, calories: 321.6 })]);
    const line = csv.split('\n')[1];
    expect(line).toContain('1.23');
    expect(line).toContain(',322,');
  });
});
