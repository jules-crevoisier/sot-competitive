import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MODES, getMode } from "@/lib/modes";
import { rankForMmr, rankProgress } from "@/lib/ranks";
import { ACCENT } from "@/lib/accent";
import { PirateAvatar } from "@/components/pirate-avatar";
import { RankBadge } from "@/components/rank-badge";
import { ModeGlyph } from "@/components/icons";
import { flag, timeAgo, signed } from "@/lib/format";
import { getActiveSeason } from "@/lib/season";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const season = await getActiveSeason();
  const player = await db.player.findUnique({
    where: { id },
    include: {
      ratings: { where: { season } },
      membership: { include: { team: true } },
      matchPlayers: {
        include: { match: { include: { players: { include: { player: true } } } } },
        orderBy: { match: { playedAt: "desc" } },
        take: 60,
      },
    },
  });
  if (!player) notFound();

  const socials = [
    player.twitch && { label: "Twitch", href: `https://twitch.tv/${player.twitch}`, handle: player.twitch },
    player.youtube && { label: "YouTube", href: `https://youtube.com/@${player.youtube}`, handle: player.youtube },
    player.twitter && { label: "X", href: `https://x.com/${player.twitter}`, handle: `@${player.twitter}` },
  ].filter(Boolean) as { label: string; href: string; handle: string }[];
  const hasIdentity = player.weapon || player.playStyle || player.membership || socials.length > 0;

  // ladder principal = celui avec le plus de matchs joués (wins+losses)
  const sorted = [...player.ratings].sort((x, y) => y.wins + y.losses - (x.wins + x.losses));
  const main = sorted[0];
  const mainMode = main ? getMode(main.mode) : undefined;
  const prog = main ? rankProgress(main.mmr) : { pct: 0 };

  // Courbe MMR du ladder principal
  const mainHistory = player.matchPlayers
    .filter((mp) => mp.match.mode === main?.mode && mp.match.status === "VALIDATED")
    .sort((x, y) => x.match.playedAt.getTime() - y.match.playedAt.getTime())
    .map((mp) => mp.mmrAfter);

  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-10">
      {/* En-tête profil */}
      <header className="plank plank-bracket relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 text-brass opacity-[0.07]">
          <ModeGlyph name={mainMode?.icon ?? "anchor"} width={180} height={180} />
        </div>
        <div className="relative flex flex-wrap items-center gap-6">
          <PirateAvatar handle={player.handle} hue={player.avatarHue} size={88} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-black text-bone">{player.handle}</h1>
              <span className="text-2xl">{flag(player.country)}</span>
              {player.verified && (
                <span
                  className="chip flex items-center gap-1"
                  style={{ color: "var(--color-verdigris)", borderColor: "var(--color-verdigris)" }}
                  title="Pseudo vérifié par capture"
                >
                  ✓ Vérifié
                </span>
              )}
              {player.role !== "PLAYER" && (
                <span className="chip text-brass">{player.role}</span>
              )}
            </div>
            {player.bio && <p className="mt-1 max-w-xl text-sm text-fog">{player.bio}</p>}
            <p className="mt-1 text-xs text-fog-deep">Mouille l&apos;ancre ici depuis {timeAgo(player.createdAt)}</p>
          </div>
          {main && (
            <div className="text-center">
              <RankBadge mmr={main.mmr} size={56} />
              <div className="stat-num mt-1 text-2xl font-bold text-brass">{main.mmr}</div>
              <div className="font-display text-[0.6rem] uppercase tracking-widest text-fog">
                {mainMode?.name}
              </div>
            </div>
          )}
        </div>

        {/* Progression vers rang suivant */}
        {main && prog.next && (
          <div className="relative mt-6">
            <div className="flex justify-between text-xs text-fog">
              <span style={{ color: rankForMmr(main.mmr).color }}>{rankForMmr(main.mmr).name}</span>
              <span>{prog.next.name} · {prog.next.min}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full"
                style={{ width: `${prog.pct * 100}%`, background: "linear-gradient(90deg,#7c5f25,#e6c168)" }}
              />
            </div>
          </div>
        )}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Colonne gauche : courbe + ladders */}
        <div className="space-y-6">
          {hasIdentity && (
            <div className="plank p-5">
              <p className="seal">Fiche de pont</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {player.weapon && (
                  <Detail label="Arme préférée" value={player.weapon} />
                )}
                {player.playStyle && (
                  <Detail label="Style de jeu" value={player.playStyle} />
                )}
                {player.membership && (
                  <div>
                    <span className="mb-1 block font-display text-[0.6rem] uppercase tracking-widest text-fog">Équipage</span>
                    <Link href={`/teams/${player.membership.teamId}`} className="font-display text-parchment hover:text-brass">
                      [{player.membership.team.tag}] {player.membership.team.name}
                    </Link>
                  </div>
                )}
              </div>
              {socials.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-brass/10 pt-4">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="chip text-brass transition-colors hover:bg-brass/10"
                    >
                      {s.label} · {s.handle}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {mainHistory.length > 1 && (
            <div className="plank p-5">
              <p className="seal">Évolution MMR · {mainMode?.name}</p>
              <MmrChart values={mainHistory} />
            </div>
          )}

          <div className="plank p-5">
            <p className="seal">Classements par mode</p>
            <div className="mt-4 space-y-2">
              {MODES.map((mode) => {
                const r = player.ratings.find((x) => x.mode === mode.key);
                if (!r || r.wins + r.losses === 0) return null;
                const a = ACCENT[mode.accent];
                const total = r.wins + r.losses;
                const wr = total ? Math.round((r.wins / total) * 100) : 0;
                return (
                  <Link
                    key={mode.key}
                    href={`/ladder/${mode.key}`}
                    className="flex items-center gap-3 rounded-sm border border-brass/15 px-3 py-2 transition-colors hover:bg-brass/5"
                  >
                    <span style={{ color: a.color }}>
                      <ModeGlyph name={mode.icon} width={20} height={20} />
                    </span>
                    <span className="flex-1 font-display text-sm text-parchment">{mode.name}</span>
                    <span className="stat-num text-xs text-fog">{r.wins}V/{r.losses}D · {wr}%</span>
                    <span className="stat-num w-14 text-right text-lg font-bold" style={{ color: rankForMmr(r.mmr).color }}>
                      {r.mmr}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Colonne droite : derniers matchs */}
        <div className="plank p-5">
          <p className="seal">Derniers combats</p>
          <div className="mt-4 space-y-2">
            {player.matchPlayers.filter((mp) => mp.match.status === "VALIDATED").slice(0, 10).map((mp) => {
              const m = mp.match;
              const won = m.winner === mp.team;
              const mode = getMode(m.mode);
              const opp = m.players.filter((p) => p.team !== mp.team);
              return (
                <Link
                  key={mp.id}
                  href={`/matches/${m.id}`}
                  className="flex items-center gap-3 rounded-sm border-l-2 px-3 py-2 transition-colors hover:bg-brass/5"
                  style={{ borderColor: won ? "var(--color-verdigris)" : "var(--color-blood)" }}
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-sm font-display text-xs font-bold"
                    style={{
                      background: won ? "rgba(63,167,150,0.15)" : "rgba(163,47,40,0.15)",
                      color: won ? "var(--color-verdigris)" : "var(--color-blood-bright)",
                    }}
                  >
                    {won ? "V" : "D"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-parchment">{mode?.name}</div>
                    <div className="truncate text-xs text-fog">
                      vs {opp.map((o) => o.player.handle).join(", ")}
                    </div>
                  </div>
                  <span className={`stat-num text-sm font-bold ${mp.mmrDelta > 0 ? "text-verdigris" : "text-blood-bright"}`}>
                    {signed(mp.mmrDelta)}
                  </span>
                </Link>
              );
            })}
            {player.matchPlayers.length === 0 && (
              <p className="text-sm text-fog">Pas encore de combat à son actif.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-1 block font-display text-[0.6rem] uppercase tracking-widest text-fog">{label}</span>
      <span className="text-parchment">{value}</span>
    </div>
  );
}

/** Sparkline MMR en SVG, dégradé laiton. */
function MmrChart({ values }: { values: number[] }) {
  const w = 560;
  const h = 130;
  const pad = 8;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`;
  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mmrfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8a24b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c8a24b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#mmrfill)" />
        <path d={line} fill="none" stroke="#e6c168" strokeWidth="2" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3.5 : 1.6} fill="#f4ecd8" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-xs text-fog">
        <span>min {min}</span>
        <span className="text-brass">actuel {values[values.length - 1]}</span>
        <span>pic {max}</span>
      </div>
    </div>
  );
}
