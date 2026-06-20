"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getMode, perTeamFor, maxPartySize } from "./modes";
import { requireCurrentPlayer } from "./session";
import { getActiveSeason } from "./season";

const COOKIE = "sot_player";

/* ============================================================
   IDENTITÉ DEV — sélecteur de pirate
   ============================================================ */
export async function switchPlayer(formData: FormData) {
  const id = String(formData.get("playerId"));
  if (!id) return;
  const store = await cookies();
  store.set(COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

/* ============================================================
   AMIS
   ============================================================ */
export async function sendFriendRequest(formData: FormData) {
  const me = await requireCurrentPlayer();
  const handle = String(formData.get("handle") || "").trim();
  if (!handle) return;

  const target = await db.player.findFirst({
    where: { handle: { equals: handle } },
  });
  if (!target || target.id === me.id) {
    redirect("/friends?err=introuvable");
  }

  // déjà liés (dans un sens ou l'autre) ?
  const existing = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: me.id },
      ],
    },
  });
  if (existing) {
    // si l'autre nous avait déjà demandé, on accepte
    if (existing.requesterId === target.id && existing.status === "PENDING") {
      await db.friendship.update({ where: { id: existing.id }, data: { status: "ACCEPTED" } });
    }
    revalidatePath("/friends");
    return;
  }

  await db.friendship.create({
    data: { requesterId: me.id, addresseeId: target.id, status: "PENDING" },
  });
  revalidatePath("/friends");
}

export async function acceptFriendRequest(formData: FormData) {
  const me = await requireCurrentPlayer();
  const id = String(formData.get("id"));
  const fr = await db.friendship.findUnique({ where: { id } });
  if (!fr || fr.addresseeId !== me.id) return;
  await db.friendship.update({ where: { id }, data: { status: "ACCEPTED" } });
  revalidatePath("/friends");
}

export async function declineFriendRequest(formData: FormData) {
  const me = await requireCurrentPlayer();
  const id = String(formData.get("id"));
  const fr = await db.friendship.findUnique({ where: { id } });
  if (!fr || (fr.addresseeId !== me.id && fr.requesterId !== me.id)) return;
  await db.friendship.delete({ where: { id } });
  revalidatePath("/friends");
}

/* ============================================================
   GROUPES (PARTY)
   ============================================================ */
async function ensureParty(playerId: string) {
  const existing = await db.partyMember.findUnique({
    where: { playerId },
    include: { party: true },
  });
  if (existing) return existing.party;

  return db.party.create({
    data: {
      leaderId: playerId,
      members: { create: { playerId } },
    },
  });
}

export async function createParty() {
  const me = await requireCurrentPlayer();
  await ensureParty(me.id);
  revalidatePath("/play");
}

export async function addToParty(formData: FormData) {
  const me = await requireCurrentPlayer();
  const friendId = String(formData.get("friendId"));
  if (!friendId) return;

  const party = await ensureParty(me.id);
  // seul le chef peut inviter
  if (party.leaderId !== me.id) return;

  // l'ami ne doit pas déjà être dans un groupe
  const already = await db.partyMember.findUnique({ where: { playerId: friendId } });
  if (already) return;

  await db.partyMember.create({ data: { partyId: party.id, playerId: friendId } });
  revalidatePath("/play");
  revalidatePath("/friends");
}

export async function leaveParty() {
  const me = await requireCurrentPlayer();
  const membership = await db.partyMember.findUnique({
    where: { playerId: me.id },
    include: { party: { include: { members: true } } },
  });
  if (!membership) return;
  const party = membership.party;

  await db.partyMember.delete({ where: { playerId: me.id } });

  // si le chef part : on transfère ou on dissout
  if (party.leaderId === me.id) {
    const rest = party.members.filter((m) => m.playerId !== me.id);
    if (rest.length === 0) {
      await db.party.delete({ where: { id: party.id } });
    } else {
      await db.party.update({ where: { id: party.id }, data: { leaderId: rest[0].playerId } });
    }
  }
  revalidatePath("/play");
}

export async function kickFromParty(formData: FormData) {
  const me = await requireCurrentPlayer();
  const playerId = String(formData.get("playerId"));
  const party = await db.party.findFirst({ where: { leaderId: me.id } });
  if (!party || playerId === me.id) return;
  await db.partyMember.deleteMany({ where: { partyId: party.id, playerId } });
  revalidatePath("/play");
}

/* ============================================================
   FILE → SALON (LOBBY)
   ============================================================ */
export async function joinQueue(formData: FormData) {
  const me = await requireCurrentPlayer();
  const modeKey = String(formData.get("mode"));
  const mode = getMode(modeKey);
  if (!mode) throw new Error("Mode inconnu");

  const perTeam = perTeamFor(mode);
  const needed = perTeam * 2;
  const season = await getActiveSeason();

  // membres humains : moi + mon groupe
  const membership = await db.partyMember.findUnique({
    where: { playerId: me.id },
    include: { party: { include: { members: { include: { player: true } } } } },
  });
  const humans = membership
    ? membership.party.members.map((m) => m.player)
    : [me];

  // un groupe ne peut pas dépasser la taille d'un équipage de ce mode
  if (humans.length > maxPartySize(mode)) {
    throw new Error(
      `Ton groupe (${humans.length}) est trop grand pour ${mode.name} (max ${maxPartySize(mode)}).`,
    );
  }

  // hôte = chef de groupe si présent, sinon moi
  const hostId = membership?.party.leaderId ?? me.id;

  // remplissage avec des pirates classés (démo)
  const humanIds = new Set(humans.map((h) => h.id));
  const slots = Math.max(0, needed - humans.length);
  let bots: { id: string }[] = [];
  if (slots > 0) {
    const ratings = await db.rating.findMany({
      where: { mode: modeKey, season, playerId: { notIn: [...humanIds] } },
      select: { playerId: true },
    });
    bots = ratings
      .sort(() => Math.random() - 0.5)
      .slice(0, slots)
      .map((r) => ({ id: r.playerId }));
  }

  const roster = [
    ...humans.map((h) => ({ id: h.id, isBot: false })),
    ...bots.map((b) => ({ id: b.id, isBot: true })),
  ];
  if (roster.length < needed) throw new Error("Pas assez de pirates pour former un salon");

  // équipages : l'hôte en tête de l'équipage A
  roster.sort((a, b) => (a.id === hostId ? -1 : b.id === hostId ? 1 : 0));

  const lobby = await db.lobby.create({
    data: {
      mode: modeKey,
      season,
      status: "AWAITING_CODE",
      hostId,
      members: {
        create: roster.map((r, i) => ({
          playerId: r.id,
          team: i < perTeam ? "A" : "B",
          isBot: r.isBot,
          ready: r.isBot, // les bots sont prêts d'office
        })),
      },
    },
  });

  redirect(`/lobby/${lobby.id}`);
}

export async function setLobbyCode(formData: FormData) {
  const me = await requireCurrentPlayer();
  const lobbyId = String(formData.get("lobbyId"));
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const lobby = await db.lobby.findUnique({ where: { id: lobbyId } });
  if (!lobby || lobby.hostId !== me.id) return;
  if (!code) return;

  await db.lobby.update({
    where: { id: lobbyId },
    data: { joinCode: code, status: "READY" },
  });
  // l'hôte est prêt dès qu'il a publié le code
  await db.lobbyMember.updateMany({
    where: { lobbyId, playerId: me.id },
    data: { ready: true },
  });
  revalidatePath(`/lobby/${lobbyId}`);
}

export async function toggleReady(formData: FormData) {
  const me = await requireCurrentPlayer();
  const lobbyId = String(formData.get("lobbyId"));
  const member = await db.lobbyMember.findUnique({
    where: { lobbyId_playerId: { lobbyId, playerId: me.id } },
  });
  if (!member) return;
  await db.lobbyMember.update({
    where: { id: member.id },
    data: { ready: !member.ready },
  });
  revalidatePath(`/lobby/${lobbyId}`);
}

export async function launchLobby(formData: FormData) {
  const me = await requireCurrentPlayer();
  const lobbyId = String(formData.get("lobbyId"));
  const lobby = await db.lobby.findUnique({
    where: { id: lobbyId },
    include: { members: true },
  });
  if (!lobby || lobby.hostId !== me.id) return;
  if (!lobby.joinCode) return;

  // ratings de départ pour mmrBefore (saison du salon)
  const ratings = await db.rating.findMany({
    where: { mode: lobby.mode, season: lobby.season, playerId: { in: lobby.members.map((m) => m.playerId) } },
  });
  const mmrOf = new Map(ratings.map((r) => [r.playerId, r.mmr]));

  const match = await db.match.create({
    data: {
      mode: lobby.mode,
      season: lobby.season,
      status: "AWAITING_PROOF",
      joinCode: lobby.joinCode,
      hostId: lobby.hostId,
      players: {
        create: lobby.members.map((m) => ({
          playerId: m.playerId,
          team: m.team,
          mmrBefore: mmrOf.get(m.playerId) ?? 1500,
        })),
      },
    },
  });

  await db.lobby.update({
    where: { id: lobbyId },
    data: { status: "LAUNCHED", matchId: match.id },
  });

  revalidatePath("/matches");
  redirect(`/matches/${match.id}`);
}

export async function cancelLobby(formData: FormData) {
  const me = await requireCurrentPlayer();
  const lobbyId = String(formData.get("lobbyId"));
  const lobby = await db.lobby.findUnique({ where: { id: lobbyId } });
  if (!lobby || lobby.hostId !== me.id) return;
  await db.lobby.update({ where: { id: lobbyId }, data: { status: "CANCELLED" } });
  redirect("/play");
}

/* ============================================================
   CHAT (DM | PARTY | GLOBAL)
   ============================================================ */
export async function sendChatMessage(input: {
  channelType: "DM" | "PARTY" | "GLOBAL";
  channelKey: string;
  body: string;
}) {
  const me = await requireCurrentPlayer();
  const body = input.body.trim().slice(0, 800);
  if (!body) return { ok: false };
  await db.chatMessage.create({
    data: {
      channelType: input.channelType,
      channelKey: input.channelKey,
      authorId: me.id,
      body,
    },
  });
  return { ok: true };
}

/** Messages d'un canal (les plus récents en dernier). */
export async function fetchChannel(channelType: string, channelKey: string) {
  const me = await requireCurrentPlayer();
  const msgs = await db.chatMessage.findMany({
    where: { channelType, channelKey },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { author: { select: { id: true, handle: true, avatarHue: true } } },
  });
  return {
    meId: me.id,
    messages: msgs.map((m) => ({
      id: m.id,
      authorId: m.authorId,
      handle: m.author.handle,
      hue: m.author.avatarHue,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      mine: m.authorId === me.id,
    })),
  };
}

/** Liste des conversations : DM ouverts + groupe courant + global. */
export async function listConversations() {
  const me = await requireCurrentPlayer();

  // DM : tous les messages où je suis impliqué (la clé contient mon id)
  const dms = await db.chatMessage.findMany({
    where: { channelType: "DM", channelKey: { contains: me.id } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { channelKey: true, body: true, createdAt: true, authorId: true },
  });

  const seen = new Set<string>();
  const otherIds: string[] = [];
  const lastByKey = new Map<string, { body: string; at: string }>();
  for (const m of dms) {
    if (!lastByKey.has(m.channelKey)) {
      lastByKey.set(m.channelKey, { body: m.body, at: m.createdAt.toISOString() });
    }
    const other = m.channelKey.split("__").find((id) => id !== me.id);
    if (other && !seen.has(other)) {
      seen.add(other);
      otherIds.push(other);
    }
  }

  const others = otherIds.length
    ? await db.player.findMany({
        where: { id: { in: otherIds } },
        select: { id: true, handle: true, avatarHue: true },
      })
    : [];

  const conversations = others.map((o) => {
    const key = [me.id, o.id].sort().join("__");
    return {
      otherId: o.id,
      handle: o.handle,
      hue: o.avatarHue,
      key,
      last: lastByKey.get(key)?.body ?? "",
    };
  });

  // groupe courant
  const membership = await db.partyMember.findUnique({
    where: { playerId: me.id },
    select: { partyId: true },
  });

  return { meId: me.id, conversations, partyId: membership?.partyId ?? null };
}

/** Recherche de pirates par pseudo (pour démarrer une conversation). */
export async function searchPlayers(query: string) {
  const me = await requireCurrentPlayer();
  const q = query.trim();
  if (q.length < 1) return [];
  const players = await db.player.findMany({
    where: {
      handle: { contains: q },
      NOT: { id: me.id },
    },
    select: { id: true, handle: true, avatarHue: true },
    take: 8,
    orderBy: { handle: "asc" },
  });
  return players;
}
