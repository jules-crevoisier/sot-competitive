// Authentification Discord (OAuth2) — implémentation maison, sans dépendance.
// Règle d'accès : être membre du serveur Discord ET avoir un compte (créé via le
// bot avec pseudo vérifié). La session est un cookie signé HMAC (httpOnly).
//
// Si les identifiants OAuth ne sont pas configurés (dev local / CI), l'auth est
// "désactivée" et on retombe sur le sélecteur de pirate dev (cf. session.ts).

import crypto from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "sot_session";
export const STATE_COOKIE = "sot_oauth_state";
export const DEV_COOKIE = "sot_player"; // sélecteur dev (auth désactivée)

const DISCORD_API = "https://discord.com/api";

export type AuthConfig = {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  guildId?: string;
  secret: string;
  baseUrl: string;
};

export function authConfig(): AuthConfig {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const baseUrl = (process.env.AUTH_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
  return {
    enabled: Boolean(clientId && clientSecret),
    clientId,
    clientSecret,
    guildId: process.env.DISCORD_GUILD_ID,
    // clé de signature : AUTH_SECRET sinon le client secret (toujours secret côté serveur)
    secret: process.env.AUTH_SECRET || clientSecret || "dev-insecure-secret",
    baseUrl,
  };
}

export function isAuthEnabled(): boolean {
  return authConfig().enabled;
}

/* ---------- Session signée ---------- */
function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

export function signSession(playerId: string, ttlDays = 30): string {
  const exp = Date.now() + ttlDays * 86_400_000;
  const payload = b64url(JSON.stringify({ pid: playerId, exp }));
  const sig = crypto.createHmac("sha256", authConfig().secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", authConfig().secret).update(payload).digest("base64url");
  // comparaison à temps constant
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const { pid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof pid !== "string" || typeof exp !== "number" || Date.now() > exp) return null;
    return pid;
  } catch {
    return null;
  }
}

export async function getSessionPlayerId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export async function setSessionCookie(playerId: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, signSession(playerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 86_400,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

/* ---------- OAuth2 Discord ---------- */
export function redirectUri(): string {
  return `${authConfig().baseUrl}/api/auth/callback`;
}

export function discordAuthorizeUrl(state: string): string {
  const { clientId } = authConfig();
  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "identify guilds",
    state,
    prompt: "consent",
  });
  return `${DISCORD_API}/oauth2/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<string> {
  const { clientId, clientSecret } = authConfig();
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export type DiscordUser = { id: string; username: string; global_name?: string | null };

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`fetch user failed: ${res.status}`);
  return res.json();
}

/** Vrai si l'utilisateur est membre du serveur requis (ou si aucun serveur n'est imposé). */
export async function isGuildMember(accessToken: string): Promise<boolean> {
  const { guildId } = authConfig();
  if (!guildId) return true;
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return false;
  const guilds = (await res.json()) as { id: string }[];
  return guilds.some((g) => g.id === guildId);
}
