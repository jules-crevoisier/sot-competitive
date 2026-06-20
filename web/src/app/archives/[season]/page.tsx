import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MODES, getMode } from "@/lib/modes";
import { rankForMmr } from "@/lib/ranks";
import { ACCENT } from "@/lib/accent";
import { getActiveSeason } from "@/lib/season";
import { teamStandings } from "@/lib/standings";
import { PirateAvatar } from "@/components/pirate-avatar";
import { ModeGlyph } from "@/components/icons";
import { flag } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ArchiveSeasonPage({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season: raw } = await params;
  const season = Number(raw);
  const active = await getActiveSeason();
  // on n'archive que les saisons passées
  if (!Number.isInteger(season) || season < 1 || season >= active) notFound();

  const [ratings, teams] = await Promise.all([
    db.rating.findMany({
      where: { season, OR: [{ wins: { gt: 0 } }, { losses: { gt: 0 } }] },
      orderBy: { mmr: "desc" },
      include: { player: { select: { id: true, handle: true, avatarHue: true, country: true } } },
    }),
    teamStandings(season),
  ]);
  if (ratings.length === 0) notFound();

  const byMode = new Map<string, typeof ratings>();
  for (const r of ratings) {
    const list = byMode.get(r.mode) ?? [];
    list.push(r);
    byMode.set(r.mode, list);
  }
  const rankedTeams = teams.filter((t) => t.mmr !== null);

  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-12">
      <Link href="/archives" className="font-display text-xs uppercase tracking-widest text-fog hover:text-brass">
        ← Toutes les archives
      </Link>

      <header className="mt-4">
        <p className="seal">Saison clôturée</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Saison {season}</h1>
        <p className="mt-2 text-fog">Classements définitifs, tels qu&apos;ils étaient à la clôture.</p>
        <div className="rope-rule mt-4 w-24" />
      </header>

      {/* Ladders par mode */}
      <div className="mt-8 space-y-6">
        {MODES.map((mode) => {
          const list = byMode.get(mode.key);
          if (!list || list.length === 0) return null;
          const a = ACCENT[mode.accent];
          return (
            <div key={mode.key} className="plank p-5">
              <div className="flex items-center gap-2" style={{ color: a.color }}>
                <ModeGlyph name={mode.icon} width={20} height={20} />
                <p className="seal" style={{ color: a.color }}>{mode.name}</p>
              </div>
              <div className="mt-3 divide-y divide-brass/10">
                {list.slice(0, 10).map((r, i) => {
                  const rank = rankForMmr(r.mmr);
                  const total = r.wins + r.losses;
                  const wr = total ? Math.round((r.wins / total) * 100) : 0;
                  return (
                    <Link
                      key={r.id}
                      href={`/players/${r.player.id}`}
                      className="flex items-center gap-3 px-2 py-2 transition-colors hover:bg-brass/5"
                    >
                      <span className="stat-num w-6 text-center text-sm font-bold text-fog">{i + 1}</span>
                      <PirateAvatar handle={r.player.handle} hue={r.player.avatarHue} size={32} />
                      <span className="min-w-0 flex-1 truncate font-display text-parchment">
                        {flag(r.player.country)} {r.player.handle}
                      </span>
                      <span className="stat-num text-xs text-fog">{r.wins}V/{r.losses}D · {wr}%</span>
                      <span className="stat-num w-12 text-right text-lg font-bold" style={{ color: rank.color }}>
                        {r.mmr}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Classement des équipages */}
      {rankedTeams.length > 0 && (
        <div className="plank mt-6 p-5">
          <p className="seal">Équipages</p>
          <div className="mt-3 divide-y divide-brass/10">
            {rankedTeams.slice(0, 10).map((t, i) => {
              const rank = rankForMmr(t.mmr!);
              return (
                <Link
                  key={t.id}
                  href={`/teams/${t.id}`}
                  className="flex items-center gap-3 px-2 py-2 transition-colors hover:bg-brass/5"
                >
                  <span className="stat-num w-6 text-center text-sm font-bold text-fog">{i + 1}</span>
                  <PirateAvatar handle={t.tag} hue={t.accentHue} size={32} />
                  <span className="chip text-brass">[{t.tag}]</span>
                  <span className="min-w-0 flex-1 truncate font-display text-parchment">{t.name}</span>
                  <span className="stat-num text-xs text-fog">{t.wins}V/{t.losses}D</span>
                  <span className="stat-num w-12 text-right text-lg font-bold" style={{ color: rank.color }}>
                    {t.mmr}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
