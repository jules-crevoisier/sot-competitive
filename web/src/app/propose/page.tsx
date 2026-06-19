import { db } from "@/lib/db";
import { proposeMode, voteProposal } from "@/lib/community-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Proposer un mode — Custom Seas Lounge" };

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "var(--color-fog)" },
  TESTING: { label: "En test", color: "var(--color-brass)" },
  ACCEPTED: { label: "Adopté", color: "var(--color-verdigris)" },
  REJECTED: { label: "Écarté", color: "var(--color-blood-bright)" },
};

export default async function ProposePage() {
  const proposals = await db.modeProposal.findMany({
    orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-12">
      <header>
        <p className="seal">La table des cartes</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Proposer un mode</h1>
        <p className="mt-3 max-w-2xl text-fog">
          Une idée de format à tester&nbsp;? Soumets-la ici. La communauté vote, le staff retient les
          plus populaires pour une soirée test, puis les ajuste avant de les ajouter aux ladders.
        </p>
        <div className="rope-rule mt-4 w-24" />
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Formulaire */}
        <div className="plank h-fit p-6">
          <p className="seal">Nouvelle proposition</p>
          <form action={proposeMode} className="mt-4 space-y-3">
            <Field label="Nom du mode">
              <input name="name" required maxLength={50} className={INPUT} placeholder="Capture du Fort" />
            </Field>
            <Field label="Format (optionnel)">
              <input name="format" maxLength={60} className={INPUT} placeholder="4v4 · contrôle de zone" />
            </Field>
            <Field label="Description / argumentaire">
              <textarea name="pitch" required rows={4} maxLength={400} className={INPUT} placeholder="Explique les règles, la condition de victoire et pourquoi ce serait fun…" />
            </Field>
            <Field label="Ton pseudo (optionnel)">
              <input name="proposerHandle" maxLength={30} className={INPUT} placeholder="Mistral" />
            </Field>
            <button type="submit" className="btn-brass w-full justify-center">
              Envoyer la proposition
            </button>
          </form>
        </div>

        {/* Liste */}
        <div className="space-y-4">
          {proposals.length === 0 && (
            <p className="plank p-6 text-sm text-fog">Aucune proposition pour l&apos;instant — sois le premier !</p>
          )}
          {proposals.map((p) => {
            const st = STATUS[p.status] ?? STATUS.PENDING;
            return (
              <article key={p.id} className="plank flex gap-4 p-5">
                <form action={voteProposal} className="flex flex-col items-center">
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    className="grid h-9 w-9 place-items-center rounded-sm border border-brass/30 text-brass transition-colors hover:bg-brass/10"
                    title="Voter pour ce mode"
                  >
                    ▲
                  </button>
                  <span className="stat-num mt-1 text-lg font-bold text-brass">{p.votes}</span>
                </form>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-bone">{p.name}</h2>
                    <span className="chip" style={{ color: st.color }}>{st.label}</span>
                    {p.format && <span className="text-xs text-fog-deep">{p.format}</span>}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{p.pitch}</p>
                  {p.proposerHandle && (
                    <p className="mt-2 text-xs text-fog-deep">proposé par {p.proposerHandle}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const INPUT =
  "w-full rounded-sm border border-brass/25 bg-black/30 px-3 py-2 text-sm text-parchment placeholder:text-fog-deep focus:border-brass focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-[0.65rem] uppercase tracking-widest text-fog">{label}</span>
      {children}
    </label>
  );
}
