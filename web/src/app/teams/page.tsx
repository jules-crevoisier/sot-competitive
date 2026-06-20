import Link from "next/link";
import { db } from "@/lib/db";
import { createTeam } from "@/lib/community-actions";
import { getCurrentPlayer } from "@/lib/session";
import { PirateAvatar } from "@/components/pirate-avatar";
import { Flag } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Équipages — Custom Seas Lounge" };

export default async function TeamsPage() {
  const me = await getCurrentPlayer();
  const [teams, myMembership] = await Promise.all([
    db.team.findMany({
      orderBy: { createdAt: "asc" },
      include: { captain: true, members: { include: { player: true } } },
    }),
    // suis-je déjà engagé dans un équipage ?
    me ? db.teamMember.findUnique({ where: { playerId: me.id }, include: { team: true } }) : null,
  ]);

  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-12">
      <header>
        <p className="seal">Bannières &amp; équipages</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Les équipages</h1>
        <p className="mt-3 max-w-2xl text-fog">
          Réunis ton crew sous une même bannière : nom, tag, capitaine et page dédiée. Le classement
          par équipe arrive avec la saison&nbsp;1.
        </p>
        <div className="rope-rule mt-4 w-24" />
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Liste */}
        <div className="space-y-4">
          {teams.length === 0 && (
            <p className="plank p-6 text-sm text-fog">Aucun équipage pour l&apos;instant. Hisse la première bannière !</p>
          )}
          {teams.map((t) => (
            <Link
              key={t.id}
              href={`/teams/${t.id}`}
              className="plank plank-bracket flex items-center gap-4 p-5 transition-colors hover:bg-brass/5"
            >
              <PirateAvatar handle={t.tag} hue={t.accentHue} size={56} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="chip text-brass">[{t.tag}]</span>
                  <h2 className="truncate font-display text-xl font-bold text-bone">{t.name}</h2>
                </div>
                {t.blurb && <p className="mt-1 truncate text-sm text-fog">{t.blurb}</p>}
                <p className="mt-1 text-xs text-fog-deep">
                  Capitaine {t.captain.handle} · {t.members.length} membre{t.members.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex -space-x-2">
                {t.members.slice(0, 4).map((m) => (
                  <PirateAvatar key={m.id} handle={m.player.handle} hue={m.player.avatarHue} size={30} />
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* Création */}
        <div className="plank h-fit p-6">
          <div className="flex items-center gap-2 text-brass">
            <Flag width={20} height={20} />
            <p className="seal">Hisser une bannière</p>
          </div>
          {myMembership ? (
            <div className="mt-4 space-y-3 text-sm text-fog">
              <p>
                Tu fais déjà partie de l&apos;équipage{" "}
                <Link href={`/teams/${myMembership.teamId}`} className="text-brass hover:underline">
                  [{myMembership.team.tag}] {myMembership.team.name}
                </Link>
                .
              </p>
              <p className="text-xs text-fog-deep">
                Un pirate ne peut appartenir qu&apos;à un seul équipage à la fois. Quitte-le depuis sa
                page pour en fonder un nouveau.
              </p>
            </div>
          ) : (
            <form action={createTeam} className="mt-4 space-y-3">
              <Field label="Nom de l'équipage">
                <input name="name" required maxLength={40} className={INPUT} placeholder="Les Écumeurs" />
              </Field>
              <Field label="Tag (2 à 5 lettres)">
                <input name="tag" required maxLength={5} className={INPUT} placeholder="ECU" />
              </Field>
              <Field label="Devise (optionnel)">
                <input name="blurb" maxLength={80} className={INPUT} placeholder="On prend la mer, on prend les têtes." />
              </Field>
              <button type="submit" className="btn-brass w-full justify-center">
                Fonder l&apos;équipage
              </button>
              <p className="text-xs text-fog-deep">
                Tu en deviendras le capitaine et pourras recruter depuis la page de l&apos;équipage.
              </p>
            </form>
          )}
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
