import type { Metadata } from "next";
import { Cinzel, Spectral, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChatDock } from "@/components/chat-dock";
import { db } from "@/lib/db";
import { getCurrentPlayer } from "@/lib/session";
import { isAuthEnabled } from "@/lib/auth";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Custom Seas Lounge — Ranked Sea of Thieves",
  description:
    "La plateforme de classement compétitif pour Sea of Thieves via le mode Custom Seas (Saison 20). Files d'attente, tables, MMR, validation et ladder.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authEnabled = isAuthEnabled();
  const [current, players] = await Promise.all([
    getCurrentPlayer(),
    // la liste des pirates ne sert qu'au sélecteur dev (auth désactivée)
    authEnabled
      ? Promise.resolve([])
      : db.player.findMany({
          orderBy: { handle: "asc" },
          select: { id: true, handle: true, avatarHue: true, role: true },
        }),
  ]);
  const currentLite = current
    ? { id: current.id, handle: current.handle, avatarHue: current.avatarHue, role: current.role }
    : null;

  return (
    <html
      lang="fr"
      className={`${cinzel.variable} ${spectral.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader current={currentLite} players={players} authEnabled={authEnabled} />
        <main className="content-layer flex-1">{children}</main>
        <SiteFooter />
        {currentLite && <ChatDock me={currentLite} />}
      </body>
    </html>
  );
}
