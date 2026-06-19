import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentPlayer } from "@/lib/session";
import { PirateAvatar } from "@/components/pirate-avatar";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  addToParty,
} from "@/lib/social-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Amis — Custom Seas Lounge" };

const INPUT =
  "w-full rounded-sm border border-brass/25 bg-black/30 px-3 py-2 text-sm text-parchment placeholder:text-fog-deep focus:border-brass focus:outline-none";

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;
  const me = await getCurrentPlayer();
  if (!me) {
    return (
      <div className="content-layer mx-auto max-w-3xl px-4 py-12">
        <p className="plank p-6 text-fog">Aucun pirate. Lance le seed de la base.</p>
      </div>
    );
  }

  const links = await db.friendship.findMany({
    where: { OR: [{ requesterId: me.id }, { addresseeId: me.id }] },
    include: {
      requester: { select: { id: true, handle: true, avatarHue: true, country: true } },
      addressee: { select: { id: true, handle: true, avatarHue: true, country: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const accepted = links.filter((l) => l.status === "ACCEPTED");
  const incoming = links.filter((l) => l.status === "PENDING" && l.addresseeId === me.id);
  const outgoing = links.filter((l) => l.status === "PENDING" && l.requesterId === me.id);

  const friendOf = (l: (typeof links)[number]) =>
    l.requesterId === me.id ? l.addressee : l.requester;

  // mon groupe (pour proposer « ajouter au groupe »)
  const myParty = await db.party.findFirst({
    where: { leaderId: me.id },
    include: { members: { select: { playerId: true } } },
  });
  const inPartyIds = new Set(myParty?.members.map((m) => m.playerId) ?? []);

  return (
    <div className="content-layer mx-auto max-w-4xl px-4 py-12">
      <header>
        <p className="seal">L&apos;équipage de confiance</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Amis</h1>
        <p className="mt-3 max-w-2xl text-fog">
          Ajoute des pirates à ta liste pour les inviter dans un groupe et faire la file ensemble.
          Tu incarnes&nbsp;
          <span className="text-parchment">{me.handle}</span> — change de pirate via le menu en haut
          à droite pour tester les deux côtés.
        </p>
        <div className="rope-rule mt-4 w-24" />
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Ajout + demandes */}
        <div className="space-y-6">
          <div className="plank p-5">
            <p className="seal">Ajouter un pirate</p>
            <form action={sendFriendRequest} className="mt-3 flex gap-2">
              <input name="handle" required maxLength={30} className={INPUT} placeholder="Pseudo exact" />
              <button type="submit" className="btn-brass shrink-0">Ajouter</button>
            </form>
            {err === "introuvable" && (
              <p className="mt-2 text-xs text-blood-bright">Pseudo introuvable (ou c&apos;est toi).</p>
            )}
          </div>

          {incoming.length > 0 && (
            <div className="plank p-5">
              <p className="seal">Demandes reçues</p>
              <ul className="mt-3 space-y-2">
                {incoming.map((l) => {
                  const f = friendOf(l);
                  return (
                    <li key={l.id} className="flex items-center gap-3">
                      <PirateAvatar handle={f.handle} hue={f.avatarHue} size={34} />
                      <span className="flex-1 truncate text-sm text-parchment">{f.handle}</span>
                      <form action={acceptFriendRequest}>
                        <input type="hidden" name="id" value={l.id} />
                        <button className="btn-brass !px-3 !py-1.5 text-xs">Accepter</button>
                      </form>
                      <form action={declineFriendRequest}>
                        <input type="hidden" name="id" value={l.id} />
                        <button className="font-display text-xs uppercase tracking-widest text-fog hover:text-blood-bright">
                          Refuser
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {outgoing.length > 0 && (
            <div className="plank p-5">
              <p className="seal">Demandes envoyées</p>
              <ul className="mt-3 space-y-2">
                {outgoing.map((l) => {
                  const f = friendOf(l);
                  return (
                    <li key={l.id} className="flex items-center gap-3">
                      <PirateAvatar handle={f.handle} hue={f.avatarHue} size={30} />
                      <span className="flex-1 truncate text-sm text-fog">{f.handle}</span>
                      <span className="chip text-fog-deep">en attente</span>
                      <form action={declineFriendRequest}>
                        <input type="hidden" name="id" value={l.id} />
                        <button className="font-display text-xs uppercase tracking-widest text-fog hover:text-blood-bright">
                          Annuler
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Liste d'amis */}
        <div className="plank p-5">
          <div className="flex items-baseline justify-between">
            <p className="seal">Mes amis</p>
            <span className="stat-num text-sm text-brass">{accepted.length}</span>
          </div>
          {accepted.length === 0 ? (
            <p className="mt-4 text-sm text-fog">Pas encore d&apos;amis — ajoute un pirate par son pseudo.</p>
          ) : (
            <ul className="mt-3 divide-y divide-brass/10">
              {accepted.map((l) => {
                const f = friendOf(l);
                const canAdd = myParty && !inPartyIds.has(f.id);
                return (
                  <li key={l.id} className="flex items-center gap-3 py-2.5">
                    <PirateAvatar handle={f.handle} hue={f.avatarHue} size={38} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/players/${f.id}`} className="block truncate font-display text-sm text-bone hover:text-brass">
                        {f.handle}
                      </Link>
                      {f.country && <span className="text-xs text-fog-deep">{f.country}</span>}
                    </div>
                    {canAdd && (
                      <form action={addToParty}>
                        <input type="hidden" name="friendId" value={f.id} />
                        <button className="btn-ghost !px-3 !py-1.5 text-xs" title="Ajouter à mon groupe">
                          + Groupe
                        </button>
                      </form>
                    )}
                    <form action={declineFriendRequest}>
                      <input type="hidden" name="id" value={l.id} />
                      <button className="font-display text-xs uppercase tracking-widest text-fog-deep hover:text-blood-bright" title="Retirer">
                        ✕
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-4 font-mono text-xs text-fog-deep">
            Astuce : crée d&apos;abord un groupe sur la page « Jouer » pour pouvoir y ajouter tes amis.
          </p>
        </div>
      </div>
    </div>
  );
}
