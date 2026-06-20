// Point d'entrée du bot : connexion + routage des commandes slash.
import "dotenv/config";
import { Client, GatewayIntentBits, Events, Collection } from "discord.js";
import { commands } from "./commands.js";

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("DISCORD_TOKEN manquant (cf. .env).");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const registry = new Collection(commands.map((c) => [c.data.name, c]));

client.once(Events.ClientReady, (c) => {
  console.log(`⚓ Connecté en tant que ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = registry.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    const msg = { content: "Une erreur est survenue.", ephemeral: true } as const;
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg).catch(() => {});
    else await interaction.reply(msg).catch(() => {});
  }
});

client.login(token);
