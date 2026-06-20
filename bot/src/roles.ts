// Synchronisation des rôles Discord avec le rang MMR du joueur.
import type { ChatInputCommandInteraction } from "discord.js";
import { db } from "./db.js";
import { RANKS, rankForMmr } from "../../web/src/lib/ranks";

/** Donne au membre le rôle Discord correspondant à son meilleur rang, et retire les autres. */
export async function syncRankRole(i: ChatInputCommandInteraction, playerId: string) {
  if (!i.guild) return;
  const member = await i.guild.members.fetch(i.user.id).catch(() => null);
  if (!member) return;

  const ratings = await db.rating.findMany({ where: { playerId, season: 1 } });
  const bestMmr = ratings.reduce((acc, r) => Math.max(acc, r.mmr), 0);
  if (bestMmr === 0) return; // pas encore classé

  const targetRank = rankForMmr(bestMmr);
  const rankNames = new Set(RANKS.map((r) => r.name));

  // retire tous les rôles de rang qui ne sont pas le bon
  for (const role of member.roles.cache.values()) {
    if (rankNames.has(role.name) && role.name !== targetRank.name) {
      await member.roles.remove(role).catch(() => {});
    }
  }
  // ajoute le bon (s'il existe sur le serveur)
  const role = i.guild.roles.cache.find((r) => r.name === targetRank.name);
  if (role && !member.roles.cache.has(role.id)) {
    await member.roles.add(role).catch(() => {});
  }
}
