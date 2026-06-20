"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { requireCurrentPlayer } from "./session";

/** Crée un équipage dont le pirate courant devient capitaine. */
export async function createTeam(formData: FormData) {
  const me = await requireCurrentPlayer();
  const name = String(formData.get("name") || "").trim();
  const tag = String(formData.get("tag") || "").trim().toUpperCase();
  const blurb = String(formData.get("blurb") || "").trim();

  if (!name || !tag) throw new Error("Nom et tag requis");
  if (tag.length < 2 || tag.length > 5) throw new Error("Le tag doit faire 2 à 5 caractères");

  // le capitaine ne doit pas déjà appartenir à un équipage
  const existing = await db.teamMember.findUnique({ where: { playerId: me.id } });
  if (existing) throw new Error("Tu es déjà dans un équipage");

  const team = await db.team.create({
    data: {
      name,
      tag,
      blurb: blurb || null,
      accentHue: Math.floor(Math.random() * 360),
      captainId: me.id,
      members: { create: { playerId: me.id, role: "CAPTAIN" } },
    },
  });

  revalidatePath("/teams");
  redirect(`/teams/${team.id}`);
}

/* ============================================================
   MEMBRES D'ÉQUIPAGE
   ============================================================ */

/** Le capitaine recrute un pirate (par pseudo) dans son équipage. */
export async function recruitMember(formData: FormData) {
  const me = await requireCurrentPlayer();
  const teamId = String(formData.get("teamId") || "");
  const handle = String(formData.get("handle") || "").trim();

  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team || team.captainId !== me.id) redirect(`/teams/${teamId}?err=droits`);
  if (!handle) redirect(`/teams/${teamId}?err=introuvable`);

  const target = await db.player.findUnique({ where: { handle } });
  if (!target) redirect(`/teams/${teamId}?err=introuvable`);

  const already = await db.teamMember.findUnique({ where: { playerId: target.id } });
  if (already) redirect(`/teams/${teamId}?err=deja`);

  await db.teamMember.create({
    data: { teamId, playerId: target.id, role: "MEMBER" },
  });
  revalidatePath(`/teams/${teamId}`);
  redirect(`/teams/${teamId}?ok=recrue`);
}

/** Le pirate courant quitte son équipage (le capitaine ne peut pas, il doit dissoudre). */
export async function leaveTeam(formData: FormData) {
  const me = await requireCurrentPlayer();
  const teamId = String(formData.get("teamId") || "");
  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team) return;
  if (team.captainId === me.id) redirect(`/teams/${teamId}?err=capitaine`);

  await db.teamMember.deleteMany({ where: { teamId, playerId: me.id } });
  revalidatePath(`/teams/${teamId}`);
  redirect("/teams");
}

/** Le capitaine exclut un membre. */
export async function kickMember(formData: FormData) {
  const me = await requireCurrentPlayer();
  const teamId = String(formData.get("teamId") || "");
  const playerId = String(formData.get("playerId") || "");
  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team || team.captainId !== me.id) return;
  if (playerId === me.id) return; // le capitaine ne s'exclut pas

  await db.teamMember.deleteMany({ where: { teamId, playerId } });
  revalidatePath(`/teams/${teamId}`);
}

/** Le capitaine promeut/rétrograde un membre entre Officier et Membre. */
export async function setMemberRole(formData: FormData) {
  const me = await requireCurrentPlayer();
  const teamId = String(formData.get("teamId") || "");
  const playerId = String(formData.get("playerId") || "");
  const role = String(formData.get("role") || "");
  if (role !== "OFFICER" && role !== "MEMBER") return;

  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team || team.captainId !== me.id || playerId === me.id) return;

  await db.teamMember.updateMany({ where: { teamId, playerId }, data: { role } });
  revalidatePath(`/teams/${teamId}`);
}

/** Le capitaine dissout son équipage. */
export async function disbandTeam(formData: FormData) {
  const me = await requireCurrentPlayer();
  const teamId = String(formData.get("teamId") || "");
  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team || team.captainId !== me.id) return;

  await db.team.delete({ where: { id: teamId } });
  revalidatePath("/teams");
  redirect("/teams");
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
