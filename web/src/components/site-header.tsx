"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassRose } from "./icons";
import { PlayerSwitcher } from "./player-switcher";

const NAV = [
  { href: "/ladder/sloop-2v2", label: "Classement", match: "/ladder" },
  { href: "/modes", label: "Modes", match: "/modes" },
  { href: "/teams", label: "Équipages", match: "/teams" },
  { href: "/friends", label: "Amis", match: "/friends" },
  { href: "/events", label: "Events", match: "/events" },
  { href: "/play", label: "Jouer", match: "/play" },
];

type Lite = { id: string; handle: string; avatarHue: number; role: string };

export function SiteHeader({
  current,
  players,
}: {
  current: Lite | null;
  players: Lite[];
}) {
  const pathname = usePathname();
  return (
    <header className="content-layer sticky top-0 z-50">
      <div
        className="border-b border-brass/25 backdrop-blur-md"
        style={{ background: "linear-gradient(180deg, rgba(8,16,24,.92), rgba(8,16,24,.78))" }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          {/* Marque */}
          <Link href="/" className="group flex items-center gap-3">
            <span className="text-brass transition-transform group-hover:rotate-45">
              <CompassRose width={30} height={30} />
            </span>
            <span className="leading-none">
              <span className="block font-display text-lg font-bold tracking-wider text-bone">
                CUSTOM SEAS
              </span>
              <span className="block font-display text-[0.6rem] tracking-[0.34em] text-brass">
                · LOUNGE ·
              </span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.match);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 font-display text-xs uppercase tracking-widest transition-colors ${
                    active ? "text-brass" : "text-fog hover:text-parchment"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-px bg-brass shadow-[0_0_8px_var(--color-brass)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Link href="/admin" className="hidden text-fog hover:text-parchment sm:block" title="Espace staff">
              <span className="font-display text-xs uppercase tracking-widest">Staff</span>
            </Link>
            <PlayerSwitcher current={current} players={players} />
          </div>
        </div>
      </div>
    </header>
  );
}
