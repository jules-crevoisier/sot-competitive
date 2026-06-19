# Custom Seas Lounge ⚓

Plateforme de **classement compétitif (ranked)** pour **Sea of Thieves**, basée sur le mode
**Custom Seas** introduit en Saison 20. Comme le jeu n'a ni matchmaking ni progression
sauvegardée dans ce mode, tout le classement vit **hors-jeu** — exactement le modèle qu'a bâti
la communauté **Mario Kart 8 DX (Lounge)**, transposé à la piraterie.

> File d'attente → table équilibrée → session Custom Seas avec réglages imposés → report du
> résultat avec preuve → validation → recalcul du MMR → ladder.

## Ce qu'il y a dans le dépôt

| Dossier | Contenu |
|---|---|
| `web/` | L'application web (Next.js 16, React 19, Tailwind v4, Prisma + SQLite). |
| `docs/MODES-RANKED.md` | Les modes ranked et les **réglages Custom Seas exacts** à imposer. |
| `docs/DISCORD-BOT.md` | Le plan d'intégration du **bot Discord** (phase 2). |

## Fonctionnalités (déjà fonctionnelles)

- 🎯 **5 ladders** : Sloop Duel 1v1, Brigantine Brawl 2v2, Galleon War 3v3/4v4 (principaux),
  Sniper Arena FFA et Treasure Race (secondaires) — chacun avec ses réglages imposés.
- 🌊 **File d'attente** interactive qui forme une vraie table et ouvre une session.
- 🏴‍☠️ **Boucle de validation hors-jeu** : Join Code, réglages affichés, report du score +
  preuve (capture du Scoreboard), validation staff, mise en litige.
- 📈 **Moteur MMR** type ELO par équipe (K élevé en placement, plancher de gain/perte, bonus de
  domination), **rangs** pirates (Mousse → Légende des Mers), profils avec courbe de MMR.
- 🛡️ **Espace staff** : file de validation, validation en un clic, litiges.
- 🎨 **Direction artistique sur-mesure** : palette abysses / laiton / parchemin, double serif
  type affiche de film, ornements et textures faits main (zéro asset externe).

## Démarrer

```bash
cd web
npm install
npm run db:reset   # crée la base SQLite + données de démo (24 pirates, ~230 matchs)
npm run dev        # http://localhost:3000
```

Scripts utiles : `npm run db:seed` (re-seed), `npm run db:studio` (explorer la base),
`npm run build` (build de prod).

## Architecture (prête pour le bot)

La logique métier est isolée de l'UI dans `web/src/lib/` :

- `modes.ts` — **source de vérité** des modes et de leurs Switches (web + futur bot).
- `mmr.ts` — moteur de classement (pur, testable).
- `ranks.ts` — échelle de rangs.
- `actions.ts` — opérations serveur : `formTable`, `submitResult`, `validateMatch`, `disputeMatch`.

Le bot Discord (phase 2) réutilisera **la même** couche métier et la même base — voir
[docs/DISCORD-BOT.md](docs/DISCORD-BOT.md).

## Stack

Next.js 16 (App Router, server actions) · React 19 · Tailwind CSS v4 · Prisma 6 · SQLite
(→ Postgres en prod) · `next/font` (Cinzel + Spectral).

---

Projet communautaire, **non affilié** à Rare ni à Microsoft. *Sea of Thieves* est une marque du
groupe Microsoft.
