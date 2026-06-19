# Bot Discord — plan d'intégration (phase 2)

La plateforme web est déjà **pensée pour le bot** : la logique métier (former une table,
soumettre un résultat, valider, calculer le MMR) vit dans `web/src/lib/actions.ts` et
`web/src/lib/mmr.ts`, indépendamment de l'UI. Le bot consommera la **même** logique.

## Architecture cible

```
                ┌─────────────────────┐
                │   Base de données   │   (SQLite en dev → Postgres en prod)
                └─────────▲───────────┘
                          │ Prisma
        ┌─────────────────┴──────────────────┐
        │            Couche métier            │   ← partagée
        │  modes · mmr · ranks · actions      │
        └───────▲──────────────────▲──────────┘
                │                  │
   ┌────────────┴───────┐   ┌──────┴───────────────┐
   │   App web (Next)   │   │   Bot Discord (JS)   │
   │   profils, ladder  │   │   /file /report …    │
   └────────────────────┘   └──────────────────────┘
```

Pour partager la couche métier, on extraira `lib/{modes,mmr,ranks}.ts` (logique pure, déjà
sans dépendance Next) dans un petit package `packages/core`, importé par le web **et** le bot.
`actions.ts` (qui dépend de `next`) sera dédoublé en services purs côté core.

## Stack proposée

- **discord.js v14** + **slash commands**.
- Auth : **Discord OAuth** côté web (Auth.js / NextAuth, provider Discord) — le `discordId`
  est déjà une colonne du modèle `Player`. Le compte web et le compte bot sont donc le même.
- Hébergement bot : process Node séparé (Railway / Fly / VPS), même base que le web.

## Commandes slash (MVP)

| Commande | Rôle | Effet |
|---|---|---|
| `/inscription <pseudo>` | joueur | crée le `Player` (lié au `discordId`) |
| `/file <mode>` | joueur | rejoint la file du mode → annonce dans le salon |
| `/quitter` | joueur | quitte la file |
| `/table` | auto | quand la file est pleine : tire les équipages, crée le match, poste le **Join Code** et les réglages imposés |
| `/report <a> <b> [preuve]` | host | renseigne le score + la capture → passe en *à valider* |
| `/valider <id>` | staff | applique le MMR, met à jour le ladder |
| `/litige <id> <raison>` | staff | ouvre un litige |
| `/profil [@joueur]` | joueur | embed du rang, MMR, W/L |
| `/ladder <mode>` | tous | top 10 du mode |

## Flux d'un match (identique au web)

1. `/file sloop-1v1` → le bot ajoute le joueur à une **file en mémoire/Redis** par mode.
2. File pleine → le bot appelle `formTable(mode)` (core) → embed avec Join Code + Switches.
3. Le host joue, fait `/report 3 1 <url>` → `submitResult(...)`.
4. Un staff fait `/valider <id>` → `validateMatch(...)` → MMR recalculé, ladder web à jour
   instantanément (même base).

## Salons recommandés

- `#files-d-attente` — embeds des files en cours et des tables formées.
- `#résultats` — log automatique des matchs validés (réutilise le rendu du *journal de bord*).
- `#litiges` — réservé au staff.
- Rôles Discord synchronisés au rang (Mousse, Matelot, Corsaire…) via le MMR.

> Rien à réécrire côté règles : les modes et leurs réglages viennent de `lib/modes.ts`,
> la source de vérité unique pour le web **et** le bot.
