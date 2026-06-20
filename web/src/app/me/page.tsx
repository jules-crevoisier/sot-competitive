import Link from "next/link";
import { getCurrentPlayer } from "@/lib/session";
import { verifyHandleScreenshot } from "@/lib/profile-actions";
import { ProfileForm } from "@/components/profile-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon profil — Custom Seas Lounge" };

const ERR: Record<string, string> = {
  pseudo: "Le pseudo doit faire entre 2 et 24 caractères.",
  pris: "Ce pseudo est déjà pris par un autre pirate.",
};

const VERR: Record<string, string> = {
  nofile: "Aucune image reçue.",
  size: "Image trop lourde (8 Mo max).",
  ocr: "Lecture de l'image impossible, réessaie avec une capture plus nette.",
  nomatch: "Pseudo introuvable sur la capture. Vérifie qu'il est bien lisible et réessaie.",
};

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string; vok?: string; verr?: string }>;
}) {
  const { ok, err, vok, verr } = await searchParams;
  const me = await getCurrentPlayer();

  if (!me) {
    return (
      <div className="content-layer mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-black text-bone">Aucun pirate</h1>
        <p className="mt-3 text-fog">Aucun pirate n&apos;est encore incarné sur cette session.</p>
      </div>
    );
  }

  return (
    <div className="content-layer mx-auto max-w-3xl px-4 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="seal">Carnet de bord</p>
          <h1 className="mt-2 font-display text-4xl font-black text-bone">Mon profil</h1>
          <p className="mt-3 max-w-xl text-fog">
            Personnalise ta fiche : arme de prédilection, style de jeu, liens de stream. Tout ceci
            s&apos;affiche sur ta page publique.
          </p>
        </div>
        <Link
          href={`/players/${me.id}`}
          className="font-display text-xs uppercase tracking-widest text-fog hover:text-brass"
        >
          Voir ma page publique →
        </Link>
      </header>
      <div className="rope-rule mt-4 w-24" />

      {ok && (
        <p
          className="mt-6 rounded-sm border px-4 py-2 text-sm"
          style={{ borderColor: "var(--color-verdigris)", color: "var(--color-verdigris)" }}
        >
          Profil enregistré, capitaine.
        </p>
      )}
      {err && (
        <p
          className="mt-6 rounded-sm border px-4 py-2 text-sm"
          style={{ borderColor: "var(--color-blood)", color: "var(--color-blood-bright)" }}
        >
          {ERR[err] ?? "Une erreur est survenue."}
        </p>
      )}

      {/* Vérification du pseudo par capture (OCR) */}
      <div className="plank mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="seal">Vérification du pseudo</p>
            <p className="mt-1 max-w-xl text-sm text-fog">
              Envoie une capture où ton pseudo en jeu (<span className="text-parchment">{me.handle}</span>)
              est lisible — menu, équipage ou Scoreboard. La lecture est <strong>automatique</strong>.
            </p>
          </div>
          {me.verified ? (
            <span
              className="chip flex items-center gap-1"
              style={{ color: "var(--color-verdigris)", borderColor: "var(--color-verdigris)" }}
            >
              ✓ Pseudo vérifié
            </span>
          ) : (
            <span className="chip text-fog">Non vérifié</span>
          )}
        </div>

        {vok && (
          <p
            className="mt-4 rounded-sm border px-4 py-2 text-sm"
            style={{ borderColor: "var(--color-verdigris)", color: "var(--color-verdigris)" }}
          >
            Pseudo vérifié — bienvenue parmi les pirates confirmés.
          </p>
        )}
        {verr && (
          <p
            className="mt-4 rounded-sm border px-4 py-2 text-sm"
            style={{ borderColor: "var(--color-blood)", color: "var(--color-blood-bright)" }}
          >
            {VERR[verr] ?? "Vérification impossible."}
          </p>
        )}

        {!me.verified && (
          <form action={verifyHandleScreenshot} className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="file"
              name="shot"
              accept="image/*"
              required
              className="text-sm text-fog file:mr-3 file:rounded-sm file:border file:border-brass/30 file:bg-brass/10 file:px-3 file:py-1.5 file:text-brass"
            />
            <button type="submit" className="btn-brass justify-center">
              Vérifier
            </button>
          </form>
        )}
      </div>

      <div className="mt-6">
        <ProfileForm player={me} />
      </div>
    </div>
  );
}
