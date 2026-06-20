import Link from "next/link";
import { db } from "@/lib/db";
import { getActiveSeason } from "@/lib/season";
import { ShipWheel } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Archives des saisons — Custom Seas Lounge" };

export default async function ArchivesPage() {
  const active = await getActiveSeason();

  // saisons passées ayant des données (classements)
  const grouped = await db.rating.groupBy({
    by: ["season"],
    where: { season: { lt: active } },
    _count: { _all: true },
  });
  const seasons = grouped.map((g) => g.season).sort((a, b) => b - a);

  // nb de matchs validés par saison passée (pour l'affichage)
  const matchCounts = new Map<number, number>();
  await Promise.all(
    seasons.map(async (s) => {
      matchCounts.set(s, await db.match.count({ where: { season: s, status: "VALIDATED" } }));
    }),
  );
  const ratedCounts = new Map(grouped.map((g) => [g.season, g._count._all]));

  return (
    <div className="content-layer mx-auto max-w-4xl px-4 py-12">
      <header>
        <p className="seal">Le grand livre de bord</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Archives des saisons</h1>
        <p className="mt-3 max-w-2xl text-fog">
          Les classements des saisons clôturées, gravés dans le marbre. La saison&nbsp;{active} est en
          cours — retrouve son ladder vivant sur la page Classement.
        </p>
        <div className="rope-rule mt-4 w-24" />
      </header>

      {seasons.length === 0 ? (
        <div className="plank mt-8 px-4 py-16 text-center text-fog">
          <ShipWheel className="mx-auto text-brass/40" width={48} height={48} />
          <p className="mt-3">
            Aucune saison archivée pour l&apos;instant — la saison&nbsp;{active} est la première.
          </p>
          <Link href="/ladder/sloop-2v2" className="mt-4 inline-block btn-ghost">
            Voir le classement en cours
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {seasons.map((s) => (
            <Link
              key={s}
              href={`/archives/${s}`}
              className="plank plank-bracket flex items-center justify-between gap-4 p-6 transition-colors hover:bg-brass/5"
            >
              <div>
                <div className="font-display text-2xl font-black text-bone">Saison {s}</div>
                <p className="mt-1 text-xs text-fog-deep">
                  {ratedCounts.get(s) ?? 0} classés · {matchCounts.get(s) ?? 0} matchs validés
                </p>
              </div>
              <span className="font-display text-xs uppercase tracking-widest text-brass">Consulter →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
