import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getMode } from "@/lib/modes";
import { getCurrentPlayer } from "@/lib/session";
import { PirateAvatar } from "@/components/pirate-avatar";
import { ShipWheel } from "@/components/icons";
import { setLobbyCode, toggleReady, launchLobby, cancelLobby } from "@/lib/social-actions";
import { AutoRefresh } from "@/components/auto-refresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Salon — Custom Seas Lounge" };

const INPUT =
  "w-full rounded-sm border border-brass/25 bg-black/30 px-3 py-2 text-center font-mono text-2xl uppercase tracking-[0.4em] text-brass placeholder:text-fog-deep focus:border-brass focus:outline-none";

export default async function LobbyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getCurrentPlayer();

  const lobby = await db.lobby.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, handle: true, avatarHue: true } },
      members: {
        include: { player: { select: { id: true, handle: true, avatarHue: true } } },
        orderBy: { team: "asc" },
      },
    },
  });
  if (!lobby) notFound();

  const mode = getMode(lobby.mode);
  const meId = me?.id ?? "";
  const isHost = lobby.hostId === meId;
  const myMember = lobby.members.find((m) => m.playerId === meId);
  const teamA = lobby.members.filter((m) => m.team === "A");
  const teamB = lobby.members.filter((m) => m.team === "B");
  const allReady = lobby.members.every((m) => m.ready);
  const readyCount = lobby.members.filter((m) => m.ready).length;

  if (lobby.status === "LAUNCHED" && lobby.matchId) {
    return (
      <div className="content-layer mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="plank p-8">
          <h1 className="font-display text-3xl font-black text-bone">Match lancé</h1>
          <p className="mt-3 text-fog">Ce salon a déjà débouché sur un match.</p>
          <Link href={`/matches/${lobby.matchId}`} className="btn-brass mt-6">
            Voir le match
          </Link>
        </div>
      </div>
    );
  }

  if (lobby.status === "CANCELLED") {
    return (
      <div className="content-layer mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="plank p-8">
          <h1 className="font-display text-3xl font-black text-bone">Salon annulé</h1>
          <Link href="/play" className="btn-brass mt-6">Retour à la file</Link>
        </div>
      </div>
    );
  }

  const Roster = ({ title, members, color }: { title: string; members: typeof teamA; color: string }) => (
    <div className="plank p-5">
      <p className="seal" style={{ color }}>{title}</p>
      <ul className="mt-3 space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 rounded-sm border border-brass/15 bg-black/15 px-3 py-2">
            <PirateAvatar handle={m.player.handle} hue={m.player.avatarHue} size={32} />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm text-parchment">
                {m.player.handle}
                {m.playerId === meId && <span className="text-fog-deep"> (toi)</span>}
              </span>
              <span className="block font-mono text-[0.6rem] text-fog-deep">
                {m.playerId === lobby.hostId ? "Hôte" : m.isBot ? "Recrue file" : "Joueur"}
              </span>
            </div>
            <span
              className="chip"
              style={{ color: m.ready ? "var(--color-verdigris)" : "var(--color-fog-deep)" }}
            >
              {m.ready ? "Prêt" : "En attente"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-12">
      {/* Reflète en douceur l'arrivée / l'état des autres pirates */}
      <AutoRefresh seconds={4} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="seal">Salon de match</p>
          <h1 className="mt-2 font-display text-4xl font-black text-bone">
            {mode?.name ?? lobby.mode}
          </h1>
          <p className="mt-2 text-fog">
            {mode?.format} · {readyCount}/{lobby.members.length} prêts
          </p>
        </div>
        <div className="flex items-center gap-2 text-brass">
          <ShipWheel width={30} height={30} />
          <span className="font-display text-sm">Hôte&nbsp;: {lobby.host.handle}</span>
        </div>
      </header>
      <div className="rope-rule mt-4 w-24" />

      {/* Code Custom Seas */}
      <div className="mt-8 plank plank-bracket p-6 text-center">
        {lobby.joinCode ? (
          <>
            <p className="seal">Join Code Custom Seas</p>
            <p className="stat-num mt-3 text-5xl font-black tracking-[0.4em] text-brass">
              {lobby.joinCode}
            </p>
            <p className="mt-3 text-sm text-fog">
              {isHost
                ? "Tu as ouvert la partie dans Sea of Thieves. Les autres rejoignent avec ce code."
                : "Rejoins cette partie dans Sea of Thieves avec ce code, puis marque-toi prêt."}
            </p>
          </>
        ) : isHost ? (
          <>
            <p className="seal">À toi de jouer, hôte</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-fog">
              Lance une partie <span className="text-parchment">Custom Seas</span> dans Sea of
              Thieves, récupère le Join Code à 5 caractères et saisis-le ici pour le partager à
              l&apos;équipage.
            </p>
            <form action={setLobbyCode} className="mx-auto mt-4 flex max-w-sm flex-col gap-3">
              <input type="hidden" name="lobbyId" value={lobby.id} />
              <input name="code" required maxLength={5} minLength={5} className={INPUT} placeholder="ABC23" />
              <button type="submit" className="btn-brass justify-center">Publier le code</button>
            </form>
          </>
        ) : (
          <>
            <p className="seal">En attente de l&apos;hôte</p>
            <p className="mt-3 text-sm text-fog">
              {lobby.host.handle} prépare la partie Custom Seas. Le Join Code apparaîtra ici dès
              qu&apos;il sera publié.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 font-mono text-sm text-brass">
              <span className="h-2 w-2 animate-ping rounded-full bg-brass" />
              en attente du code…
            </div>
          </>
        )}
      </div>

      {/* Équipages */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Roster title="Équipage A" members={teamA} color="var(--color-brass)" />
        <Roster title="Équipage B" members={teamB} color="var(--color-verdigris)" />
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          {myMember && lobby.joinCode && (
            <form action={toggleReady}>
              <input type="hidden" name="lobbyId" value={lobby.id} />
              <button className={myMember.ready ? "btn-ghost" : "btn-brass"}>
                {myMember.ready ? "Annuler prêt" : "Je suis prêt"}
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isHost && (
            <form action={cancelLobby}>
              <input type="hidden" name="lobbyId" value={lobby.id} />
              <button className="font-display text-xs uppercase tracking-widest text-fog hover:text-blood-bright">
                Annuler le salon
              </button>
            </form>
          )}
          {isHost && (
            <form action={launchLobby}>
              <input type="hidden" name="lobbyId" value={lobby.id} />
              <button
                type="submit"
                disabled={!lobby.joinCode}
                className="btn-brass text-base disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShipWheel width={18} height={18} />
                Lancer le match
              </button>
            </form>
          )}
        </div>
      </div>
      {isHost && lobby.joinCode && !allReady && (
        <p className="mt-3 text-right text-xs text-fog-deep">
          Tu peux lancer dès que tu veux — les pirates non prêts seront tout de même inscrits.
        </p>
      )}
    </div>
  );
}
