// Définition des ladders ranked Custom Seas + settings imposés (cf. docs/MODES-RANKED.md).
// Ces données sont la source de vérité affichée joueur-side sur chaque page de match.

export type Switch = { label: string; value: string; emphasis?: "good" | "bad" | "neutral" };

export type Mode = {
  key: string;
  name: string;
  tagline: string;
  ship: string;
  teamSize: number; // joueurs par équipage
  tier: "principal" | "secondaire";
  format: string; // ex "Best of 5"
  preset: string; // preset officiel de départ
  scoringMethod: "Ship/Crew" | "Player";
  accent: "brass" | "verdigris" | "blood";
  icon: "swords" | "skull" | "anchor" | "scope" | "chest";
  summary: string;
  switches: Switch[];
};

const COMMON: Switch[] = [
  { label: "Player Damage", value: "On", emphasis: "good" },
  { label: "Ship Damage", value: "On", emphasis: "good" },
  { label: "Infinite Ammo", value: "Off", emphasis: "bad" },
  { label: "Crew Proximity Chat", value: "Off", emphasis: "bad" },
  { label: "Emergent Creatures", value: "Off", emphasis: "bad" },
  { label: "Emergent World Events", value: "Off", emphasis: "bad" },
  { label: "Météo / World Settings", value: "Jour fixe · mer calme" },
  { label: "Legendary Location", value: "Off (régions normales)" },
  { label: "Custom Scoring", value: "On", emphasis: "good" },
];

export const MODES: Mode[] = [
  {
    key: "sloop-2v2",
    name: "Sloop Clash",
    tagline: "2 contre 2",
    ship: "Sloop",
    teamSize: 2,
    tier: "principal",
    format: "Best of 5 (premier à 3 coulages)",
    preset: "Competitive Pirates",
    scoringMethod: "Ship/Crew",
    accent: "brass",
    icon: "swords",
    summary:
      "Le format le plus pur : lecture du vent, gunfight et abordage à deux. Le ladder phare de la plateforme.",
    switches: [
      ...COMMON,
      { label: "Scoring Method", value: "Ship/Crew" },
      { label: "Sink Enemy Ship", value: "+1", emphasis: "good" },
      { label: "Time Limit", value: "25 min (sinon mort subite)" },
      { label: "Override Loadout", value: "No (loadout libre, items bannis au règlement)" },
    ],
  },
  {
    key: "brig-3v3",
    name: "Brigantine Brawl",
    tagline: "3 contre 3",
    ship: "Brigantine",
    teamSize: 3,
    tier: "principal",
    format: "Best of 3",
    preset: "Competitive Pirates",
    scoringMethod: "Ship/Crew",
    accent: "verdigris",
    icon: "anchor",
    summary:
      "Coordination à trois : barre, canons et abordage. Le compromis idéal vitesse / puissance de feu.",
    switches: [
      ...COMMON,
      { label: "Friendly Fire", value: "Off" },
      { label: "Scoring Method", value: "Ship/Crew" },
      { label: "Sink Enemy Ship", value: "+1", emphasis: "good" },
      { label: "Time Limit", value: "30 min" },
    ],
  },
  {
    key: "galleon-4v4",
    name: "Galleon War",
    tagline: "4 contre 4",
    ship: "Galleon",
    teamSize: 4,
    tier: "principal",
    format: "Best of 3",
    preset: "Competitive Pirates",
    scoringMethod: "Ship/Crew",
    accent: "blood",
    icon: "skull",
    summary:
      "La bataille rangée : gestion d'équipage, réparations, voiles et boulets. Le sommet du jeu naval.",
    switches: [
      ...COMMON,
      { label: "Friendly Fire", value: "Off" },
      { label: "Scoring Method", value: "Ship/Crew" },
      { label: "Sink Enemy Ship", value: "+1", emphasis: "good" },
      { label: "Time Limit", value: "35 min · resupply standardisé entre manches" },
    ],
  },
  {
    key: "sniper-ffa",
    name: "Sniper Arena",
    tagline: "FFA — aim pur",
    ship: "Galleon / arène",
    teamSize: 1,
    tier: "secondaire",
    format: "Premier au score · 5 min",
    preset: "Creative",
    scoringMethod: "Player",
    accent: "verdigris",
    icon: "scope",
    summary:
      "Dérivé du « Skeleton Snipe Hunt » du guide, version PvP. Eye of Reach, munitions infinies, que de l'aim.",
    switches: [
      { label: "Player Damage", value: "On", emphasis: "good" },
      { label: "Override Loadout", value: "Yes", emphasis: "good" },
      { label: "Primary Weapon", value: "Eye of Reach" },
      { label: "Secondary Weapon", value: "Flintlock" },
      { label: "Infinite Ammo", value: "On", emphasis: "good" },
      { label: "Custom Scoring", value: "On", emphasis: "good" },
      { label: "Scoring Method", value: "Player" },
      { label: "Defeat Player", value: "+10", emphasis: "good" },
      { label: "Time Limit", value: "300 secondes" },
    ],
  },
  {
    key: "treasure-race",
    name: "Treasure Race",
    tagline: "PvPvE",
    ship: "Sloop / Brig",
    teamSize: 2,
    tier: "secondaire",
    format: "Valeur banquée · 30 min",
    preset: "Competitive Sandbox",
    scoringMethod: "Ship/Crew",
    accent: "brass",
    icon: "chest",
    summary:
      "Deux équipages courent après la plus grosse valeur de trésor rendue. Capture + VOD recommandées.",
    switches: [
      { label: "Player Damage", value: "On", emphasis: "good" },
      { label: "Ship Damage", value: "On", emphasis: "good" },
      { label: "Custom Scoring", value: "On", emphasis: "good" },
      { label: "Scoring Method", value: "Ship/Crew" },
      { label: "Hand in Treasure", value: "= valeur du trésor", emphasis: "good" },
      { label: "Sink Enemy Ship", value: "Bonus" },
      { label: "Time Limit", value: "30 min" },
    ],
  },
];

export const MODE_MAP: Record<string, Mode> = Object.fromEntries(
  MODES.map((m) => [m.key, m]),
);

export function getMode(key: string): Mode | undefined {
  return MODE_MAP[key];
}

/** Joueurs par équipage réellement requis (le sniper FFA forme un pool de 3). */
export function perTeamFor(mode: Mode): number {
  return mode.key === "sniper-ffa" ? 3 : mode.teamSize;
}

/**
 * Taille de groupe maximale pour entrer dans la file d'un mode.
 * Un groupe ne peut pas dépasser la taille d'un équipage ; le sniper FFA
 * se joue en solo.
 */
export function maxPartySize(mode: Mode): number {
  return mode.key === "sniper-ffa" ? 1 : mode.teamSize;
}
