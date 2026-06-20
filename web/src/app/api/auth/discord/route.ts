// Démarre le flux OAuth2 : génère un state anti-CSRF et redirige vers Discord.
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authConfig, discordAuthorizeUrl, STATE_COOKIE } from "@/lib/auth";

export async function GET() {
  const cfg = authConfig();
  if (!cfg.enabled) {
    return NextResponse.redirect(`${cfg.baseUrl}/login?e=disabled`);
  }

  const state = crypto.randomBytes(16).toString("hex");
  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 min
  });

  return NextResponse.redirect(discordAuthorizeUrl(state));
}
