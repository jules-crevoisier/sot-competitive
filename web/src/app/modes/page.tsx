import Link from "next/link";
import { MODES } from "@/lib/modes";
import { ACCENT } from "@/lib/accent";
import { ModeGlyph, WaveDivider } from "@/components/icons";

export const metadata = { title: "Modes & réglages — Custom Seas Lounge" };

export default function ModesPage() {
  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-12">
      <header className="text-center">
        <p className="seal">Le règlement de la flotte</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Modes &amp; réglages imposés</h1>
        <p className="mx-auto mt-4 max-w-2xl text-fog">
          Custom Seas fige les <em>Switches</em> au lancement de la session : on standardise donc
          <strong className="text-parchment"> avant</strong> le coup d&apos;envoi. Chaque Host
          reproduit exactement les réglages ci-dessous, sinon le match est rejeu ou annulé.
        </p>
        <div className="mx-auto mt-5 w-40 text-verdigris">
          <WaveDivider className="h-4 w-full" />
        </div>
      </header>

      {/* Sommaire */}
      <nav className="mt-10 flex flex-wrap justify-center gap-2">
        {MODES.map((m) => {
          const a = ACCENT[m.accent];
          return (
            <a
              key={m.key}
              href={`#${m.key}`}
              className="flex items-center gap-2 rounded-sm border px-3 py-2 font-display text-xs uppercase tracking-widest"
              style={{ borderColor: `${a.color}55`, color: a.color }}
            >
              <ModeGlyph name={m.icon} width={15} height={15} /> {m.name}
            </a>
          );
        })}
      </nav>

      <div className="mt-12 space-y-14">
        {MODES.map((mode) => {
          const a = ACCENT[mode.accent];
          return (
            <section key={mode.key} id={mode.key} className="scroll-mt-24">
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className="grid h-14 w-14 place-items-center rounded-sm border"
                  style={{ borderColor: `${a.color}66`, background: a.soft, color: a.color }}
                >
                  <ModeGlyph name={mode.icon} width={32} height={32} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-2xl font-bold text-bone">{mode.name}</h2>
                    <span className="chip" style={{ color: mode.tier === "principal" ? a.color : "var(--color-fog)" }}>
                      {mode.tier === "principal" ? "PRINCIPAL" : "SECONDAIRE"}
                    </span>
                  </div>
                  <p className="font-display text-xs uppercase tracking-widest" style={{ color: a.color }}>
                    {mode.tagline} · {mode.ship} · {mode.format}
                  </p>
                </div>
                <Link href={`/ladder/${mode.key}`} className="btn-ghost">Classement →</Link>
              </div>

              <p className="mt-3 text-fog">{mode.summary}</p>

              {/* Carte preset */}
              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_2fr]">
                <div className="plank p-5">
                  <p className="seal">Préparation</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <Row k="Preset de départ" v={mode.preset} />
                    <Row k="Méthode de score" v={mode.scoringMethod} />
                    <Row k="Joueurs / équipage" v={`${mode.teamSize}`} />
                    <Row k="Format" v={mode.format} />
                  </dl>
                </div>

                {/* Parchemin des switches */}
                <div className="parchment p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-xs uppercase tracking-[0.3em]" style={{ color: "#6e521f" }}>
                      Switches à imposer
                    </p>
                    <span className="font-display text-xs" style={{ color: "#6e521f" }}>
                      Lobby Custom Seas
                    </span>
                  </div>
                  <div className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    {mode.switches.map((s) => (
                      <div
                        key={s.label}
                        className="flex items-baseline justify-between gap-2 border-b border-dashed py-1.5"
                        style={{ borderColor: "rgba(110,82,31,0.3)" }}
                      >
                        <span className="text-sm" style={{ color: "#3a2c12" }}>{s.label}</span>
                        <span
                          className="font-mono text-xs font-bold"
                          style={{
                            color:
                              s.emphasis === "good"
                                ? "#1f6157"
                                : s.emphasis === "bad"
                                ? "#8a2018"
                                : "#5a4319",
                          }}
                        >
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Validation */}
      <section className="mt-16 plank plank-bracket p-6">
        <p className="seal">Hors-jeu = validation obligatoire</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-bone">Comment un résultat compte</h2>
        <ol className="mt-4 space-y-3 text-sm text-fog">
          {[
            "Le Host crée la session avec le bon preset et publie le Join Code à 5 caractères sur la page du match.",
            "Les joueurs rejoignent et vérifient que les Switches affichés dans le Lobby correspondent au règlement.",
            "À la fin, on capture le Scoreboard final (preuve obligatoire) et on soumet le résultat.",
            "Les deux camps confirment, ou un arbitre/staff tranche. Un litige passe en file de validation.",
            "Une fois validé, le MMR est recalculé et le ladder bouge.",
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-display font-bold text-brass">{i + 1}.</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-fog">{k}</dt>
      <dd className="text-right font-mono text-parchment">{v}</dd>
    </div>
  );
}
