import Link from "next/link";
import { db } from "@/lib/db";
import { MODES } from "@/lib/modes";
import { PirateAvatar } from "@/components/pirate-avatar";
import { timeAgo, STATUS_LABEL, STATUS_COLOR, signed } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Journal de bord — Custom Seas Lounge" };

export default async function MatchesPage() {
  const matches = await db.match.findMany({
    orderBy: [{ playedAt: "desc" }, { createdAt: "desc" }],
    take: 40,
    include: { players: { include: { player: true } } },
  });

  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-12">
      <header>
        <p className="seal">Journal de bord</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Tous les matchs</h1>
        <div className="rope-rule mt-3 w-24" />
      </header>

      <div className="mt-8 space-y-3">
        {matches.map((m) => {
          const mode = MODES.find((x) => x.key === m.mode);
          const A = m.players.filter((p) => p.team === "A");
          const B = m.players.filter((p) => p.team === "B");
          const aWon = m.winner === "A";
          const validated = m.status === "VALIDATED";
          return (
            <Link
              key={m.id}
              href={`/matches/${m.id}`}
              className="plank block px-4 py-4 transition-colors hover:bg-brass/5"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-xs uppercase tracking-widest text-brass">
                  {mode?.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="chip" style={{ color: STATUS_COLOR[m.status] }}>
                    {STATUS_LABEL[m.status]}
                  </span>
                  <span className="text-xs text-fog">{timeAgo(m.playedAt)}</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Crew players={A} won={aWon && validated} align="left" />
                <div className="shrink-0 text-center">
                  <div className="stat-num text-2xl font-bold">
                    <span className={aWon ? "text-brass" : "text-fog"}>{m.scoreA}</span>
                    <span className="px-2 text-fog-deep">—</span>
                    <span className={!aWon ? "text-brass" : "text-fog"}>{m.scoreB}</span>
                  </div>
                </div>
                <Crew players={B} won={!aWon && validated} align="right" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Crew({
  players,
  won,
  align,
}: {
  players: { mmrDelta: number; player: { handle: string; avatarHue: number } }[];
  won: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <div className="flex -space-x-2">
        {players.slice(0, 4).map((p, i) => (
          <PirateAvatar key={i} handle={p.player.handle} hue={p.player.avatarHue} size={30} />
        ))}
      </div>
      <div className="min-w-0">
        <div className={`truncate font-display text-sm ${won ? "text-brass" : "text-parchment"}`}>
          {players.map((p) => p.player.handle).join(", ")}
        </div>
        {players[0]?.mmrDelta !== 0 && (
          <div className={`stat-num text-xs ${players[0]?.mmrDelta > 0 ? "text-verdigris" : "text-blood-bright"}`}>
            {signed(players[0]?.mmrDelta ?? 0)} MMR
          </div>
        )}
      </div>
    </div>
  );
}
