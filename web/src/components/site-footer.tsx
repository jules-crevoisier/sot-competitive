import Link from "next/link";
import { Anchor, WaveDivider } from "./icons";

export function SiteFooter() {
  return (
    <footer className="content-layer mt-20 border-t border-brass/20 bg-[#081019]">
      <div className="text-verdigris-deep">
        <WaveDivider className="h-5 w-full" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 text-brass">
              <Anchor width={20} height={20} />
              <span className="font-display text-sm font-bold tracking-wider text-bone">
                CUSTOM SEAS LOUNGE
              </span>
            </div>
            <p className="mt-3 text-sm text-fog">
              Classement compétitif communautaire pour Sea of Thieves via le mode Custom Seas
              (Saison 20). Projet non affilié à Rare ni à Microsoft.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            <Link href="/modes" className="text-fog hover:text-brass">Modes & règles</Link>
            <Link href="/ladder/sloop-1v1" className="text-fog hover:text-brass">Classement</Link>
            <Link href="/play" className="text-fog hover:text-brass">Rejoindre une file</Link>
            <Link href="/admin" className="text-fog hover:text-brass">Espace staff</Link>
            <Link href="/matches" className="text-fog hover:text-brass">Derniers matchs</Link>
            <span className="text-fog-deep">Bot Discord — bientôt</span>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-brass/10 pt-5 text-xs text-fog-deep">
          <span>© {new Date().getFullYear()} — fait par la communauté, pour la communauté.</span>
          <span className="font-mono">Saison 1</span>
        </div>
      </div>
    </footer>
  );
}
