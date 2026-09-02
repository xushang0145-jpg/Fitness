export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatPace(paceSeconds: number): string {
  if (paceSeconds <= 0) return "--'--\"";
  const m = Math.floor(paceSeconds / 60);
  const s = paceSeconds % 60;
  return `${m}'${String(s).padStart(2, '0')}"`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

export function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(1)}km/h`;
}

export function formatCalories(kcal: number): string {
  return `${kcal}kcal`;
}

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 课程时长：不足 1 小时显示 mm:ss，否则 h:mm */
export function formatCourseDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatReps(count: number): string {
  return `x${count}`;
}

export function formatDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): string {
  const map = { beginner: '初级', intermediate: '中级', advanced: '高级' } as const;
  return map[difficulty];
}

export function formatCourseCategory(
  category: 'fat_burn' | 'shaping' | 'stretch' | 'full_body'
): string {
  const map = {
    fat_burn: '燃脂',
    shaping: '塑形',
    stretch: '拉伸',
    full_body: '全身',
  } as const;
  return map[category];
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
