"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { requireCurrentPlayer } from "./session";
import { recognizeText, checkPseudo } from "./ocr";

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

/**
 * Vérification automatique du pseudo par capture in-game : on lit le texte de
 * l'image (OCR) et on confirme que le pseudo du joueur y figure. Si oui, le
 * compte passe « vérifié ». Aucun service externe : tout se fait en local.
 */
export async function verifyHandleScreenshot(formData: FormData) {
  const me = await requireCurrentPlayer();
  const file = formData.get("shot");
  if (!(file instanceof File) || file.size === 0) redirect("/me?verr=nofile");
  if (file.size > 8_000_000) redirect("/me?verr=size");

  let check;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const text = await recognizeText(buf);
    check = checkPseudo(text, me.handle);
  } catch {
    redirect("/me?verr=ocr");
  }

  if (check.ok) {
    await db.player.update({
      where: { id: me.id },
      data: { verified: true, verifiedAt: new Date() },
    });
    revalidatePath("/me");
    revalidatePath(`/players/${me.id}`);
    redirect("/me?vok=1");
  }
  redirect("/me?verr=nomatch");
}
