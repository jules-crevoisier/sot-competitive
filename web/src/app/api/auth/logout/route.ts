// Déconnexion : efface la session puis renvoie à l'accueil.
import { NextResponse } from "next/server";
import { authConfig, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.redirect(`${authConfig().baseUrl}/`, { status: 303 });
}
