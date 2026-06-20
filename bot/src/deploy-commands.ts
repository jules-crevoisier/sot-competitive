// Enregistre les commandes slash sur ton serveur (instantané, contrairement au global).
// Lance : npm run deploy
import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commands } from "./commands.js";

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) {
  throw new Error("DISCORD_TOKEN, DISCORD_CLIENT_ID et DISCORD_GUILD_ID requis (cf. .env).");
}

const rest = new REST().setToken(DISCORD_TOKEN);
const body = commands.map((c) => c.data.toJSON());

const result = (await rest.put(
  Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
  { body },
)) as unknown[];

console.log(`✅ ${result.length} commande(s) enregistrée(s) sur le serveur.`);
