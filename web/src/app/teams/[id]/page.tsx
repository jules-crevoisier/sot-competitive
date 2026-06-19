import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { rankForMmr } from "@/lib/ranks";
import { PirateAvatar } from "@/components/pirate-avatar";
import { Flag } from "@/components/icons";
import { flag } from "@/lib/format";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  CAPTAIN: "Capitaine",
  OFFICER: "Officier",
  MEMBER: "Membre",
};

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await db.team.findUnique({
    where: { id },
    include: {
      captain: true,
      members: {
        include: { player: { include: { ratings: { where: { season: 1 } } } } },
      },
    },
  });
  if (!team) notFound();

  // membre le mieux classé (sur son meilleur MMR tous modes confondus)
  const memberStats = team.members.map((m) => {
    const best = m.player.ratings.reduce((acc, r) => Math.max(acc, r.mmr), 0);
    const wins = m.player.ratings.reduce((acc, r) => acc + r.wins, 0);
    const losses = m.player.ratings.reduce((acc, r) => acc + r.losses, 0);
    return { m, best, wins, losses };
  });
  const order = { CAPTAIN: 0, OFFICER: 1, MEMBER: 2 } as Record<string, number>;
  memberStats.sort((a, b) => (order[a.m.role] - order[b.m.role]) || b.best - a.best);

  const teamWins = memberStats.reduce((a, s) => a + s.wins, 0);
  const teamLosses = memberStats.reduce((a, s) => a + s.losses, 0);
  const avgMmr = memberStats.length
    ? Math.round(memberStats.reduce((a, s) => a + (s.best || 1500), 0) / memberStats.length)
    : 0;

  return (
    <div className="content-layer mx-auto max-w-4xl px-4 py-10">
      <Link href="/teams" className="font-display text-xs uppercase tracking-widest text-fog hover:text-brass">
        ← Tous les équipages
      </Link>

      <header className="plank plank-bracket relative mt-4 overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.07] text-brass">
          <Flag width={160} height={160} />
        </div>
        <div className="relative flex flex-wrap items-center gap-6">
          <PirateAvatar handle={team.tag} hue={team.accentHue} size={92} />
          <div className="flex-1">
            <span className="chip text-brass">[{team.tag}]</span>
            <h1 className="mt-2 font-display text-4xl font-black text-bone">{team.name}</h1>
            {team.blurb && <p className="mt-1 max-w-xl text-sm italic text-fog">« {team.blurb} »</p>}
            <p className="mt-2 text-xs text-fog-deep">Capitaine {team.captain.handle}</p>
          </div>
        </div>

        <div className="relative mt-6 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-sm border border-brass/20 bg-brass/10">
          {[
            { k: memberStats.length, l: "Membres" },
            { k: `${teamWins}/${teamLosses}`, l: "V / D cumulés" },
            { k: avgMmr, l: "MMR moyen" },
          ].map((s) => (
            <div key={s.l} className="bg-[#0b1b26] px-3 py-4 text-center">
              <div className="stat-num text-2xl font-bold text-brass">{s.k}</div>
              <div className="mt-1 font-display text-[0.55rem] uppercase tracking-widest text-fog">{s.l}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="plank mt-6 p-5">
        <p className="seal">Le rôle d&apos;équipage</p>
        <div className="mt-4 divide-y divide-brass/10">
          {memberStats.map(({ m, best, wins, losses }) => {
            const rank = rankForMmr(best || 1500);
            return (
              <Link
                key={m.id}
                href={`/players/${m.player.id}`}
                className="flex items-center gap-3 px-2 py-3 transition-colors hover:bg-brass/5"
              >
                <PirateAvatar handle={m.player.handle} hue={m.player.avatarHue} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-bone">
                    {flag(m.player.country)} {m.player.handle}
                  </div>
                  <div className="text-xs" style={{ color: rank.color }}>
                    {ROLE_LABEL[m.role] ?? m.role} · {rank.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="stat-num text-lg font-bold text-brass">{best || "—"}</div>
                  <div className="text-xs text-fog">{wins}V · {losses}D</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
