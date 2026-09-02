import { File, Paths } from 'expo-file-system';
import { listAllDone, getTrackPoints } from './workoutRepo';
import { buildGpx } from '../domain/gpx';
import { buildCsv } from '../domain/csv';
import type { TrackPoint } from './workoutRepo';

/** 文件名时间戳：YYYYMMDD_HHMMSS（本地时间） */
function fileTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

function writeCacheFile(name: string, content: string): string {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true, intermediates: true });
  file.write(content);
  return file.uri;
}

/** 导出全部已完成运动为单个 GPX 文件，返回本地文件 URI */
export async function exportGpx(): Promise<string> {
  try {
    const workouts = await listAllDone();
    const pointsMap = new Map<number, TrackPoint[]>();
    await Promise.all(
      workouts.map(async (workout, index) => {
        pointsMap.set(index, await getTrackPoints(workout.id));
      })
    );
    const gpx = buildGpx(workouts, pointsMap);
    return writeCacheFile(`FitApp_Records_${fileTimestamp(new Date())}.gpx`, gpx);
  } catch (error) {
    console.error('导出 GPX 失败', error);
    throw new Error('文件生成失败，请重试');
  }
}

/** 导出全部已完成运动的统计汇总为 CSV 文件，返回本地文件 URI */
export async function exportCsv(): Promise<string> {
  try {
    const workouts = await listAllDone();
    const csv = buildCsv(workouts);
    return writeCacheFile(`FitApp_Summary_${fileTimestamp(new Date())}.csv`, csv);
  } catch (error) {
    console.error('导出 CSV 失败', error);
    throw new Error('文件生成失败，请重试');
  }
}
