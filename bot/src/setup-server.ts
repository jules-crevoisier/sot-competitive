// Construit la structure du serveur Custom Seas Lounge : rôles de rang (couleurs
// reprises de la DA du site) + catégories et salons. Idempotent : ne recrée pas
// ce qui existe déjà. Lance : npm run setup-server
import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  Events,
  type Guild,
} from "discord.js";
import { RANKS } from "../../web/src/lib/ranks";

const { DISCORD_TOKEN, DISCORD_GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !DISCORD_GUILD_ID) {
  throw new Error("DISCORD_TOKEN et DISCORD_GUILD_ID requis (cf. .env).");
}

// Rôles de staff + rôles de rang (du plus bas au plus haut → hoisted).
const STAFF_ROLES = [
  { name: "Amiral", color: 0xe6c168 }, // admin
  { name: "Quartier-maître", color: 0x3fa796 }, // staff / arbitre
  { name: "Partenaire", color: 0x9146ff }, // streamer
];

const STRUCTURE: { category: string; channels: { name: string; type?: "text" | "voice" }[] }[] = [
  {
    category: "📜 ACCUEIL",
    channels: [
      { name: "règlement" },
      { name: "annonces" },
      { name: "inscription" }, // /inscription se fait ici
      { name: "présentation" },
    ],
  },
  {
    category: "🏴 COMPÉTITION",
    channels: [
      { name: "files-d-attente" },
      { name: "résultats" },
      { name: "litiges" }, // staff only
      { name: "ladder" },
    ],
  },
  {
    category: "💬 COMMUNAUTÉ",
    channels: [
      { name: "général" },
      { name: "recherche-équipage" },
      { name: "clips-et-vods" },
      { name: "propositions-de-modes" },
    ],
  },
  {
    category: "🎙️ SALONS VOCAUX",
    channels: [
      { name: "Taverne", type: "voice" },
      { name: "Sloop 2v2", type: "voice" },
      { name: "Brigantine 3v3", type: "voice" },
      { name: "Galion 4v4", type: "voice" },
    ],
  },
];

async function ensureRoles(guild: Guild) {
  // staff d'abord (au-dessus dans la hiérarchie)
  for (const r of STAFF_ROLES) {
    if (!guild.roles.cache.some((x) => x.name === r.name)) {
      await guild.roles.create({ name: r.name, color: r.color, hoist: true, mentionable: true });
      console.log(`+ rôle staff : ${r.name}`);
    }
  }
  // rangs (du plus haut au plus bas pour que la hiérarchie soit cohérente)
  for (const rank of [...RANKS].reverse()) {
    if (!guild.roles.cache.some((x) => x.name === rank.name)) {
      await guild.roles.create({
        name: rank.name,
        color: Number(`0x${rank.color.slice(1)}`),
        hoist: true,
      });
      console.log(`+ rôle rang : ${rank.name}`);
    }
  }
}

async function ensureChannels(guild: Guild) {
  const staffRole = guild.roles.cache.find((r) => r.name === "Quartier-maître");
  for (const block of STRUCTURE) {
    let category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === block.category,
    );
    if (!category) {
      category = await guild.channels.create({ name: block.category, type: ChannelType.GuildCategory });
      console.log(`+ catégorie : ${block.category}`);
    }
    for (const ch of block.channels) {
      const type = ch.type === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText;
      const exists = guild.channels.cache.some((c) => c.name === ch.name.toLowerCase().replace(/ /g, "-") && c.parentId === category!.id);
      if (exists) continue;
      // #litiges réservé au staff
      const isStaffOnly = ch.name === "litiges";
      await guild.channels.create({
        name: ch.name,
        type,
        parent: category.id,
        permissionOverwrites:
          isStaffOnly && staffRole
            ? [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel] },
              ]
            : undefined,
      });
      console.log(`  + salon : ${ch.name}`);
    }
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async () => {
  const guild = await client.guilds.fetch(DISCORD_GUILD_ID!);
  const full = await guild.fetch();
  console.log(`Configuration de « ${full.name} »…`);
  await ensureRoles(full);
  await full.roles.fetch();
  await ensureChannels(full);
  console.log("✅ Serveur configuré.");
  await client.destroy();
  process.exit(0);
});

client.login(DISCORD_TOKEN);
