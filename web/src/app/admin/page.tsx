import Link from "next/link";
import { db } from "@/lib/db";
import { getMode } from "@/lib/modes";
import { PirateAvatar } from "@/components/pirate-avatar";
import { ShipWheel } from "@/components/icons";
import { validateMatch } from "@/lib/actions";
import { resetSeasonMmr, startNewSeason } from "@/lib/admin-actions";
import { getCurrentPlayer } from "@/lib/session";
import { getActiveSeason } from "@/lib/season";
import { timeAgo, STATUS_LABEL, STATUS_COLOR } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Espace staff — Custom Seas Lounge" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string; n?: string }>;
}) {
  const { ok, err, n } = await searchParams;
  const me = await getCurrentPlayer();
  const isAdmin = me?.role === "ADMIN";
  const season = await getActiveSeason();
  const [queue, stats, ratedThisSeason] = await Promise.all([
    db.match.findMany({
      where: { status: { in: ["AWAITING_VALIDATION", "DISPUTED", "AWAITING_PROOF"] } },
      orderBy: { createdAt: "desc" },
      include: { players: { include: { player: true } }, host: true },
    }),
    Promise.all([
      db.match.count({ where: { status: "AWAITING_VALIDATION" } }),
      db.match.count({ where: { status: "DISPUTED" } }),
      db.match.count({ where: { status: "VALIDATED" } }),
    ]),
    db.rating.count({ where: { season } }),
  ]);
  const [toValidate, disputed, validated] = stats;

  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="seal">Tribunal des mers</p>
          <h1 className="mt-2 font-display text-4xl font-black text-bone">Espace staff</h1>
          <p className="mt-2 text-fog">Valide les résultats, tranche les litiges, garde le ladder honnête.</p>
        </div>
        <div className="flex gap-3">
          <Stat n={toValidate} l="À valider" color="var(--color-brass)" />
          <Stat n={disputed} l="Litiges" color="var(--color-blood-bright)" />
          <Stat n={validated} l="Validés" color="var(--color-verdigris)" />
        </div>
      </header>

      <div className="rope-rule mt-6 w-full" />

      {/* Bandeaux de retour d'action */}
      {ok && (
        <p
          className="mt-6 rounded-sm border px-4 py-2 text-sm"
          style={{ borderColor: "var(--color-verdigris)", color: "var(--color-verdigris)" }}
        >
          {ok === "reset"
            ? "MMR de la saison réinitialisés."
            : ok === "season"
              ? `Nouvelle saison démarrée — saison ${n}. Bon vent !`
              : "Action effectuée."}
        </p>
      )}
      {err === "confirm" && (
        <p
          className="mt-6 rounded-sm border px-4 py-2 text-sm"
          style={{ borderColor: "var(--color-blood)", color: "var(--color-blood-bright)" }}
        >
          Confirmation incorrecte — l&apos;action a été annulée.
        </p>
      )}

      {/* Saison & classements (ADMIN) */}
      <section className="plank mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="seal">Saison &amp; classements</p>
            <h2 className="mt-1 font-display text-xl font-bold text-bone">
              Saison {season} en cours
            </h2>
            <p className="mt-1 text-sm text-fog">
              {ratedThisSeason} classement{ratedThisSeason > 1 ? "s" : ""} actif
              {ratedThisSeason > 1 ? "s" : ""} cette saison.
            </p>
          </div>
        </div>

        {isAdmin ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {/* Reset MMR */}
            <form action={resetSeasonMmr} className="rounded-sm border border-brass/20 bg-black/20 p-4">
              <p className="font-display text-xs uppercase tracking-widest text-brass">
                Réinitialiser les MMR
              </p>
              <p className="mt-2 text-xs text-fog">
                Tout le monde repart à 1500 (compteurs et placements remis à zéro). L&apos;historique
                des matchs est conservé. Tape <span className="font-mono text-parchment">RESET</span> pour confirmer.
              </p>
              <input type="hidden" name="season" value={season} />
              <input
                name="confirm"
                placeholder="RESET"
                autoComplete="off"
                className="mt-3 w-full rounded-sm border border-brass/30 bg-abyss px-3 py-2 text-sm text-parchment outline-none focus:border-brass"
              />
              <button
                type="submit"
                className="mt-3 w-full rounded-sm border border-blood/40 px-3 py-2 font-display text-xs uppercase tracking-widest text-blood-bright transition-colors hover:bg-blood/10"
              >
                Réinitialiser la saison {season}
              </button>
            </form>

            {/* Nouvelle saison */}
            <form action={startNewSeason} className="rounded-sm border border-brass/20 bg-black/20 p-4">
              <p className="font-display text-xs uppercase tracking-widest text-brass">
                Clôturer &amp; nouvelle saison
              </p>
              <p className="mt-2 text-xs text-fog">
                Archive la saison {season} (classements conservés en base) et démarre la saison{" "}
                {season + 1}, vierge. Tape <span className="font-mono text-parchment">NOUVELLE</span> pour confirmer.
              </p>
              <input
                name="confirm"
                placeholder="NOUVELLE"
                autoComplete="off"
                className="mt-3 w-full rounded-sm border border-brass/30 bg-abyss px-3 py-2 text-sm text-parchment outline-none focus:border-brass"
              />
              <button type="submit" className="btn-brass mt-3 w-full justify-center">
                Démarrer la saison {season + 1}
              </button>
            </form>
          </div>
        ) : (
          <p className="mt-4 rounded-sm border border-brass/15 bg-black/20 px-4 py-3 text-sm text-fog">
            La gestion des saisons (reset MMR, nouvelle saison) est réservée aux administrateurs.
          </p>
        )}
      </section>

      <div className="mt-8 space-y-3">
        {queue.length === 0 && (
          <div className="plank px-4 py-16 text-center text-fog">
            <ShipWheel className="mx-auto text-brass/40" width={48} height={48} />
            <p className="mt-3">Rien à arbitrer. La mer est calme, capitaine.</p>
          </div>
        )}

        {queue.map((m) => {
          const mode = getMode(m.mode);
          const A = m.players.filter((p) => p.team === "A");
          const B = m.players.filter((p) => p.team === "B");
          const canValidate = m.status === "AWAITING_VALIDATION" || m.status === "DISPUTED";
          return (
            <div key={m.id} className="plank p-4" style={m.status === "DISPUTED" ? { borderColor: "rgba(163,47,40,0.5)" } : undefined}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm uppercase tracking-widest text-brass">{mode?.name}</span>
                  <span className="chip" style={{ color: STATUS_COLOR[m.status] }}>{STATUS_LABEL[m.status]}</span>
                  <span className="text-xs text-fog">{timeAgo(m.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/matches/${m.id}`} className="font-display text-xs uppercase tracking-widest text-fog hover:text-brass">
                    Détails →
                  </Link>
                  {canValidate ? (
                    <form action={validateMatch}>
                      <input type="hidden" name="matchId" value={m.id} />
                      <button type="submit" className="btn-brass" style={{ padding: "0.4rem 0.9rem", fontSize: "0.72rem" }}>
                        ✓ Valider
                      </button>
                    </form>
                  ) : (
                    <span className="font-mono text-xs text-fog">en attente de preuve</span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Side players={A} />
                <div className="stat-num text-center text-xl font-bold text-parchment">
                  {m.scoreA}<span className="px-1 text-fog-deep">—</span>{m.scoreB}
                </div>
                <Side players={B} right />
              </div>

              {m.notes && (
                <p className="mt-3 rounded-sm border border-blood/40 bg-blood/10 px-3 py-2 text-xs text-parchment">
                  ⚑ {m.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center font-mono text-xs text-fog-deep">
        Tout staff connecté (rôle STAFF/ADMIN) valide ici en un clic — ou depuis le bot. La gestion
        des saisons est réservée aux ADMIN.
      </p>
    </div>
  );
}

function Stat({ n, l, color }: { n: number; l: string; color: string }) {
  return (
    <div className="plank px-4 py-2 text-center">
      <div className="stat-num text-2xl font-bold" style={{ color }}>{n}</div>
      <div className="font-display text-[0.55rem] uppercase tracking-widest text-fog">{l}</div>
    </div>
  );
}

function Side({ players, right }: { players: { player: { handle: string; avatarHue: number } }[]; right?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${right ? "flex-row-reverse" : ""}`}>
      <div className="flex -space-x-2">
        {players.map((p, i) => (
          <PirateAvatar key={i} handle={p.player.handle} hue={p.player.avatarHue} size={26} />
        ))}
      </div>
      <span className="truncate text-sm text-parchment">{players.map((p) => p.player.handle).join(", ")}</span>
    </div>
  );
}
