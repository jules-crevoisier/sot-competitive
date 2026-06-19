import Link from "next/link";
import type { Mode } from "@/lib/modes";
import { ACCENT } from "@/lib/accent";
import { ModeGlyph } from "./icons";

export function ModeCard({ mode, players }: { mode: Mode; players?: number }) {
  const a = ACCENT[mode.accent];
  return (
    <Link
      href={`/ladder/${mode.key}`}
      className="plank plank-bracket group relative block overflow-hidden p-5 transition-transform hover:-translate-y-1"
      style={{ borderColor: `${a.color}44` }}
    >
      {/* halo d'accent */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity group-hover:opacity-100"
        style={{ background: a.color, opacity: 0.16 }}
      />
      <div className="relative flex items-start justify-between">
        <div
          className="grid h-12 w-12 place-items-center rounded-sm border"
          style={{ borderColor: `${a.color}55`, background: a.soft, color: a.color }}
        >
          <ModeGlyph name={mode.icon} width={26} height={26} />
        </div>
        <span
          className="chip"
          style={{ color: mode.tier === "principal" ? a.color : "var(--color-fog)" }}
        >
          {mode.tier === "principal" ? "LADDER PRINCIPAL" : "SECONDAIRE"}
        </span>
      </div>

      <h3 className="mt-4 font-display text-xl font-bold text-bone">{mode.name}</h3>
      <p className="font-display text-xs uppercase tracking-widest" style={{ color: a.color }}>
        {mode.tagline} · {mode.ship}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fog">{mode.summary}</p>

      <div className="mt-4 flex items-center justify-between border-t border-brass/15 pt-3 text-xs text-fog">
        <span className="font-mono">{mode.format}</span>
        {players !== undefined && (
          <span className="font-mono">
            <span className="text-parchment stat-num">{players}</span> classés
          </span>
        )}
      </div>
    </Link>
  );
}
