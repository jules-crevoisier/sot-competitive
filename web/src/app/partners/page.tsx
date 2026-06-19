import { db } from "@/lib/db";
import { PirateAvatar } from "@/components/pirate-avatar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Partenaires Twitch — Custom Seas Lounge" };

export default async function PartnersPage() {
  const partners = await db.partner.findMany({
    orderBy: [{ live: "desc" }, { tier: "asc" }, { name: "asc" }],
  });

  return (
    <div className="content-layer mx-auto max-w-5xl px-4 py-12">
      <header>
        <p className="seal">Voix de la communauté</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Partenaires Twitch</h1>
        <p className="mt-3 max-w-2xl text-fog">
          Les streamers et créateurs qui castent nos matchs, animent les soirées et portent la
          plateforme. Va leur faire un coucou et lâche un follow.
        </p>
        <div className="rope-rule mt-4 w-24" />
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((p) => (
          <a
            key={p.id}
            href={p.twitchUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="plank plank-bracket group flex flex-col p-6 transition-colors hover:bg-brass/5"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <PirateAvatar handle={p.name} hue={p.avatarHue} size={52} />
                {p.live && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-blood-bright px-1.5 py-px font-mono text-[0.55rem] font-bold uppercase tracking-wider text-bone">
                    Live
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-bold text-bone group-hover:text-brass">
                  {p.name}
                </h2>
                <span className="chip text-brass">{p.tier === "AMBASSADEUR" ? "Ambassadeur" : "Partenaire"}</span>
              </div>
            </div>
            {p.tagline && <p className="mt-3 flex-1 text-sm text-fog">{p.tagline}</p>}
            <span className="mt-4 inline-flex items-center gap-2 font-display text-xs uppercase tracking-widest text-[#a78bff] group-hover:text-[#c4b3ff]">
              Voir la chaîne →
            </span>
          </a>
        ))}
      </div>

      <div className="parchment mt-10 p-6 sm:p-8">
        <h3 className="font-display text-xl font-bold" style={{ color: "#2a1d06" }}>
          Tu streames Sea of Thieves ?
        </h3>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: "#4a3a1c" }}>
          On cherche des partenaires pour caster les tournois et animer la communauté. Rejoins le
          Discord et ouvre un ticket « Partenariat » — visibilité sur cette page, rôle dédié et
          accès aux events en avant-première.
        </p>
      </div>
    </div>
  );
}
