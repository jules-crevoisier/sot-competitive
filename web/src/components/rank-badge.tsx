import { rankForMmr, type Rank } from "@/lib/ranks";

// Emblème SVG par rang — médaillon avec un glyphe distinct.
function Emblem({ rank, size }: { rank: Rank; size: number }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <radialGradient id={`g-${rank.emblem}`} cx="35%" cy="28%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="45%" stopColor={rank.color} />
          <stop offset="100%" stopColor="#0a0f12" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill={`url(#g-${rank.emblem})`} stroke="#0a0f12" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
      <g fill="none" stroke="#0a0f12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        {rank.emblem === "bilge" && <path d="M13 26c2-2 4-2 7-2s5 0 7 2M14 17h12" />}
        {rank.emblem === "deckhand" && <path d="M20 11v18M14 16l6-3 6 3" />}
        {rank.emblem === "sailor" && <path d="M20 10v20M12 14h16M14 14c0 6 3 10 6 12 3-2 6-6 6-12" />}
        {rank.emblem === "bosun" && <path d="M20 9v22M13 26a7 7 0 0 0 14 0M13 26h14M20 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />}
        {rank.emblem === "corsair" && <path d="M12 13l16 14M28 13L12 27M13 12h4M27 12h-4" />}
        {rank.emblem === "captain" && (
          <>
            <circle cx="20" cy="20" r="3.5" />
            <path d="M20 9v4M20 27v4M9 20h4M27 20h4M12 12l3 3M28 12l-3 3M12 28l3-3M28 28l-3-3" />
          </>
        )}
        {rank.emblem === "legend" && (
          <path d="M14 24a6 6 0 0 1 12 0c0 2-1 3-2 3.6V29h-8v-1.4c-1-.6-2-1.6-2-3.6ZM17 24h.01M23 24h.01M19 27h2" />
        )}
      </g>
    </svg>
  );
}

export function RankBadge({
  mmr,
  size = 40,
  showName = false,
  className = "",
}: {
  mmr: number;
  size?: number;
  showName?: boolean;
  className?: string;
}) {
  const rank = rankForMmr(mmr);
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} title={rank.name}>
      <Emblem rank={rank} size={size} />
      {showName && (
        <span className="leading-tight">
          <span className="font-display text-sm tracking-wide" style={{ color: rank.color }}>
            {rank.name}
          </span>
        </span>
      )}
    </span>
  );
}
