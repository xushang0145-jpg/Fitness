import { formatDate, formatPace } from './format';
import type { SportType } from './filter';

/** CSV 汇总导出所需的运动记录字段 */
export interface CsvRow {
  type: SportType;
  start_time: number;
  duration_s: number;
  distance_m: number;
  calories: number;
  avg_pace_s: number;
  avg_speed_kmh: number;
}

const HEADER = '日期,类型,距离(km),时长(s),卡路里(kcal),平均配速/速度';

const TYPE_LABELS: Record<SportType, string> = {
  run: '跑步',
  ride: '骑行',
  walk: '步行',
};

/** 含逗号 / 引号的字段按 RFC 4180 加引号并转义 */
function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** 跑步 / 步行显示配速 m'ss"/km，骑行显示速度 xx.x km/h */
function formatPaceOrSpeed(row: CsvRow): string {
  if (row.type === 'ride') {
    return `${row.avg_speed_kmh.toFixed(1)} km/h`;
  }
  return `${formatPace(row.avg_pace_s)}/km`;
}

/** 生成带 UTF-8 BOM 的 CSV 字符串，空记录时仅含表头 */
export function buildCsv(rows: CsvRow[]): string {
  const lines = rows.map((row) =>
    [
      formatDate(row.start_time),
      TYPE_LABELS[row.type],
      (row.distance_m / 1000).toFixed(2),
      String(Math.round(row.duration_s)),
      String(Math.round(row.calories)),
      csvCell(formatPaceOrSpeed(row)),
    ].join(',')
  );
  return '\uFEFF' + [HEADER, ...lines].join('\n');
}
