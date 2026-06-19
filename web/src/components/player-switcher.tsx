"use client";

import { useState } from "react";
import { PirateAvatar } from "./pirate-avatar";
import { switchPlayer } from "@/lib/social-actions";

type Lite = { id: string; handle: string; avatarHue: number; role: string };

export function PlayerSwitcher({
  current,
  players,
}: {
  current: Lite | null;
  players: Lite[];
}) {
  const [open, setOpen] = useState(false);
  if (!current) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-sm border border-brass/25 bg-black/20 px-2 py-1.5 transition-colors hover:border-brass/60"
        title="Changer de pirate (dev)"
      >
        <PirateAvatar handle={current.handle} hue={current.avatarHue} size={26} />
        <span className="hidden font-display text-xs text-bone sm:block">{current.handle}</span>
        <span className="text-fog-deep">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 max-h-96 w-60 overflow-auto rounded-sm border border-brass/25 bg-[#0c1a26] p-1 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)]">
            <p className="px-2 py-1.5 font-display text-[0.6rem] uppercase tracking-widest text-fog-deep">
              Incarner un pirate (dev)
            </p>
            {players.map((p) => (
              <form key={p.id} action={switchPlayer} onSubmit={() => setOpen(false)}>
                <input type="hidden" name="playerId" value={p.id} />
                <button
                  type="submit"
                  className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-brass/10 ${
                    p.id === current.id ? "bg-brass/10" : ""
                  }`}
                >
                  <PirateAvatar handle={p.handle} hue={p.avatarHue} size={24} />
                  <span className="flex-1 truncate text-sm text-parchment">{p.handle}</span>
                  {p.role !== "PLAYER" && (
                    <span className="font-mono text-[0.6rem] text-brass">{p.role}</span>
                  )}
                  {p.id === current.id && <span className="text-brass">✓</span>}
                </button>
              </form>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
