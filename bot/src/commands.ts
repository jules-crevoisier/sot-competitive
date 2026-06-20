// Commandes slash du bot. La logique de données vit dans la même base que le web ;
// les barèmes (rangs, modes) sont importés de la couche métier du site, source unique.
import {
  SlashCommandBuilder,
  EmbedBuilder,
  type SlashCommandOptionsOnlyBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { db } from "./db.js";
import { MODES, getMode } from "../../web/src/lib/modes";
import { rankForMmr } from "../../web/src/lib/ranks";
import { recognizeText, checkPseudo } from "../../web/src/lib/ocr";
import { syncRankRole } from "./roles.js";

const BRASS = 0xc8a24b;

export type Command = {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (i: ChatInputCommandInteraction) => Promise<void>;
};

/* ---------- /inscription ---------- */
const inscription: Command = {
  data: new SlashCommandBuilder()
    .setName("inscription")
    .setDescription("Lie ton compte Discord à ton pseudo Sea of Thieves (capture vérifiée).")
    .addStringOption((o) =>
      o.setName("pseudo").setDescription("Ton pseudo exact en jeu").setRequired(true).setMaxLength(24),
    )
    .addAttachmentOption((o) =>
      o
        .setName("preuve")
        .setDescription("Capture où ton pseudo en jeu est lisible (menu, équipage, scoreboard)")
        .setRequired(true),
    ),
  async execute(i) {
    const handle = i.options.getString("pseudo", true).trim();
    const shot = i.options.getAttachment("preuve", true);
    const discordId = i.user.id;

    // déjà inscrit ?
    const mine = await db.player.findUnique({ where: { discordId } });
    if (mine) {
      await i.reply({ content: `Tu es déjà inscrit en tant que **${mine.handle}**.`, ephemeral: true });
      return;
    }
    // pseudo déjà pris ?
    const byHandle = await db.player.findUnique({ where: { handle } });
    if (byHandle && byHandle.discordId) {
      await i.reply({ content: `Le pseudo **${handle}** est déjà lié à un autre compte Discord.`, ephemeral: true });
      return;
    }
    if (!shot.contentType?.startsWith("image/")) {
      await i.reply({ content: "La preuve doit être une image.", ephemeral: true });
      return;
    }

    await i.deferReply({ ephemeral: true }); // l'OCR peut prendre quelques secondes

    // lecture automatique de la capture
    let matched = false;
    try {
      const res = await fetch(shot.url);
      const buf = Buffer.from(await res.arrayBuffer());
      const text = await recognizeText(buf);
      matched = checkPseudo(text, handle).ok;
    } catch {
      await i.editReply("Impossible de lire l'image. Réessaie avec une capture plus nette.");
      return;
    }

    if (!matched) {
      await i.editReply(
        `❌ Je n'ai pas trouvé **${handle}** sur ta capture. Assure-toi que ton pseudo est bien lisible et réessaie.`,
      );
      return;
    }

    const player = byHandle
      ? await db.player.update({ where: { id: byHandle.id }, data: { discordId, verified: true, verifiedAt: new Date() } })
      : await db.player.create({
          data: { handle, discordId, verified: true, verifiedAt: new Date(), avatarHue: Math.floor(Math.random() * 360) },
        });

    await syncRankRole(i, player.id).catch(() => {});

    await i.editReply(
      `⚓ Bienvenue à bord, **${player.handle}** ! Pseudo vérifié ✓ et compte lié. Complète ton profil sur le site.`,
    );
  },
};

/* ---------- /profil ---------- */
const profil: Command = {
  data: new SlashCommandBuilder()
    .setName("profil")
    .setDescription("Affiche le profil ranked d'un pirate.")
    .addUserOption((o) => o.setName("joueur").setDescription("Le pirate (par défaut : toi)")),
  async execute(i) {
    const target = i.options.getUser("joueur") ?? i.user;
    const player = await db.player.findUnique({
      where: { discordId: target.id },
      include: { ratings: { where: { season: 1 } }, membership: { include: { team: true } } },
    });
    if (!player) {
      await i.reply({ content: `Ce pirate n'est pas inscrit. \`/inscription <pseudo>\` pour commencer.`, ephemeral: true });
      return;
    }

    const sorted = [...player.ratings].sort((a, b) => b.wins + b.losses - (a.wins + a.losses));
    const main = sorted[0];
    const rank = main ? rankForMmr(main.mmr) : null;

    const embed = new EmbedBuilder()
      .setColor(rank ? Number(`0x${rank.color.slice(1)}`) : BRASS)
      .setTitle(`${player.handle}${player.membership ? ` · [${player.membership.team.tag}]` : ""}`)
      .setDescription(player.bio ?? "Aucune bio renseignée.");

    if (main && rank) {
      embed.addFields(
        { name: "Rang", value: `${rank.name} (${main.mmr} MMR)`, inline: true },
        { name: "Bilan", value: `${main.wins}V / ${main.losses}D`, inline: true },
        { name: "Mode principal", value: getMode(main.mode)?.name ?? main.mode, inline: true },
      );
    } else {
      embed.addFields({ name: "Rang", value: "Pas encore classé", inline: true });
    }
    if (player.weapon) embed.addFields({ name: "Arme", value: player.weapon, inline: true });
    if (player.playStyle) embed.addFields({ name: "Style", value: player.playStyle, inline: true });

    await i.reply({ embeds: [embed] });
  },
};

/* ---------- /ladder ---------- */
const ladder: Command = {
  data: new SlashCommandBuilder()
    .setName("ladder")
    .setDescription("Top 10 d'un mode classé.")
    .addStringOption((o) =>
      o
        .setName("mode")
        .setDescription("Le mode")
        .setRequired(true)
        .addChoices(...MODES.map((m) => ({ name: m.name, value: m.key }))),
    ),
  async execute(i) {
    const modeKey = i.options.getString("mode", true);
    const mode = getMode(modeKey);
    if (!mode) {
      await i.reply({ content: "Mode inconnu.", ephemeral: true });
      return;
    }
    const top = await db.rating.findMany({
      where: { mode: modeKey, season: 1, OR: [{ wins: { gt: 0 } }, { losses: { gt: 0 } }] },
      orderBy: { mmr: "desc" },
      take: 10,
      include: { player: true },
    });

    const lines = top.length
      ? top
          .map((r, n) => {
            const rk = rankForMmr(r.mmr);
            return `**${n + 1}.** ${r.player.handle} — ${r.mmr} (${rk.short}) · ${r.wins}V/${r.losses}D`;
          })
          .join("\n")
      : "Aucun pirate classé sur ce mode pour l'instant.";

    const embed = new EmbedBuilder().setColor(BRASS).setTitle(`🏴‍☠️ Ladder — ${mode.name}`).setDescription(lines);
    await i.reply({ embeds: [embed] });
  },
};

export const commands: Command[] = [inscription, profil, ladder];
