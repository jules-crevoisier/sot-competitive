// Saison active du ladder — source de vérité unique (table AppSetting).
// Tout le code (files, matchs, classements) lit la saison via getActiveSeason().

import { db } from "./db";

const ACTIVE_SEASON_KEY = "activeSeason";

/** Numéro de la saison en cours (1 par défaut si rien n'est défini). */
export async function getActiveSeason(): Promise<number> {
  const row = await db.appSetting.findUnique({ where: { key: ACTIVE_SEASON_KEY } });
  const n = row ? Number(row.value) : 1;
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Définit la saison active. */
export async function setActiveSeason(n: number): Promise<void> {
  await db.appSetting.upsert({
    where: { key: ACTIVE_SEASON_KEY },
    create: { key: ACTIVE_SEASON_KEY, value: String(n) },
    update: { value: String(n) },
  });
}
