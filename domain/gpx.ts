import { gcj02ToWgs84 } from './coord';
import { formatDate } from './format';
import type { SportType } from './filter';

/** GPX 导出所需的运动记录字段（数据库存的是 GCJ-02 坐标） */
export interface GpxWorkoutInput {
  type: SportType;
  start_time: number;
  /** 可选自定义名称，缺省为「类型 日期」 */
  name?: string;
}

export interface GpxTrackPointInput {
  lat: number;
  lng: number;
  altitude: number | null;
  timestamp: number;
}

const TYPE_LABELS: Record<SportType, string> = {
  run: '跑步',
  ride: '骑行',
  walk: '步行',
};

function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      default:
        return '&quot;';
    }
  });
}

function toIso8601(ms: number): string {
  return new Date(ms).toISOString();
}

/**
 * 生成 GPX 1.1 XML 字符串。
 * 每条运动一个 <trk>；pointsMap 以 workout 数组下标为键，轨迹点需按时间升序。
 * 坐标在写入前由 GCJ-02 转为 WGS-84。
 */
export function buildGpx(
  workouts: GpxWorkoutInput[],
  pointsMap: Map<number, GpxTrackPointInput[]>
): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="FitApp" xmlns="http://www.topografix.com/GPX/1/1">',
  ];

  workouts.forEach((workout, index) => {
    const name = workout.name ?? `${TYPE_LABELS[workout.type]} ${formatDate(workout.start_time)}`;
    lines.push('  <trk>');
    lines.push(`    <name>${escapeXml(name)}</name>`);
    lines.push(`    <time>${toIso8601(workout.start_time)}</time>`);
    lines.push('    <trkseg>');

    const points = pointsMap.get(index) ?? [];
    for (const point of points) {
      try {
        const wgs84 = gcj02ToWgs84({ lat: point.lat, lng: point.lng });
        lines.push(
          `      <trkpt lat="${wgs84.lat.toFixed(7)}" lon="${wgs84.lng.toFixed(7)}">`
        );
        if (point.altitude != null) {
          lines.push(`        <ele>${point.altitude}</ele>`);
        }
        lines.push(`        <time>${toIso8601(point.timestamp)}</time>`);
        lines.push('      </trkpt>');
      } catch {
        // 单点转换失败时跳过该点，不中断整条记录的导出
      }
    }

    lines.push('    </trkseg>');
    lines.push('  </trk>');
  });

  lines.push('</gpx>');
  return lines.join('\n');
}
