import { db } from "@/lib/db";
import { getMode } from "@/lib/modes";
import { Chest } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Événements — Custom Seas Lounge" };

const STATUS: Record<string, { label: string; color: string }> = {
  UPCOMING: { label: "À venir", color: "var(--color-fog)" },
  OPEN: { label: "Inscriptions ouvertes", color: "var(--color-verdigris)" },
  LIVE: { label: "En direct", color: "var(--color-blood-bright)" },
  DONE: { label: "Terminé", color: "var(--color-fog-deep)" },
};

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function EventsPage() {
  const events = await db.event.findMany({ orderBy: { startsAt: "asc" } });
  const upcoming = events.filter((e) => e.status !== "DONE");
  const past = events.filter((e) => e.status === "DONE");

  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-12">
      <header>
        <p className="seal">Le calendrier de la flotte</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Événements</h1>
        <p className="mt-3 max-w-2xl text-fog">
          Tournois, soirées test et manches de ligue. Inscris ton crew, décroche des lots et grave
          ton nom au Hall of Fame de la saison.
        </p>
        <div className="rope-rule mt-4 w-24" />
      </header>

      <div className="mt-8 space-y-4">
        {upcoming.map((e) => {
          const st = STATUS[e.status] ?? STATUS.UPCOMING;
          const mode = e.mode ? getMode(e.mode) : undefined;
          return (
            <article key={e.id} className="plank plank-bracket p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-sm border border-brass/30 bg-brass/10 text-brass">
                  <Chest width={26} height={26} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl font-bold text-bone">{e.title}</h2>
                    <span className="chip" style={{ color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-fog">
                    {fmtDate(e.startsAt)}
                    {mode && <span className="text-brass"> · {mode.name}</span>}
                    {e.format && <span className="text-fog-deep"> · {e.format}</span>}
                  </p>
                  {e.description && <p className="mt-3 text-sm leading-relaxed text-fog">{e.description}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {e.prize && (
                      <span className="chip text-brass">🏆 {e.prize}</span>
                    )}
                    {e.capacity && <span className="chip text-fog">{e.capacity} places</span>}
                    {e.status === "OPEN" && (
                      <button className="btn-brass ml-auto">S&apos;inscrire</button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {past.length > 0 && (
        <section className="mt-12">
          <p className="seal">Dans le sillage</p>
          <div className="mt-4 space-y-2">
            {past.map((e) => {
              const mode = e.mode ? getMode(e.mode) : undefined;
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-sm border border-brass/15 px-4 py-3 opacity-70"
                >
                  <span className="font-display text-parchment">{e.title}</span>
                  <span className="text-xs text-fog">{mode?.name}</span>
                  <span className="ml-auto text-xs text-fog-deep">{fmtDate(e.startsAt)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
