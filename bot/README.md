# Bot Discord — Custom Seas Lounge

Bot officiel : inscription des pirates, profils, ladder, et synchronisation des rôles de rang.
Il partage **la même base de données** que le site web (Postgres Neon) — un joueur inscrit via
le bot apparaît instantanément sur le site, et inversement.

## Stack
- **discord.js v14** (commandes slash)
- **Prisma** (client généré depuis `../web/prisma/schema.prisma`)
- **tsx** (exécution TypeScript directe, pas de build)

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
cd bot
cp .env.example .env       # puis remplis les 4 valeurs
npm install
npm run prisma:generate    # génère le client Prisma depuis le schéma du web
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
| `/inscription <pseudo>` | lie ton compte Discord à ton pseudo Sea of Thieves (crée le `Player` si besoin) |
| `/profil [@joueur]` | embed du rang, MMR, bilan, équipage |
| `/ladder <mode>` | top 10 du mode |

L'inscription assigne automatiquement le **rôle de rang** correspondant au MMR (si déjà classé).

## Hébergement
Process Node séparé du site, sur la même base. Railway / Fly.io / VPS conviennent.
Commande de démarrage : `npm run start`. Pense à lancer `npm run prisma:generate` au build.

## Pour aller plus loin (roadmap)
Le flux complet `/file → table → /report → /valider` est décrit dans
[`../docs/DISCORD-BOT.md`](../docs/DISCORD-BOT.md). La logique métier (MMR, formation des tables)
existe déjà côté web dans `web/src/lib/` et sera factorisée en service partagé.
