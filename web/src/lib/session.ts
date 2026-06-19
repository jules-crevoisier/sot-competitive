// Identité « dev » : tant que le login Discord n'est pas branché, on incarne un
// pirate via un cookie. Un sélecteur dans l'en-tête permet de changer de pirate
// pour tester amis / groupes / salons / chat à plusieurs comptes.

import { cookies } from "next/headers";
import { db } from "./db";

const COOKIE = "sot_player";

/** Renvoie le pirate incarné (cookie), ou le premier pirate par défaut. */
export async function getCurrentPlayer() {
  const store = await cookies();
  const id = store.get(COOKIE)?.value;

  if (id) {
    const p = await db.player.findUnique({ where: { id } });
    if (p) return p;
  }
  // défaut : un joueur stable (le premier inscrit)
  return db.player.findFirst({ orderBy: { createdAt: "asc" } });
}

/** Comme getCurrentPlayer mais lève si aucun pirate n'existe (usage actions). */
export async function requireCurrentPlayer() {
  const p = await getCurrentPlayer();
  if (!p) throw new Error("Aucun pirate disponible");
  return p;
}
