// Jeu d'icônes & ornements pirate, faits main (currentColor, héritent de la couleur du texte).
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export function CompassRose(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12 3.5 13.4 10.6 12 12 10.6 10.6Z" fill="currentColor" />
      <path d="M12 20.5 10.6 13.4 12 12 13.4 13.4Z" />
      <path d="M3.5 12 10.6 10.6 12 12 10.6 13.4Z" />
      <path d="M20.5 12 13.4 13.4 12 12 13.4 10.6Z" />
    </svg>
  );
}

export function Anchor(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="4.5" r="1.8" />
      <path d="M12 6.3V20" />
      <path d="M8 10h8" />
      <path d="M5 13a7 7 0 0 0 14 0" />
      <path d="M5 13H3.4M19 13h1.6" />
    </svg>
  );
}

export function Skull(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M5 11a7 7 0 0 1 14 0c0 2.3-1 3.6-2 4.4V18a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 18v-2.6C6 14.6 5 13.3 5 11Z" />
      <circle cx="9.3" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <path d="M11 15h2" />
    </svg>
  );
}

export function Swords(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M14.5 4H20v5.5L9.5 20 4 14.5 14.5 4Z" />
      <path d="M9.5 4H4v5.5L14.5 20 20 14.5" />
      <path d="M6 18l-2 2M18 18l2 2" />
    </svg>
  );
}

export function Scope(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Chest(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M4 10a8 8 0 0 1 16 0v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8Z" />
      <path d="M4 12h16" />
      <rect x="10.5" y="11" width="3" height="4" rx="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ShipWheel(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" />
      <path d="M12 1v6M12 17v6M1 12h6M17 12h6M4.2 4.2l4.2 4.2M15.6 15.6l4.2 4.2M19.8 4.2l-4.2 4.2M8.4 15.6l-4.2 4.2" />
    </svg>
  );
}

export function Sail(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M12 3v15" />
      <path d="M12 5c-3.5.5-6 2.5-7 6.5 2.5-1 5-1 7-.5Z" fill="currentColor" />
      <path d="M12 5c3.5.5 6 2.5 7 6.5-2.5-1-5-1-7-.5" />
      <path d="M5 18h14l-2 3H7Z" />
    </svg>
  );
}

export function Flag(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M6 3v18" />
      <path d="M6 4h11l-2.5 3.5L17 11H6Z" fill="currentColor" />
    </svg>
  );
}

export function DiscordMark(p: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M19.3 5.3A17 17 0 0 0 15 4l-.2.4a13 13 0 0 1 3.6 1.7 14.8 14.8 0 0 0-12.8 0A13 13 0 0 1 9.2 4.4L9 4a17 17 0 0 0-4.3 1.3C2 9.3 1.4 13.1 1.7 16.9A17 17 0 0 0 6.9 19l.5-.7a11 11 0 0 1-2-1l.5-.3a12 12 0 0 0 10.2 0l.5.3a11 11 0 0 1-2 1l.5.7a17 17 0 0 0 5.2-2.1c.4-4.3-.6-8-2.5-11.6ZM8.5 14.6c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.9.9 1.8 2c0 1.1-.8 2-1.8 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.9.9 1.8 2c0 1.1-.8 2-1.8 2Z" />
    </svg>
  );
}

const ICONS = { swords: Swords, skull: Skull, anchor: Anchor, scope: Scope, chest: Chest };
export function ModeGlyph({ name, ...p }: { name: keyof typeof ICONS } & P) {
  const C = ICONS[name];
  return <C {...p} />;
}

/** Filet ondulé décoratif (vagues) pleine largeur. */
export function WaveDivider({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1200 24" preserveAspectRatio="none" aria-hidden>
      <path
        d="M0 12 C 60 2, 120 2, 180 12 S 300 22, 360 12 S 480 2, 540 12 S 660 22, 720 12 S 840 2, 900 12 S 1020 22, 1080 12 S 1200 2, 1200 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.5"
      />
    </svg>
  );
}
