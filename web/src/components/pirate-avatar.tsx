// Avatar généré déterministe (pas d'upload requis) — médaillon laiton + initiale gravée.
// La teinte vient de `hue` (stocké par joueur), pour un rendu cohérent et reconnaissable.

export function PirateAvatar({
  handle,
  hue = 40,
  size = 44,
  ring = true,
}: {
  handle: string;
  hue?: number;
  size?: number;
  ring?: boolean;
}) {
  const initial = handle.replace(/[^a-zA-Z0-9]/g, "").charAt(0).toUpperCase() || "?";
  const c1 = `hsl(${hue} 45% 32%)`;
  const c2 = `hsl(${(hue + 28) % 360} 40% 18%)`;
  return (
    <span
      className="relative inline-grid place-items-center shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(120% 120% at 30% 25%, ${c1}, ${c2})`,
        border: ring ? "2px solid var(--color-brass-deep)" : "none",
        boxShadow: ring ? "0 0 0 1px rgba(0,0,0,.5), inset 0 2px 6px rgba(0,0,0,.4)" : undefined,
      }}
      aria-hidden
    >
      <span
        className="font-display font-bold"
        style={{ color: "var(--color-bone)", fontSize: size * 0.42, lineHeight: 1, textShadow: "0 1px 2px rgba(0,0,0,.6)" }}
      >
        {initial}
      </span>
    </span>
  );
}
