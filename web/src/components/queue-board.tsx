"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Mode } from "@/lib/modes";
import { maxPartySize, perTeamFor } from "@/lib/modes";
import { ACCENT } from "@/lib/accent";
import { ModeGlyph, ShipWheel } from "./icons";
import { joinQueue } from "@/lib/social-actions";

export function QueueBoard({
  modes,
  counts,
  partySize = 1,
}: {
  modes: Mode[];
  counts: Record<string, number>;
  partySize?: number;
}) {
  // un mode est jouable si le groupe tient dans un équipage
  const modeFits = (m: Mode) => partySize <= maxPartySize(m);
  const firstFitting = modes.find(modeFits) ?? modes[0];

  const [selected, setSelected] = useState(firstFitting.key);
  const [phase, setPhase] = useState<"idle" | "queue" | "found">("idle");
  const [inQueue, setInQueue] = useState(0);
  const [secs, setSecs] = useState(0);
  const [pending, start] = useTransition();
  const launched = useRef(false);

  const mode = modes.find((m) => m.key === selected)!;
  const a = ACCENT[mode.accent];
  const needed = perTeamFor(mode) * 2;
  const fits = modeFits(mode);
  const startFill = Math.min(needed, Math.max(1, partySize));

  // Simulation de remplissage de la file (cosmétique)
  useEffect(() => {
    if (phase !== "queue") return;
    const grow = setInterval(() => {
      setInQueue((n) => {
        if (n >= needed) {
          clearInterval(grow);
          setPhase("found");
          return needed;
        }
        return n + 1;
      });
    }, 600);
    const tick = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => {
      clearInterval(grow);
      clearInterval(tick);
    };
  }, [phase, needed]);

  // File pleine -> on forme le salon en base puis on redirige
  useEffect(() => {
    if (phase !== "found" || launched.current) return;
    launched.current = true;
    const t = setTimeout(() => {
      const fd = new FormData();
      fd.set("mode", selected);
      start(() => joinQueue(fd));
    }, 1200);
    return () => clearTimeout(t);
  }, [phase, selected, start]);

  function enterQueue() {
    setInQueue(startFill);
    setSecs(0);
    launched.current = false;
    setPhase("queue");
  }

  function quitQueue() {
    setPhase("idle");
    setInQueue(0);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      {/* Choix du mode */}
      <div className="plank p-5">
        <p className="seal">Choisis ton champ de bataille</p>
        <div className="mt-4 space-y-2">
          {modes.map((m) => {
            const ac = ACCENT[m.accent];
            const active = m.key === selected;
            const locked = !modeFits(m);
            return (
              <button
                key={m.key}
                onClick={() => {
                  if (phase === "idle" && !locked) setSelected(m.key);
                }}
                disabled={phase !== "idle" || locked}
                title={locked ? `Groupe trop grand (max ${maxPartySize(m)})` : undefined}
                className="flex w-full items-center gap-3 rounded-sm border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor: active ? ac.color : "rgba(200,162,75,0.18)",
                  background: active ? ac.soft : "transparent",
                }}
              >
                <span style={{ color: ac.color }}>
                  <ModeGlyph name={m.icon} width={22} height={22} />
                </span>
                <span className="flex-1">
                  <span className="block font-display text-sm text-bone">{m.name}</span>
                  <span className="block text-xs text-fog">{m.tagline} · {m.ship}</span>
                </span>
                {locked ? (
                  <span className="font-display text-[0.6rem] uppercase tracking-widest text-fog-deep">
                    🔒 max {maxPartySize(m)}
                  </span>
                ) : (
                  <span className="stat-num text-xs text-fog">
                    {counts[m.key] ?? 0}
                    <span className="text-fog-deep"> classés</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panneau de file */}
      <div className="plank plank-bracket relative flex flex-col items-center justify-center overflow-hidden p-8 text-center" style={{ borderColor: `${a.color}44`, minHeight: 360 }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ color: a.color }}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <ModeGlyph name={mode.icon} width={260} height={260} />
          </div>
        </div>

        {phase === "idle" && (
          <div className="relative">
            <span style={{ color: a.color }}>
              <ModeGlyph name={mode.icon} width={56} height={56} />
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold text-bone">{mode.name}</h2>
            <p className="mt-1 text-sm text-fog">
              {needed} pirates · {mode.format}
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm text-fog">{mode.summary}</p>
            <button
              onClick={enterQueue}
              disabled={!fits}
              className="btn-brass mt-6 text-base disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShipWheel width={18} height={18} />
              {partySize > 1 ? `Rejoindre la file (groupe de ${partySize})` : "Rejoindre la file"}
            </button>
            {fits ? (
              <p className="mt-3 font-mono text-xs text-fog-deep">
                Démo : le salon se complète avec des pirates classés.
              </p>
            ) : (
              <p className="mx-auto mt-3 max-w-sm text-xs text-blood-bright">
                Ton groupe de {partySize} est trop grand pour ce mode (max {maxPartySize(mode)} par
                équipage). Choisis un mode plus grand ou réduis le groupe.
              </p>
            )}
          </div>
        )}

        {phase === "queue" && (
          <div className="relative w-full max-w-sm">
            <p className="seal" style={{ color: a.color }}>File en cours</p>
            <div className="stat-num mt-3 text-5xl font-black text-bone">
              {inQueue}<span className="text-fog-deep">/{needed}</span>
            </div>
            <p className="mt-1 text-sm text-fog">pirates rassemblés…</p>
            <div className="mt-5 flex flex-wrap justify-center gap-1.5">
              {Array.from({ length: needed }).map((_, i) => (
                <span
                  key={i}
                  className="h-2.5 w-2.5 rounded-full transition-colors"
                  style={{ background: i < inQueue ? a.color : "rgba(255,255,255,0.12)" }}
                />
              ))}
            </div>
            <p className="mt-5 font-mono text-xs text-fog">temps d&apos;attente {secs}s</p>
            <button
              onClick={quitQueue}
              className="mt-5 font-display text-xs uppercase tracking-widest text-fog hover:text-blood-bright"
            >
              Quitter la file
            </button>
          </div>
        )}

        {phase === "found" && (
          <div className="relative">
            <div className="animate-pulse" style={{ color: a.color }}>
              <ShipWheel width={64} height={64} />
            </div>
            <h2 className="mt-4 font-display text-3xl font-black text-bone">Salon formé !</h2>
            <p className="mt-2 text-fog">
              {pending ? "Ouverture du salon…" : "Les équipages sont constitués."}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 font-mono text-sm text-brass">
              <span className="h-2 w-2 animate-ping rounded-full bg-brass" />
              redirection vers le salon
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
