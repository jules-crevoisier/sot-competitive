"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";

/** Crée un équipage avec un capitaine choisi parmi les pirates inscrits (démo). */
export async function createTeam(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const tag = String(formData.get("tag") || "").trim().toUpperCase();
  const blurb = String(formData.get("blurb") || "").trim();
  const captainId = String(formData.get("captainId") || "").trim();

  if (!name || !tag) throw new Error("Nom et tag requis");
  if (tag.length < 2 || tag.length > 5) throw new Error("Le tag doit faire 2 à 5 caractères");
  if (!captainId) throw new Error("Capitaine requis");

  // le capitaine ne doit pas déjà appartenir à un équipage
  const existing = await db.teamMember.findUnique({ where: { playerId: captainId } });
  if (existing) throw new Error("Ce pirate est déjà dans un équipage");

  const team = await db.team.create({
    data: {
      name,
      tag,
      blurb: blurb || null,
      accentHue: Math.floor(Math.random() * 360),
      captainId,
      members: { create: { playerId: captainId, role: "CAPTAIN" } },
    },
  });

  revalidatePath("/teams");
  redirect(`/teams/${team.id}`);
}

/** Enregistre une proposition de mode soumise par la communauté. */
export async function proposeMode(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const format = String(formData.get("format") || "").trim();
  const pitch = String(formData.get("pitch") || "").trim();
  const proposerHandle = String(formData.get("proposerHandle") || "").trim();

  if (!name || !pitch) throw new Error("Nom et description requis");

  await db.modeProposal.create({
    data: { name, format: format || null, pitch, proposerHandle: proposerHandle || null },
  });

  revalidatePath("/propose");
}

/** +1 sur une proposition de mode. */
export async function voteProposal(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await db.modeProposal.update({ where: { id }, data: { votes: { increment: 1 } } });
  revalidatePath("/propose");
}
