import Link from "next/link";
import { DiscordMark, ShipWheel } from "@/components/icons";

export const metadata = { title: "Guide du joueur — Custom Seas Lounge" };

const STEPS = [
  {
    n: "I",
    t: "Rejoins le Discord",
    d: "Tout part du serveur Discord officiel. C'est le point d'entrée de la communauté et le futur poste de commandement du bot.",
  },
  {
    n: "II",
    t: "Enregistre ton pseudo en jeu",
    d: "Via le bot Discord, lie ton compte à ton nom in-game. C'est ce qui te donne accès aux files et au classement.",
  },
  {
    n: "III",
    t: "Connecte-toi à la plateforme",
    d: "Login Discord en un clic. On vérifie que tu es bien sur le serveur et que ton pseudo est enregistré.",
  },
  {
    n: "IV",
    t: "Complète ton profil",
    d: "Arme préférée, style de jeu, liens Twitch/réseaux, équipage. Plus ton profil est rempli, plus la communauté te repère.",
  },
  {
    n: "V",
    t: "Entre dans une file",
    d: "Choisis un mode (Sloop, Brig, Galion…) et rejoins la file. Dès qu'il y a assez de pirates, une table équilibrée se forme.",
  },
  {
    n: "VI",
    t: "Crée la session en jeu",
    d: "Le Host ouvre une session Custom Seas avec les réglages imposés, puis colle le Join Code à 5 caractères sur la plateforme. Les autres rejoignent.",
  },
  {
    n: "VII",
    t: "Joue selon les règles du mode",
    d: "Les Switches sont affichés sur chaque page de mode. On respecte le format (Best of, time limit, scoring) à la lettre.",
  },
  {
    n: "VIII",
    t: "Valide le résultat",
    d: "Capture du Scoreboard final, scores saisis et confirmés. Le MMR est recalculé, ton rang bouge, le match entre dans ton historique.",
  },
];

export default function GuidePage() {
  return (
    <div className="content-layer mx-auto max-w-4xl px-4 py-12">
      <header>
        <p className="seal">Carte au trésor</p>
        <h1 className="mt-2 font-display text-4xl font-black text-bone">Guide du joueur</h1>
        <p className="mt-3 max-w-2xl text-fog">
          De ton arrivée sur Discord à ton premier match classé&nbsp;: voici les huit étapes pour
          embarquer sans te perdre dans la brume.
        </p>
        <div className="rope-rule mt-4 w-24" />
      </header>

      <ol className="mt-8 space-y-4">
        {STEPS.map((s) => (
          <li key={s.n} className="plank plank-bracket flex gap-5 p-5">
            <span className="font-display text-4xl font-black text-brass/30">{s.n}</span>
            <div>
              <h2 className="font-display text-lg text-bone">{s.t}</h2>
              <p className="mt-1 text-sm leading-relaxed text-fog">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button className="btn-brass" style={{ background: "linear-gradient(180deg,#5865F2,#404abf)", color: "#fff", borderColor: "#2b317d" }}>
          <DiscordMark width={16} height={16} /> Rejoindre le Discord
        </button>
        <Link href="/play" className="btn-ghost">
          <ShipWheel width={16} height={16} /> Voir les files
        </Link>
      </div>
    </div>
  );
}
