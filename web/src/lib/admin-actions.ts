"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { requireCurrentPlayer } from "./session";
import { getActiveSeason, setActiveSeason } from "./season";

/** Garde-fou : seules les actions d'un ADMIN passent. */
async function requireAdmin() {
  const me = await requireCurrentPlayer();
  if (me.role !== "ADMIN") throw new Error("Action réservée aux administrateurs");
  return me;
}

/**
 * Réinitialise les MMR de la saison courante : tout le monde repart de 1500,
 * compteurs et placements remis à zéro. L'historique des matchs est conservé.
 * Confirmation obligatoire (champ "RESET").
 */
export async function resetSeasonMmr(formData: FormData) {
  await requireAdmin();
  if (String(formData.get("confirm") || "").trim().toUpperCase() !== "RESET") {
    redirect("/admin?err=confirm");
  }
  const season = await getActiveSeason();
  await db.rating.updateMany({
    where: { season },
    data: { mmr: 1500, peakMmr: 1500, wins: 0, losses: 0, streak: 0, placementsLeft: 5 },
  });
  revalidatePath("/", "layout");
  redirect("/admin?ok=reset");
}

/**
 * Clôture la saison courante et démarre la suivante. Les classements de
 * l'ancienne saison restent en base (archivés par numéro) ; la nouvelle repart
 * vierge (les ratings se recréent à 1500 au premier match).
 * Confirmation obligatoire (champ "NOUVELLE").
 */
export async function startNewSeason(formData: FormData) {
  await requireAdmin();
  if (String(formData.get("confirm") || "").trim().toUpperCase() !== "NOUVELLE") {
    redirect("/admin?err=confirm");
  }
  const season = await getActiveSeason();
  await setActiveSeason(season + 1);
  revalidatePath("/", "layout");
  redirect(`/admin?ok=season&n=${season + 1}`);
}
