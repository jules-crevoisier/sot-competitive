import Link from "next/link";
import { db } from "@/lib/db";
import { getMode } from "@/lib/modes";
import { PirateAvatar } from "@/components/pirate-avatar";
import { ShipWheel } from "@/components/icons";
import { validateMatch } from "@/lib/actions";
import { timeAgo, STATUS_LABEL, STATUS_COLOR } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Espace staff — Custom Seas Lounge" };

export default async function AdminPage() {
  const [queue, stats] = await Promise.all([
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
        Démo : l&apos;authentification Discord (rôles staff) se branchera ici. Tout staff connecté
        verra cette file et pourra valider en un clic — ou depuis le bot.
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
