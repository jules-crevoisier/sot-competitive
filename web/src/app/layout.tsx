import type { Metadata } from "next";
import { Cinzel, Spectral, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${cinzel.variable} ${spectral.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="content-layer flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
