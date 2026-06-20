import Link from "next/link";
import { db } from "@/lib/db";
import { MODES } from "@/lib/modes";
import { QueueBoard } from "@/components/queue-board";
import { PirateAvatar } from "@/components/pirate-avatar";
import { getCurrentPlayer } from "@/lib/session";
import { createParty, leaveParty, kickFromParty, addToParty } from "@/lib/social-actions";
import { DiscordMark } from "@/components/icons";
import { getActiveSeason } from "@/lib/season";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jouer — Custom Seas Lounge" };

export default async function PlayPage() {
  const season = await getActiveSeason();
  const grouped = await db.rating.groupBy({ by: ["mode"], where: { season }, _count: true });
  const counts = Object.fromEntries(grouped.map((g) => [g.mode, g._count]));

  const me = await getCurrentPlayer();

  // groupe courant (si membre)
  const membership = me
    ? await db.partyMember.findUnique({
        where: { playerId: me.id },
        include: {
          party: {
            include: {
              members: {
                include: { player: { select: { id: true, handle: true, avatarHue: true } } },
                orderBy: { joinedAt: "asc" },
              },
            },
          },
        },
      })
    : null;
  const party = membership?.party ?? null;
  const isLeader = party && me ? party.leaderId === me.id : false;

  // amis acceptés que je peux ajouter (si je suis chef)
  let addableFriends: { id: string; handle: string; avatarHue: number }[] = [];
  if (me && party && isLeader) {
    const links = await db.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: me.id }, { addresseeId: me.id }],
      },
      include: {
        requester: { select: { id: true, handle: true, avatarHue: true } },
        addressee: { select: { id: true, handle: true, avatarHue: true } },
      },
    });
    const inParty = new Set(party.members.map((m) => m.playerId));
    const candidates = links.map((l) => (l.requesterId === me.id ? l.addressee : l.requester));
    // exclure ceux déjà dans un groupe
    const busy = await db.partyMember.findMany({
      where: { playerId: { in: candidates.map((c) => c.id) } },
      select: { playerId: true },
    });
    const busyIds = new Set(busy.map((b) => b.playerId));
    addableFriends = candidates.filter((c) => !inParty.has(c.id) && !busyIds.has(c.id));
  }

  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-12">
      <header>
        <p className="seal">Lever l&apos;ancre</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Rejoindre une file</h1>
        <p className="mt-3 max-w-2xl text-fog">
          Monte un groupe avec tes amis, choisis un mode et entre dans la file. Dès qu&apos;il y a
          assez de pirates, un salon se forme&nbsp;: un hôte est désigné, il crée la partie Custom
          Seas, saisit le Join Code, le partage à tout le monde et lance le match.
        </p>
        <div className="rope-rule mt-4 w-24" />
      </header>

      {/* Groupe */}
      <div className="mt-8 plank p-5">
        <div className="flex items-center justify-between">
          <p className="seal">Ton groupe</p>
          {party ? (
            <form action={leaveParty}>
              <button className="font-display text-xs uppercase tracking-widest text-fog hover:text-blood-bright">
                {isLeader ? "Dissoudre / quitter" : "Quitter le groupe"}
              </button>
            </form>
          ) : (
            <form action={createParty}>
              <button className="btn-ghost !px-3 !py-1.5 text-xs">Créer un groupe</button>
            </form>
          )}
        </div>

        {!party ? (
          <p className="mt-3 text-sm text-fog">
            Tu n&apos;es dans aucun groupe — tu feras la file en solo. Crée un groupe pour inviter
            des amis et entrer en file ensemble.
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-3">
              {party.members.map((m) => {
                const lead = m.playerId === party.leaderId;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 rounded-sm border border-brass/20 bg-black/20 px-3 py-2"
                  >
                    <PirateAvatar handle={m.player.handle} hue={m.player.avatarHue} size={30} />
                    <div className="leading-tight">
                      <span className="block text-sm text-parchment">{m.player.handle}</span>
                      <span className="block font-mono text-[0.6rem] text-fog-deep">
                        {lead ? "Chef de groupe" : "Membre"}
                      </span>
                    </div>
                    {isLeader && !lead && (
                      <form action={kickFromParty}>
                        <input type="hidden" name="playerId" value={m.playerId} />
                        <button className="ml-1 text-fog-deep hover:text-blood-bright" title="Exclure">
                          ✕
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>

            {isLeader && (
              <div className="mt-4 border-t border-brass/10 pt-4">
                <p className="font-display text-[0.65rem] uppercase tracking-widest text-fog">
                  Inviter un ami
                </p>
                {addableFriends.length === 0 ? (
                  <p className="mt-2 text-xs text-fog-deep">
                    Aucun ami disponible.{" "}
                    <Link href="/friends" className="text-brass hover:underline">
                      Gérer mes amis
                    </Link>
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {addableFriends.map((f) => (
                      <form key={f.id} action={addToParty}>
                        <input type="hidden" name="friendId" value={f.id} />
                        <button className="flex items-center gap-2 rounded-sm border border-brass/20 px-2.5 py-1.5 text-xs text-parchment transition-colors hover:border-brass/60 hover:bg-brass/10">
                          <PirateAvatar handle={f.handle} hue={f.avatarHue} size={20} />
                          {f.handle}
                          <span className="text-brass">+</span>
                        </button>
                      </form>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8">
        <QueueBoard modes={MODES} counts={counts} partySize={party?.members.length ?? 1} />
      </div>

      <div className="mt-8 flex items-center gap-4 rounded-sm border border-[#5865F2]/40 bg-[#5865F2]/10 p-4 text-sm">
        <span className="text-[#7b87ff]">
          <DiscordMark width={28} height={28} />
        </span>
        <p className="text-fog">
          <span className="font-display text-parchment">Et bientôt&nbsp;:</span> toute cette boucle —
          groupe, file, salon, Join Code et report du résultat — pilotable directement depuis le bot
          du serveur Discord, sans quitter le jeu.
        </p>
      </div>
    </div>
  );
}
