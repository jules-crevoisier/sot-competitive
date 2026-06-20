"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { requireCurrentPlayer } from "./session";

/** Nettoie un handle de réseau social : enlève @, URL, espaces. */
function cleanHandle(raw: string): string | null {
  const v = raw
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?[^/]+\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "")
    .trim();
  return v || null;
}

/**
 * Met à jour le profil du pirate courant : identité visible, fiche de pont
 * (arme, style) et liens de stream / réseaux. Le pseudo (= nom en jeu) doit
 * rester unique.
 */
export async function updateProfile(formData: FormData) {
  const me = await requireCurrentPlayer();

  const handle = String(formData.get("handle") || "").trim();
  if (!handle) redirect("/me?err=pseudo");
  if (handle.length < 2 || handle.length > 24) redirect("/me?err=pseudo");

  // unicité du pseudo (hors moi-même)
  if (handle !== me.handle) {
    const taken = await db.player.findUnique({ where: { handle } });
    if (taken) redirect("/me?err=pris");
  }

  const hueRaw = Number(formData.get("avatarHue"));
  const avatarHue = Number.isFinite(hueRaw) ? Math.max(0, Math.min(360, Math.round(hueRaw))) : me.avatarHue;

  const country = String(formData.get("country") || "").trim().toUpperCase().slice(0, 2) || null;
  const bio = String(formData.get("bio") || "").trim().slice(0, 240) || null;
  const weapon = String(formData.get("weapon") || "").trim().slice(0, 40) || null;
  const playStyle = String(formData.get("playStyle") || "").trim().slice(0, 60) || null;

  await db.player.update({
    where: { id: me.id },
    data: {
      handle,
      avatarHue,
      country,
      bio,
      weapon,
      playStyle,
      twitch: cleanHandle(String(formData.get("twitch") || "")),
      youtube: cleanHandle(String(formData.get("youtube") || "")),
      twitter: cleanHandle(String(formData.get("twitter") || "")),
    },
  });

  revalidatePath("/me");
  revalidatePath(`/players/${me.id}`);
  redirect("/me?ok=1");
}
