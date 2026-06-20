# Bot Discord — Custom Seas Lounge

Bot officiel : inscription des pirates, profils, ladder, et synchronisation des rôles de rang.
Il partage **la même base de données** que le site web (Postgres Neon) — un joueur inscrit via
le bot apparaît instantanément sur le site, et inversement.

## Stack
- **discord.js v14** (commandes slash)
- **tsx** (exécution TypeScript directe, pas de build)
- Réutilise la couche du site (`../web/src/lib`) : client Prisma, OCR, barèmes
  rangs/modes. Aucune duplication — le bot est une fine couche Discord sur le même code.

## Mise en route

### 1. Créer l'application + le bot
1. [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. Onglet **Bot** → **Reset Token** → copie le jeton.
3. Onglet **Bot** → active **Server Members Intent** (nécessaire pour les rôles).
4. Onglet **OAuth2 → URL Generator** : scopes `bot` + `applications.commands` ;
   permissions `Manage Roles`, `Manage Channels`, `Send Messages`, `Embed Links`.
   Ouvre l'URL générée pour **inviter le bot** sur ton serveur.

### 2. Configurer
```bash
# le site doit être installé et son client Prisma généré (le bot le réutilise)
cd web && npm install && npx prisma generate && cd ../bot

cp .env.example .env       # puis remplis les 4 valeurs
npm install
```
`DATABASE_URL` doit être **exactement la même** que celle de Vercel / Neon.

### 3. Construire le serveur (rôles + salons)
> Le bot doit avoir le rôle le plus haut possible dans la hiérarchie pour gérer les rôles.
```bash
npm run setup-server       # crée rôles de rang, catégories et salons (idempotent)
```

### 4. Déclarer les commandes puis lancer
```bash
npm run deploy             # enregistre /inscription /profil /ladder sur le serveur
npm run dev                # lance le bot (watch)
```

## Commandes
| Commande | Effet |
|---|---|
| `/inscription <pseudo> <preuve>` | OCR de la capture → vérifie le pseudo, lie le compte Discord, marque « vérifié » |
| `/profil [@joueur]` | embed du rang, MMR, bilan, équipage |
| `/ladder <mode>` | top 10 du mode |

`/inscription` exige une **capture où le pseudo est lisible** : le bot la lit automatiquement
(OCR, via `web/src/lib/ocr.ts`) et refuse l'inscription si le pseudo n'y figure pas. Le rôle de
rang correspondant au MMR est attribué dans la foulée.

## Hébergement
Process Node séparé du site, sur la même base. Railway / Fly.io / VPS conviennent.
Commande de démarrage : `npm run start`. Pense à lancer `npm run prisma:generate` au build.

## Pour aller plus loin (roadmap)
Le flux complet `/file → table → /report → /valider` est décrit dans
[`../docs/DISCORD-BOT.md`](../docs/DISCORD-BOT.md). La logique métier (MMR, formation des tables)
existe déjà côté web dans `web/src/lib/` et sera factorisée en service partagé.
