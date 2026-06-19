import { db } from "@/lib/db";
import { MODES } from "@/lib/modes";
import { QueueBoard } from "@/components/queue-board";
import { DiscordMark } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jouer — Custom Seas Lounge" };

export default async function PlayPage() {
  const grouped = await db.rating.groupBy({ by: ["mode"], where: { season: 1 }, _count: true });
  const counts = Object.fromEntries(grouped.map((g) => [g.mode, g._count]));

  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-12">
      <header>
        <p className="seal">Lever l&apos;ancre</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Rejoindre une file</h1>
        <p className="mt-3 max-w-2xl text-fog">
          Choisis un mode, entre dans la file. Dès qu&apos;il y a assez de pirates, une table se
          forme, les équipages sont tirés au sort et une session Custom Seas est ouverte. Le Host
          reçoit le Join Code à publier.
        </p>
        <div className="rope-rule mt-4 w-24" />
      </header>

      <div className="mt-8">
        <QueueBoard modes={MODES} counts={counts} />
      </div>

      <div className="mt-8 flex items-center gap-4 rounded-sm border border-[#5865F2]/40 bg-[#5865F2]/10 p-4 text-sm">
        <span className="text-[#7b87ff]">
          <DiscordMark width={28} height={28} />
        </span>
        <p className="text-fog">
          <span className="font-display text-parchment">Et bientôt&nbsp;:</span> toute cette boucle —
          file, table, Join Code et report du résultat — pilotable directement depuis le bot du
          serveur Discord, sans quitter le jeu.
        </p>
      </div>
    </div>
  );
}
