import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MODES, getMode } from "@/lib/modes";
import { rankForMmr } from "@/lib/ranks";
import { ACCENT } from "@/lib/accent";
import { PirateAvatar } from "@/components/pirate-avatar";
import { RankBadge } from "@/components/rank-badge";
import { ModeGlyph } from "@/components/icons";
import { flag } from "@/lib/format";
import { getActiveSeason } from "@/lib/season";

export const dynamic = "force-dynamic";

export default async function LadderPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode: modeKey } = await params;
  const mode = getMode(modeKey);
  if (!mode) notFound();
  const a = ACCENT[mode.accent];
  const season = await getActiveSeason();

  const ratings = await db.rating.findMany({
    where: { mode: modeKey, season },
    orderBy: { mmr: "desc" },
    include: { player: true },
  });

  return (
    <div className="content-layer mx-auto max-w-6xl px-4 py-10">
      {/* Onglets modes */}
      <nav className="flex flex-wrap gap-2">
        {MODES.map((m) => {
          const active = m.key === modeKey;
          const ac = ACCENT[m.accent];
          return (
            <Link
              key={m.key}
              href={`/ladder/${m.key}`}
              className="flex items-center gap-2 rounded-sm border px-3 py-2 font-display text-xs uppercase tracking-widest transition-colors"
              style={{
                borderColor: active ? ac.color : "rgba(200,162,75,0.2)",
                background: active ? ac.soft : "transparent",
                color: active ? ac.color : "var(--color-fog)",
              }}
            >
              <ModeGlyph name={m.icon} width={16} height={16} />
              {m.name}
            </Link>
          );
        })}
      </nav>

      {/* En-tête mode */}
      <header className="plank plank-bracket mt-6 flex flex-wrap items-center gap-5 p-6" style={{ borderColor: `${a.color}44` }}>
        <div
          className="grid h-16 w-16 place-items-center rounded-sm border"
          style={{ borderColor: `${a.color}66`, background: a.soft, color: a.color }}
        >
          <ModeGlyph name={mode.icon} width={36} height={36} />
        </div>
        <div className="flex-1">
          <p className="seal" style={{ color: a.color }}>
            Classement · Saison {season} · {mode.tagline}
          </p>
          <h1 className="font-display text-3xl font-bold text-bone">{mode.name}</h1>
          <p className="mt-1 text-sm text-fog">{mode.format} · Preset {mode.preset}</p>
        </div>
        <Link href={`/modes#${mode.key}`} className="btn-ghost">Voir les réglages</Link>
        <Link href="/archives" className="btn-ghost">Saisons passées</Link>
        <Link href="/play" className="btn-brass">Jouer ce mode</Link>
      </header>

      {/* Tableau */}
      <div className="plank mt-6 overflow-hidden">
        <div className="grid grid-cols-[3rem_1fr_5rem_5rem_5rem] items-center gap-2 border-b border-brass/20 bg-black/20 px-4 py-3 font-display text-[0.65rem] uppercase tracking-widest text-fog sm:grid-cols-[3rem_1fr_7rem_6rem_5rem_5rem]">
          <span className="text-center">#</span>
          <span>Pirate</span>
          <span className="hidden text-right sm:block">Rang</span>
          <span className="text-right">MMR</span>
          <span className="text-right">V / D</span>
          <span className="text-right">%</span>
        </div>

        {ratings.length === 0 && (
          <div className="px-4 py-16 text-center text-fog">
            Aucun pirate classé sur ce ladder pour l&apos;instant. Sois le premier à prendre la mer.
          </div>
        )}

        {ratings.map((r, i) => {
          const rank = rankForMmr(r.mmr);
          const total = r.wins + r.losses;
          const wr = total ? Math.round((r.wins / total) * 100) : 0;
          const top3 = i < 3;
          return (
            <Link
              key={r.id}
              href={`/players/${r.playerId}`}
              className="grid grid-cols-[3rem_1fr_5rem_5rem_5rem] items-center gap-2 border-b border-brass/10 px-4 py-3 transition-colors hover:bg-brass/5 sm:grid-cols-[3rem_1fr_7rem_6rem_5rem_5rem]"
            >
              <span
                className={`text-center font-display text-lg font-bold ${top3 ? "" : "text-fog-deep"}`}
                style={top3 ? { color: a.color } : undefined}
              >
                {i + 1}
              </span>
              <div className="flex min-w-0 items-center gap-3">
                <PirateAvatar handle={r.player.handle} hue={r.player.avatarHue} size={36} />
                <div className="min-w-0">
                  <div className="truncate font-display text-bone">
                    {flag(r.player.country)} {r.player.handle}
                  </div>
                  {r.placementsLeft > 0 && (
                    <span className="text-[0.65rem] text-brass/70">
                      placement · {r.placementsLeft} restant{r.placementsLeft > 1 ? "s" : ""}
                    </span>
                  )}
                  {r.placementsLeft === 0 && r.streak !== 0 && (
                    <span className={`text-[0.65rem] ${r.streak > 0 ? "text-verdigris" : "text-blood-bright"}`}>
                      {r.streak > 0 ? `série de ${r.streak} V` : `série de ${-r.streak} D`}
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden justify-end sm:flex">
                <RankBadge mmr={r.mmr} size={30} />
              </div>
              <div className="stat-num text-right text-lg font-bold" style={{ color: rank.color }}>
                {r.mmr}
              </div>
              <div className="stat-num text-right text-sm text-fog">
                {r.wins}<span className="text-fog-deep">/</span>{r.losses}
              </div>
              <div className="stat-num text-right text-sm text-parchment">{wr}%</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
