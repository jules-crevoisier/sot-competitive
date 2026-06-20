import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getMode } from "@/lib/modes";
import { ACCENT } from "@/lib/accent";
import { rankForMmr } from "@/lib/ranks";
import { PirateAvatar } from "@/components/pirate-avatar";
import { ModeGlyph, CompassRose } from "@/components/icons";
import { timeAgo, STATUS_LABEL, STATUS_COLOR, signed, flag } from "@/lib/format";
import { submitResult, validateMatch, disputeMatch, reportMatch } from "@/lib/actions";
import { getCurrentPlayer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await db.match.findUnique({
    where: { id },
    include: {
      players: { include: { player: true } },
      host: true,
      validatedBy: true,
    },
  });
  if (!match) notFound();

  const me = await getCurrentPlayer();
  const mode = getMode(match.mode);
  const a = mode ? ACCENT[mode.accent] : ACCENT.brass;
  const A = match.players.filter((p) => p.team === "A");
  const B = match.players.filter((p) => p.team === "B");
  const aWon = match.winner === "A";
  const validated = match.status === "VALIDATED";

  const isParticipant = me ? match.players.some((p) => p.playerId === me.id) : false;
  const isStaff = me?.role === "STAFF" || me?.role === "ADMIN";
  const canReport =
    (isParticipant || isStaff) &&
    (match.status === "AWAITING_PROOF" || match.status === "AWAITING_VALIDATION");

  return (
    <div className="content-layer mx-auto max-w-4xl px-4 py-10">
      <Link href="/matches" className="font-display text-xs uppercase tracking-widest text-fog hover:text-brass">
        ← Journal de bord
      </Link>

      {/* En-tête */}
      <header className="plank plank-bracket mt-4 p-6" style={{ borderColor: `${a.color}44` }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-brass" style={{ color: a.color }}>
              {mode && <ModeGlyph name={mode.icon} width={26} height={26} />}
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold text-bone">{mode?.name}</h1>
              <p className="text-xs text-fog">
                {mode?.format} · joué {timeAgo(match.playedAt)}
              </p>
            </div>
          </div>
          <span className="chip text-sm" style={{ color: STATUS_COLOR[match.status] }}>
            {STATUS_LABEL[match.status]}
          </span>
        </div>

        {/* Score */}
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamHeader label="Équipage A" won={aWon && validated} accent="brass" />
          <div className="stat-num text-center text-5xl font-black">
            <span className={aWon ? "text-brass" : "text-fog"}>{match.scoreA}</span>
            <span className="px-3 text-fog-deep">—</span>
            <span className={!aWon ? "text-brass" : "text-fog"}>{match.scoreB}</span>
          </div>
          <TeamHeader label="Équipage B" won={!aWon && validated} accent="verdigris" align="right" />
        </div>
      </header>

      {/* Lobby : en attente de preuve -> formulaire de report */}
      {match.status === "AWAITING_PROOF" && mode && (
        <section className="plank plank-bracket mt-6 p-6" style={{ borderColor: `${a.color}55` }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="seal" style={{ color: a.color }}>Lobby Custom Seas</p>
              <h2 className="mt-1 font-display text-xl font-bold text-bone">Session ouverte — à vous de jouer</h2>
            </div>
            <div className="text-center">
              <div className="font-display text-[0.6rem] uppercase tracking-widest text-fog">Join Code</div>
              <div className="stat-num rounded-sm border border-brass/40 bg-black/30 px-4 py-2 text-3xl font-black tracking-[0.3em] text-brass">
                {match.joinCode}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-fog">Réglages imposés (Preset {mode.preset})</p>
              <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {mode.switches.slice(0, 8).map((s) => (
                  <div key={s.label} className="flex justify-between gap-2 border-b border-dashed border-brass/15 py-1 text-xs">
                    <span className="text-fog">{s.label}</span>
                    <span className="font-mono text-parchment">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <form action={submitResult} className="rounded-sm border border-brass/20 bg-black/20 p-4">
              <input type="hidden" name="matchId" value={match.id} />
              <p className="font-display text-xs uppercase tracking-widest text-brass">Reporter le résultat</p>
              <div className="mt-3 flex items-center gap-3">
                <label className="flex-1 text-sm text-fog">
                  Score A
                  <input name="scoreA" type="number" min={0} defaultValue={0} required
                    className="mt-1 w-full rounded-sm border border-brass/30 bg-abyss px-3 py-2 stat-num text-lg text-bone outline-none focus:border-brass" />
                </label>
                <span className="mt-5 text-fog-deep">—</span>
                <label className="flex-1 text-sm text-fog">
                  Score B
                  <input name="scoreB" type="number" min={0} defaultValue={0} required
                    className="mt-1 w-full rounded-sm border border-brass/30 bg-abyss px-3 py-2 stat-num text-lg text-bone outline-none focus:border-brass" />
                </label>
              </div>
              <label className="mt-3 block text-sm text-fog">
                Lien de la capture du Scoreboard
                <input name="proofUrl" type="text" placeholder="https://…  (optionnel si capture jointe)"
                  className="mt-1 w-full rounded-sm border border-brass/30 bg-abyss px-3 py-2 text-sm text-parchment outline-none focus:border-brass" />
              </label>
              <label className="mt-3 block text-sm text-fog">
                Capture du Scoreboard (vérification auto)
                <input name="proofImage" type="file" accept="image/*"
                  className="mt-1 w-full text-xs text-fog file:mr-3 file:rounded-sm file:border file:border-brass/30 file:bg-brass/10 file:px-3 file:py-1.5 file:text-brass" />
                <span className="mt-1 block text-[0.7rem] text-fog-deep">
                  Si les deux scores sont lisibles, la preuve est confirmée automatiquement.
                </span>
              </label>
              <button type="submit" className="btn-brass mt-4 w-full justify-center">Soumettre pour validation</button>
            </form>
          </div>
        </section>
      )}

      {/* Contrôles staff : à valider / litige */}
      {(match.status === "AWAITING_VALIDATION" || match.status === "DISPUTED") && (
        <section className="plank mt-6 p-6" style={{ borderColor: "rgba(200,162,75,0.4)" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="seal">Espace staff</p>
              <h2 className="mt-1 font-display text-xl font-bold text-bone">
                {match.status === "DISPUTED" ? "Litige à trancher" : "Résultat à valider"}
              </h2>
              <p className="mt-1 text-sm text-fog">
                Vérifie la capture du Scoreboard puis valide — le MMR sera recalculé et le ladder mis à jour.
              </p>
              {match.proofVerified ? (
                <p className="mt-2 inline-flex items-center gap-2 rounded-sm border px-2 py-1 text-xs"
                  style={{ borderColor: "var(--color-verdigris)", color: "var(--color-verdigris)" }}>
                  ✓ Scores confirmés automatiquement sur la capture (OCR)
                </p>
              ) : (
                <p className="mt-2 inline-flex items-center gap-2 rounded-sm border px-2 py-1 text-xs"
                  style={{ borderColor: "rgba(200,162,75,0.4)", color: "var(--color-fog)" }}>
                  Capture non confirmée par OCR — contrôle visuel requis
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <form action={validateMatch}>
                <input type="hidden" name="matchId" value={match.id} />
                <button type="submit" className="btn-brass">✓ Valider &amp; appliquer le MMR</button>
              </form>
              {match.status !== "DISPUTED" && (
                <form action={disputeMatch}>
                  <input type="hidden" name="matchId" value={match.id} />
                  <input type="hidden" name="note" value="Mis en litige par le staff — capture à revérifier." />
                  <button type="submit" className="btn-ghost" style={{ borderColor: "var(--color-blood)", color: "var(--color-blood-bright)" }}>
                    ⚑ Ouvrir un litige
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Signaler un problème (participants) */}
      {canReport && (
        <details className="plank mt-6 p-5" style={{ borderColor: "rgba(176,42,42,0.35)" }}>
          <summary className="flex cursor-pointer items-center gap-2 font-display text-sm uppercase tracking-widest text-fog hover:text-blood-bright">
            <span className="text-blood-bright">⚑</span> Signaler un problème
          </summary>
          <p className="mt-3 text-sm text-fog">
            Mauvais Join Code, abandon, joueur absent, triche ou désaccord sur le score&nbsp;? Ouvre
            un litige&nbsp;: le match passe en arbitrage staff.
          </p>
          <form action={reportMatch} className="mt-4 grid gap-3 sm:max-w-lg">
            <input type="hidden" name="matchId" value={match.id} />
            <label className="text-sm text-fog">
              Motif
              <select
                name="reason"
                defaultValue="mauvais-code"
                className="mt-1 w-full rounded-sm border border-brass/30 bg-abyss px-3 py-2 text-sm text-parchment outline-none focus:border-brass"
              >
                <option value="mauvais-code">Join Code erroné / partie introuvable</option>
                <option value="abandon">Abandon / joueur parti en cours</option>
                <option value="absent">Joueur absent (no-show)</option>
                <option value="triche">Triche / item banni</option>
                <option value="conflit-score">Désaccord sur le score</option>
                <option value="autre">Autre problème</option>
              </select>
            </label>
            <label className="text-sm text-fog">
              Détail (optionnel)
              <textarea
                name="detail"
                rows={3}
                maxLength={500}
                placeholder="Décris ce qui s'est passé pour aider le staff à trancher…"
                className="mt-1 w-full rounded-sm border border-brass/30 bg-abyss px-3 py-2 text-sm text-parchment outline-none focus:border-brass"
              />
            </label>
            <button
              type="submit"
              className="btn-ghost justify-center"
              style={{ borderColor: "var(--color-blood)", color: "var(--color-blood-bright)" }}
            >
              ⚑ Envoyer le signalement
            </button>
          </form>
        </details>
      )}

      {/* Équipages */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <TeamCard players={A} won={aWon && validated} title="Équipage A" />
        <TeamCard players={B} won={!aWon && validated} title="Équipage B" />
      </div>

      {/* Détails + preuve */}
      <div className="mt-6 grid gap-5 sm:grid-cols-[2fr_1fr]">
        <div className="plank p-5">
          <p className="seal">Preuve</p>
          {match.proofUrl ? (
            <div className="mt-3 flex items-center gap-4 rounded-sm border border-brass/20 bg-black/30 p-4">
              <div className="grid h-16 w-24 place-items-center rounded-sm border border-brass/20 bg-abyss text-brass/40">
                <CompassRose width={32} height={32} />
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-display text-parchment">Capture du Scoreboard final</span>
                  {match.proofVerified && (
                    <span className="chip text-[0.65rem]"
                      style={{ color: "var(--color-verdigris)", borderColor: "var(--color-verdigris)" }}>
                      ✓ OCR
                    </span>
                  )}
                </div>
                <div className="text-xs text-fog">Soumise comme preuve du résultat.</div>
                <span className="mt-1 inline-block font-mono text-xs text-brass">{match.proofUrl}</span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-fog">Aucune preuve soumise pour l&apos;instant.</p>
          )}
          {match.notes && (
            <div className="mt-4 rounded-sm border border-blood/40 bg-blood/10 p-3 text-sm text-parchment">
              <span className="font-display text-xs uppercase tracking-widest text-blood-bright">Note de litige</span>
              <p className="mt-1">{match.notes}</p>
            </div>
          )}
        </div>

        <div className="plank p-5">
          <p className="seal">Fiche</p>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Join Code" v={match.joinCode ?? "—"} mono />
            <Row k="Host" v={match.host?.handle ?? "—"} />
            <Row k="Validé par" v={match.validatedBy?.handle ?? "—"} />
            <Row k="Saison" v={`${match.season}`} mono />
          </dl>
        </div>
      </div>
    </div>
  );
}

function TeamHeader({
  label,
  won,
  accent,
  align,
}: {
  label: string;
  won: boolean;
  accent: "brass" | "verdigris";
  align?: "right";
}) {
  const c = ACCENT[accent];
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="font-display text-xs uppercase tracking-widest" style={{ color: c.color }}>
        {label}
      </div>
      {won && (
        <div className="mt-1 inline-block rounded-sm border px-2 py-0.5 font-display text-[0.6rem] uppercase tracking-widest" style={{ borderColor: c.color, color: c.color }}>
          Vainqueur
        </div>
      )}
    </div>
  );
}

function TeamCard({
  players,
  won,
  title,
}: {
  players: { mmrBefore: number; mmrAfter: number; mmrDelta: number; player: { id: string; handle: string; avatarHue: number; country: string | null } }[];
  won: boolean;
  title: string;
}) {
  return (
    <div className="plank p-5" style={won ? { borderColor: "rgba(200,162,75,0.5)" } : undefined}>
      <div className="flex items-center justify-between">
        <span className="font-display text-sm uppercase tracking-widest text-fog">{title}</span>
        {won && <span className="chip text-brass">★ Vainqueur</span>}
      </div>
      <div className="mt-3 space-y-2">
        {players.map((p) => {
          const rank = rankForMmr(p.mmrAfter || 1500);
          return (
            <Link key={p.player.id} href={`/players/${p.player.id}`} className="flex items-center gap-3 rounded-sm px-2 py-1.5 transition-colors hover:bg-brass/5">
              <PirateAvatar handle={p.player.handle} hue={p.player.avatarHue} size={34} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-parchment">
                  {flag(p.player.country)} {p.player.handle}
                </div>
                <div className="text-xs" style={{ color: rank.color }}>{rank.name}</div>
              </div>
              {p.mmrDelta !== 0 && (
                <div className="text-right">
                  <div className={`stat-num text-sm font-bold ${p.mmrDelta > 0 ? "text-verdigris" : "text-blood-bright"}`}>
                    {signed(p.mmrDelta)}
                  </div>
                  <div className="stat-num text-[0.65rem] text-fog">{p.mmrAfter}</div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-fog">{k}</dt>
      <dd className={`text-right text-parchment ${mono ? "font-mono" : ""}`}>{v}</dd>
    </div>
  );
}
