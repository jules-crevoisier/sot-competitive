import Link from "next/link";
import { getCurrentPlayer } from "@/lib/session";
import { ProfileForm } from "@/components/profile-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon profil — Custom Seas Lounge" };

const ERR: Record<string, string> = {
  pseudo: "Le pseudo doit faire entre 2 et 24 caractères.",
  pris: "Ce pseudo est déjà pris par un autre pirate.",
};

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { ok, err } = await searchParams;
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

      <div className="mt-6">
        <ProfileForm player={me} />
      </div>
    </div>
  );
}
