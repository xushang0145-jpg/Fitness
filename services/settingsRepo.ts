import { getDatabase } from '../db/database';

export interface Settings {
  id: number;
  weekly_goal_km: number;
  weight_kg: number;
}

export async function getSettings(): Promise<Settings> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Settings>(
    `SELECT * FROM settings WHERE id = 1`
  );

  if (!result) {
    await db.runAsync(`INSERT INTO settings (id) VALUES (1)`);
    return { id: 1, weekly_goal_km: 30, weight_kg: 65 };
  }

  return result;
}

export async function updateWeeklyGoal(km: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE settings SET weekly_goal_km = ? WHERE id = 1`,
    [km]
  );
}

export async function updateWeight(kg: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE settings SET weight_kg = ? WHERE id = 1`,
    [kg]
  );
}
