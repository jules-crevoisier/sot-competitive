import { Chest, Anchor, Flag } from "@/components/icons";

export const metadata = { title: "Soutenir — Custom Seas Lounge" };

const TIERS = [
  { name: "Moussaillon", amount: "3 €", perks: ["Badge Soutien sur ton profil", "Notre gratitude éternelle"] },
  { name: "Corsaire", amount: "8 €", perks: ["Badge Soutien doré", "Rôle Discord dédié", "Vote sur les prochains modes"], featured: true },
  { name: "Capitaine", amount: "20 €", perks: ["Tous les paliers", "Mention au générique des events", "Skin d'emblème d'équipage exclusif"] },
];

export default function DonatePage() {
  return (
    <div className="content-layer mx-auto max-w-4xl px-4 py-12">
      <header className="text-center">
        <p className="seal">Garnir le coffre</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Soutenir la plateforme</h1>
        <p className="mx-auto mt-3 max-w-2xl text-fog">
          Custom Seas Lounge est <span className="text-parchment">gratuit et communautaire</span>.
          Les dons servent uniquement à financer l&apos;hébergement, le bot Discord et surtout les
          <span className="text-brass"> lots des tournois</span>. Pas d&apos;abonnement, pas de
          paywall&nbsp;: juste un coup de main si le cœur t&apos;en dit.
        </p>
        <div className="rope-rule mx-auto mt-4 w-24" />
      </header>

      {/* Répartition */}
      <div className="plank mt-8 grid gap-px overflow-hidden sm:grid-cols-3">
        {[
          { icon: <Chest width={26} height={26} />, k: "60 %", l: "Lots & récompenses des events" },
          { icon: <Anchor width={26} height={26} />, k: "30 %", l: "Hébergement & bot Discord" },
          { icon: <Flag width={26} height={26} />, k: "10 %", l: "Direction artistique & goodies" },
        ].map((s) => (
          <div key={s.l} className="bg-[#0b1b26] p-6 text-center">
            <div className="mx-auto mb-2 w-fit text-brass">{s.icon}</div>
            <div className="stat-num text-3xl font-bold text-brass">{s.k}</div>
            <div className="mt-1 text-xs text-fog">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Paliers */}
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`plank flex flex-col p-6 ${t.featured ? "ring-1 ring-brass" : ""}`}
          >
            {t.featured && <span className="seal mb-2">Le plus choisi</span>}
            <h2 className="font-display text-xl font-bold text-bone">{t.name}</h2>
            <div className="stat-num mt-1 text-3xl font-black text-brass">{t.amount}</div>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-fog">
              {t.perks.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="text-brass">⚓</span>
                  {p}
                </li>
              ))}
            </ul>
            <button className={`mt-5 ${t.featured ? "btn-brass" : "btn-ghost"} w-full justify-center`}>
              Soutenir
            </button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-fog-deep">
        Les paiements seront branchés au lancement officiel. Projet non affilié à Rare ni à Microsoft.
      </p>
    </div>
  );
}
