import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthEnabled } from "@/lib/auth";
import { getCurrentPlayer } from "@/lib/session";
import { CompassRose } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connexion — Custom Seas Lounge" };

const ERR: Record<string, string> = {
  disabled: "La connexion Discord n'est pas configurée sur ce serveur.",
  state: "Session de connexion expirée. Réessaie.",
  guild: "Tu dois d'abord rejoindre le serveur Discord de la communauté.",
  notregistered:
    "Aucun compte lié à ce Discord. Inscris-toi d'abord sur le serveur avec /inscription <pseudo> (capture à l'appui).",
  oauth: "La connexion a échoué. Réessaie dans un instant.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  const enabled = isAuthEnabled();

  // déjà connecté → on file au profil
  const me = await getCurrentPlayer();
  if (me) redirect("/me");

  return (
    <div className="content-layer mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <span className="text-brass">
        <CompassRose width={56} height={56} />
      </span>
      <h1 className="mt-6 font-display text-4xl font-black text-bone">Embarquer</h1>
      <p className="mt-3 text-fog">
        Connecte-toi avec Discord pour accéder à ton profil, faire la file et grimper au classement.
      </p>

      {e && (
        <p
          className="mt-6 w-full rounded-sm border px-4 py-3 text-sm"
          style={{ borderColor: "var(--color-blood)", color: "var(--color-blood-bright)" }}
        >
          {ERR[e] ?? "Une erreur est survenue."}
        </p>
      )}

      {enabled ? (
        <a
          href="/api/auth/discord"
          className="mt-8 inline-flex items-center gap-3 rounded-sm px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-white transition-transform hover:scale-[1.02]"
          style={{ background: "#5865F2" }}
        >
          <DiscordMark />
          Se connecter avec Discord
        </a>
      ) : (
        <p className="mt-8 w-full rounded-sm border border-brass/25 bg-black/20 px-4 py-3 text-sm text-fog">
          Mode développement : la connexion Discord n&apos;est pas configurée. Utilise le sélecteur de
          pirate en haut à droite pour incarner un compte.
        </p>
      )}

      <div className="mt-10 w-full rounded-sm border border-brass/15 bg-black/20 p-5 text-left text-sm text-fog">
        <p className="font-display text-xs uppercase tracking-widest text-brass">Conditions d&apos;accès</p>
        <ul className="mt-3 space-y-2">
          <li>① Être membre du serveur Discord de la communauté.</li>
          <li>
            ② S&apos;être inscrit via le bot —{" "}
            <span className="font-mono text-parchment">/inscription &lt;pseudo&gt;</span> avec une
            capture où ton pseudo en jeu est lisible (vérification automatique).
          </li>
        </ul>
        <p className="mt-4 text-xs text-fog-deep">
          Pas encore inscrit&nbsp;? Rejoins le Discord et lance la commande, puis reviens te connecter ici.
        </p>
      </div>
    </div>
  );
}

function DiscordMark() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.2.36-.43.84-.59 1.22a18.27 18.27 0 0 0-5.487 0C9.92 3.84 9.69 3.36 9.49 3a19.74 19.74 0 0 0-3.76 1.369C2.07 9.86 1.18 15.21 1.62 20.49a19.9 19.9 0 0 0 6.075 3.075c.49-.67.93-1.385 1.31-2.135-.72-.27-1.41-.605-2.06-.995.17-.125.34-.255.5-.39 3.97 1.86 8.27 1.86 12.2 0 .16.14.33.27.5.39-.66.39-1.35.725-2.07.995.38.75.82 1.465 1.31 2.135a19.84 19.84 0 0 0 6.08-3.075c.52-6.12-.89-11.42-3.74-16.12ZM8.02 16.5c-1.18 0-2.15-1.085-2.15-2.42 0-1.335.95-2.42 2.15-2.42 1.21 0 2.18 1.095 2.16 2.42 0 1.335-.96 2.42-2.16 2.42Zm7.96 0c-1.18 0-2.15-1.085-2.15-2.42 0-1.335.95-2.42 2.15-2.42 1.21 0 2.18 1.095 2.16 2.42 0 1.335-.95 2.42-2.16 2.42Z" />
    </svg>
  );
}
