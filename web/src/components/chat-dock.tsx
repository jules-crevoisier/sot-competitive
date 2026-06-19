"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PirateAvatar } from "./pirate-avatar";
import {
  listConversations,
  fetchChannel,
  sendChatMessage,
  searchPlayers,
} from "@/lib/social-actions";

type Me = { id: string; handle: string; avatarHue: number };
type Active = { type: "DM" | "PARTY" | "GLOBAL"; key: string; title: string; hue: number };
type Msg = {
  id: string;
  authorId: string;
  handle: string;
  hue: number;
  body: string;
  createdAt: string;
  mine: boolean;
};
type Conv = { otherId: string; handle: string; hue: number; key: string; last: string };

function dmKey(a: string, b: string) {
  return [a, b].sort().join("__");
}

export function ChatDock({ me }: { me: Me }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "conv" | "new">("list");
  const [active, setActive] = useState<Active | null>(null);

  const [conversations, setConversations] = useState<Conv[]>([]);
  const [partyId, setPartyId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; handle: string; avatarHue: number }[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const data = await listConversations();
    setConversations(data.conversations);
    setPartyId(data.partyId);
  }, []);

  const loadMessages = useCallback(async (a: Active) => {
    const data = await fetchChannel(a.type, a.key);
    setMessages(data.messages);
  }, []);

  // Liste : charge + rafraîchit
  useEffect(() => {
    if (!open || view === "conv") return;
    loadConversations();
    const t = setInterval(loadConversations, 6000);
    return () => clearInterval(t);
  }, [open, view, loadConversations]);

  // Conversation : charge + rafraîchit
  useEffect(() => {
    if (!open || view !== "conv" || !active) return;
    loadMessages(active);
    const t = setInterval(() => loadMessages(active), 3000);
    return () => clearInterval(t);
  }, [open, view, active, loadMessages]);

  // Auto-scroll en bas à chaque nouveau message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Recherche de pirates (nouvelle conversation)
  useEffect(() => {
    if (view !== "new") return;
    if (query.trim().length < 1) {
      setResults([]);
      return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      const r = await searchPlayers(query);
      if (alive) setResults(r);
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query, view]);

  function openConv(a: Active) {
    setActive(a);
    setMessages([]);
    setView("conv");
  }

  async function send() {
    if (!active) return;
    const body = text.trim();
    if (!body) return;
    setText("");
    // optimiste
    setMessages((m) => [
      ...m,
      {
        id: `tmp-${Date.now()}`,
        authorId: me.id,
        handle: me.handle,
        hue: me.avatarHue,
        body,
        createdAt: new Date().toISOString(),
        mine: true,
      },
    ]);
    await sendChatMessage({ channelType: active.type, channelKey: active.key, body });
    loadMessages(active);
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      {/* Fenêtre */}
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-sm border border-brass/30 bg-[#0b1722] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] sm:w-96">
          {/* En-tête */}
          <div className="flex items-center gap-2 border-b border-brass/20 bg-black/30 px-3 py-2">
            {view !== "list" ? (
              <button
                onClick={() => setView("list")}
                className="text-fog hover:text-brass"
                title="Retour"
              >
                ‹
              </button>
            ) : (
              <span className="text-brass">⚓</span>
            )}
            <span className="flex-1 truncate font-display text-sm text-bone">
              {view === "conv" && active ? active.title : view === "new" ? "Nouvelle conversation" : "Messages"}
            </span>
            <button onClick={() => setOpen(false)} className="text-fog hover:text-blood-bright" title="Fermer">
              ✕
            </button>
          </div>

          {/* Corps */}
          {view === "list" && (
            <div className="flex-1 overflow-auto">
              <button
                onClick={() => openConv({ type: "GLOBAL", key: "global", title: "Canal global", hue: 40 })}
                className="flex w-full items-center gap-3 border-b border-brass/10 px-3 py-2.5 text-left hover:bg-brass/5"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brass/15 text-brass">🌊</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-parchment">Canal global</span>
                  <span className="block truncate text-xs text-fog-deep">Toute la communauté</span>
                </span>
              </button>

              {partyId && (
                <button
                  onClick={() => openConv({ type: "PARTY", key: partyId, title: "Mon groupe", hue: 165 })}
                  className="flex w-full items-center gap-3 border-b border-brass/10 px-3 py-2.5 text-left hover:bg-brass/5"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-verdigris/15 text-verdigris">⚔</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-parchment">Mon groupe</span>
                    <span className="block truncate text-xs text-fog-deep">Chat de la party</span>
                  </span>
                </button>
              )}

              <p className="px-3 pt-3 font-display text-[0.6rem] uppercase tracking-widest text-fog-deep">
                Messages privés
              </p>
              {conversations.length === 0 ? (
                <p className="px-3 py-3 text-xs text-fog-deep">Aucune conversation pour l&apos;instant.</p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.otherId}
                    onClick={() =>
                      openConv({ type: "DM", key: c.key, title: c.handle, hue: c.hue })
                    }
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-brass/5"
                  >
                    <PirateAvatar handle={c.handle} hue={c.hue} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-parchment">{c.handle}</span>
                      <span className="block truncate text-xs text-fog-deep">{c.last}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {view === "new" && (
            <div className="flex-1 overflow-auto p-3">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Chercher un pirate…"
                className="w-full rounded-sm border border-brass/25 bg-black/30 px-3 py-2 text-sm text-parchment placeholder:text-fog-deep focus:border-brass focus:outline-none"
              />
              <div className="mt-2 space-y-1">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() =>
                      openConv({ type: "DM", key: dmKey(me.id, r.id), title: r.handle, hue: r.avatarHue })
                    }
                    className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left hover:bg-brass/5"
                  >
                    <PirateAvatar handle={r.handle} hue={r.avatarHue} size={32} />
                    <span className="text-sm text-parchment">{r.handle}</span>
                  </button>
                ))}
                {query.trim().length > 0 && results.length === 0 && (
                  <p className="px-2 py-2 text-xs text-fog-deep">Aucun pirate trouvé.</p>
                )}
              </div>
            </div>
          )}

          {view === "conv" && active && (
            <>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-auto p-3">
                {messages.length === 0 && (
                  <p className="py-6 text-center text-xs text-fog-deep">
                    Début de la conversation. Dis bonjour !
                  </p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-2 ${m.mine ? "flex-row-reverse" : ""}`}>
                    {!m.mine && <PirateAvatar handle={m.handle} hue={m.hue} size={26} />}
                    <div className={`max-w-[75%] ${m.mine ? "text-right" : ""}`}>
                      {active.type !== "DM" && !m.mine && (
                        <span className="block text-[0.6rem] text-fog-deep">{m.handle}</span>
                      )}
                      <span
                        className="inline-block rounded-sm px-2.5 py-1.5 text-sm"
                        style={{
                          background: m.mine ? "var(--color-brass-deep)" : "rgba(255,255,255,0.06)",
                          color: m.mine ? "#f4ecd8" : "var(--color-parchment)",
                        }}
                      >
                        {m.body}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-brass/20 p-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder="Écris un message…"
                  className="flex-1 rounded-sm border border-brass/20 bg-black/30 px-3 py-2 text-sm text-parchment placeholder:text-fog-deep focus:border-brass focus:outline-none"
                />
                <button onClick={send} className="btn-brass !px-3 !py-2 text-xs">
                  Envoyer
                </button>
              </div>
            </>
          )}

          {/* Pied : nouvelle conversation */}
          {view === "list" && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setView("new");
              }}
              className="border-t border-brass/20 bg-black/20 py-2 text-center font-display text-xs uppercase tracking-widest text-brass hover:bg-brass/10"
            >
              + Nouvelle conversation
            </button>
          )}
        </div>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="ml-auto flex h-12 w-12 items-center justify-center rounded-full border border-brass/40 bg-[#0b1722] text-brass shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8)] transition-transform hover:scale-105"
        title="Chat"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
