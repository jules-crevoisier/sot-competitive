// Identité du pirate courant.
// - Auth Discord ACTIVÉE (OAuth configuré) : le pirate vient de la session signée.
// - Auth DÉSACTIVÉE (dev local / CI) : on incarne un pirate via un cookie, et un
//   sélecteur dans l'en-tête permet d'en changer pour tester à plusieurs comptes.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { DEV_COOKIE, isAuthEnabled, getSessionPlayerId } from "./auth";

/** Renvoie le pirate connecté (session) ou, en dev, le pirate incarné par cookie. */
export async function getCurrentPlayer() {
  if (isAuthEnabled()) {
    const id = await getSessionPlayerId();
    if (!id) return null;
    return db.player.findUnique({ where: { id } });
  }

  // — Mode dev : cookie de sélection, sinon premier pirate inscrit —
  const store = await cookies();
  const id = store.get(DEV_COOKIE)?.value;
  if (id) {
    const p = await db.player.findUnique({ where: { id } });
    if (p) return p;
  }
  return db.player.findFirst({ orderBy: { createdAt: "asc" } });
}

/** Comme getCurrentPlayer mais garantit un pirate (sinon redirige/lève). */
export async function requireCurrentPlayer() {
  const p = await getCurrentPlayer();
  if (!p) {
    if (isAuthEnabled()) redirect("/login");
    throw new Error("Aucun pirate disponible");
  }
  return p;
}
