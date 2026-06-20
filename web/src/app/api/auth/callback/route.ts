// Retour OAuth2 : vérifie le state, échange le code, contrôle l'appartenance au
// serveur, retrouve le Player lié (créé via le bot) et ouvre la session.
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  authConfig,
  exchangeCode,
  fetchDiscordUser,
  isGuildMember,
  setSessionCookie,
  STATE_COOKIE,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const cfg = authConfig();
  const back = (e: string) => NextResponse.redirect(`${cfg.baseUrl}/login?e=${e}`);
  if (!cfg.enabled) return back("disabled");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const store = await cookies();
  const savedState = store.get(STATE_COOKIE)?.value;
  store.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });

  if (!code || !state || !savedState || state !== savedState) return back("state");

  try {
    const token = await exchangeCode(code);

    if (!(await isGuildMember(token))) return back("guild");

    const user = await fetchDiscordUser(token);
    const player = await db.player.findUnique({ where: { discordId: user.id } });
    if (!player) return back("notregistered");

    await setSessionCookie(player.id);
    return NextResponse.redirect(`${cfg.baseUrl}/me`);
  } catch {
    return back("oauth");
  }
}
