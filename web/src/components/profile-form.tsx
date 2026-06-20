"use client";

import { useState } from "react";
import { PirateAvatar } from "./pirate-avatar";
import { updateProfile } from "@/lib/profile-actions";

type Player = {
  handle: string;
  avatarHue: number;
  country: string | null;
  bio: string | null;
  weapon: string | null;
  playStyle: string | null;
  twitch: string | null;
  youtube: string | null;
  twitter: string | null;
};

const INPUT =
  "w-full rounded-sm border border-brass/25 bg-black/30 px-3 py-2 text-sm text-parchment placeholder:text-fog-deep focus:border-brass focus:outline-none";

export function ProfileForm({ player }: { player: Player }) {
  const [handle, setHandle] = useState(player.handle);
  const [hue, setHue] = useState(player.avatarHue);

  return (
    <form action={updateProfile} className="space-y-6">
      {/* Identité + aperçu */}
      <div className="plank p-6">
        <p className="seal">Identité</p>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div className="text-center">
            <PirateAvatar handle={handle || "?"} hue={hue} size={96} />
            <p className="mt-2 font-display text-[0.6rem] uppercase tracking-widest text-fog-deep">Aperçu</p>
          </div>
          <div className="flex-1 space-y-3">
            <Field label="Pseudo en jeu (unique)">
              <input
                name="handle"
                required
                minLength={2}
                maxLength={24}
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className={INPUT}
                placeholder="Mistral"
              />
            </Field>
            <Field label="Pays (code à 2 lettres, ex FR)">
              <input
                name="country"
                maxLength={2}
                defaultValue={player.country ?? ""}
                className={`${INPUT} uppercase`}
                placeholder="FR"
              />
            </Field>
            <Field label={`Teinte de l'avatar — ${hue}°`}>
              <input
                type="range"
                name="avatarHue"
                min={0}
                max={360}
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                className="w-full accent-[var(--color-brass)]"
                style={{
                  background:
                    "linear-gradient(90deg,hsl(0 60% 45%),hsl(60 60% 45%),hsl(120 60% 45%),hsl(180 60% 45%),hsl(240 60% 45%),hsl(300 60% 45%),hsl(360 60% 45%))",
                  height: 6,
                  borderRadius: 4,
                }}
              />
            </Field>
          </div>
        </div>
        <div className="mt-4">
          <Field label="Bio (240 caractères max)">
            <textarea
              name="bio"
              rows={3}
              maxLength={240}
              defaultValue={player.bio ?? ""}
              className={INPUT}
              placeholder="Capitaine de sloop, abordage à la première occasion."
            />
          </Field>
        </div>
      </div>

      {/* Fiche de pont */}
      <div className="plank p-6">
        <p className="seal">Fiche de pont</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Arme préférée">
            <input name="weapon" maxLength={40} defaultValue={player.weapon ?? ""} className={INPUT} placeholder="Eye of Reach" />
          </Field>
          <Field label="Style de jeu">
            <input name="playStyle" maxLength={60} defaultValue={player.playStyle ?? ""} className={INPUT} placeholder="Abordage agressif" />
          </Field>
        </div>
      </div>

      {/* Réseaux */}
      <div className="plank p-6">
        <p className="seal">Stream &amp; réseaux</p>
        <p className="mt-1 text-xs text-fog-deep">Colle juste le pseudo de la chaîne (sans l&apos;URL).</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Twitch">
            <input name="twitch" maxLength={50} defaultValue={player.twitch ?? ""} className={INPUT} placeholder="moncanal" />
          </Field>
          <Field label="YouTube">
            <input name="youtube" maxLength={50} defaultValue={player.youtube ?? ""} className={INPUT} placeholder="machaine" />
          </Field>
          <Field label="X / Twitter">
            <input name="twitter" maxLength={50} defaultValue={player.twitter ?? ""} className={INPUT} placeholder="monhandle" />
          </Field>
        </div>
      </div>

      <button type="submit" className="btn-brass justify-center">
        Enregistrer le profil
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-display text-[0.65rem] uppercase tracking-widest text-fog">{label}</span>
      {children}
    </label>
  );
}
