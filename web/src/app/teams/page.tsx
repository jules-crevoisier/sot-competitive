import Link from "next/link";
import { db } from "@/lib/db";
import { createTeam } from "@/lib/community-actions";
import { getCurrentPlayer } from "@/lib/session";
import { getActiveSeason } from "@/lib/season";
import { teamStandings } from "@/lib/standings";
import { rankForMmr } from "@/lib/ranks";
import { PirateAvatar } from "@/components/pirate-avatar";
import { Flag } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Équipages — Custom Seas Lounge" };

export default async function TeamsPage() {
  const me = await getCurrentPlayer();
  const season = await getActiveSeason();
  const [standings, myMembership] = await Promise.all([
    teamStandings(season),
    me ? db.teamMember.findUnique({ where: { playerId: me.id }, include: { team: true } }) : null,
  ]);

  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="seal">Bannières &amp; équipages</p>
          <h1 className="mt-2 font-display text-4xl font-black text-bone">Classement des équipages</h1>
          <p className="mt-3 max-w-2xl text-fog">
            Le ladder des crews — saison&nbsp;{season}. Le MMR d&apos;équipe est la moyenne des
            meilleurs MMR de ses membres.
          </p>
          <div className="rope-rule mt-4 w-24" />
        </div>
        <Link href="/archives" className="font-display text-xs uppercase tracking-widest text-fog hover:text-brass">
          Saisons passées →
        </Link>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Ladder */}
        <div className="space-y-3">
          {standings.length === 0 && (
            <p className="plank p-6 text-sm text-fog">Aucun équipage pour l&apos;instant. Hisse la première bannière !</p>
          )}
          {standings.map((t, i) => {
            const rank = t.mmr !== null ? rankForMmr(t.mmr) : null;
            return (
              <Link
                key={t.id}
                href={`/teams/${t.id}`}
                className="plank plank-bracket flex items-center gap-4 p-4 transition-colors hover:bg-brass/5"
              >
                <span className="stat-num w-6 shrink-0 text-center text-lg font-bold text-fog">
                  {t.mmr !== null ? i + 1 : "—"}
                </span>
                <PirateAvatar handle={t.tag} hue={t.accentHue} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="chip text-brass">[{t.tag}]</span>
                    <h2 className="truncate font-display text-lg font-bold text-bone">{t.name}</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-fog-deep">
                    {t.memberCount} membre{t.memberCount > 1 ? "s" : ""} · {t.wins}V / {t.losses}D
                  </p>
                </div>
                <div className="hidden -space-x-2 sm:flex">
                  {t.members.slice(0, 4).map((m) => (
                    <PirateAvatar key={m.id} handle={m.handle} hue={m.avatarHue} size={26} />
                  ))}
                </div>
                <div className="w-16 shrink-0 text-right">
                  {t.mmr !== null ? (
                    <>
                      <div className="stat-num text-xl font-bold" style={{ color: rank!.color }}>{t.mmr}</div>
                      <div className="font-display text-[0.55rem] uppercase tracking-widest text-fog">{rank!.short}</div>
                    </>
                  ) : (
                    <div className="font-display text-[0.6rem] uppercase tracking-widest text-fog-deep">Non classé</div>
                  )}
                </div>
              </Link>
            );
          })}
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
