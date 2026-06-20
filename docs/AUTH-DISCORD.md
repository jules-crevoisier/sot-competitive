# Connexion Discord (OAuth2) — côté site web

Login Discord maison (aucune dépendance), avec session signée HMAC en cookie httpOnly.
Code : [`web/src/lib/auth.ts`](../web/src/lib/auth.ts), routes `web/src/app/api/auth/*`, page `/login`.

## Règle d'accès

Pour se connecter, l'utilisateur doit :
1. **être membre du serveur Discord** requis (vérifié via le scope `guilds`), et
2. **avoir un compte déjà lié** — créé via le bot `/inscription <pseudo>` avec capture vérifiée par OCR.

S'il n'a pas de compte lié → message l'invitant à s'inscrire d'abord sur le Discord.

## Activation

L'auth s'active **automatiquement dès que `DISCORD_CLIENT_ID` + `DISCORD_CLIENT_SECRET` sont définis**.
Sans eux (dev local / CI), l'auth est désactivée et le **sélecteur de pirate dev** reste actif —
pratique pour développer et faire tourner les tests E2E.

## Configuration

### 1. Discord Developer Portal
- Même application que le bot. Onglet **OAuth2** :
  - Copie **Client ID** et **Client Secret**.
  - Ajoute les **Redirects** :
    - `http://localhost:3000/api/auth/callback` (local)
    - `https://TON-DOMAINE/api/auth/callback` (prod Vercel)

### 2. Variables d'environnement (`web/.env` en local, réglages Vercel en prod)
```
DISCORD_CLIENT_ID="..."
DISCORD_CLIENT_SECRET="..."
DISCORD_GUILD_ID="..."        # serveur requis (vide = aucun contrôle d'appartenance)
AUTH_SECRET="..."             # openssl rand -hex 32
AUTH_BASE_URL="https://TON-DOMAINE"   # http://localhost:3000 en local
```

## Flux

```
/login → bouton "Se connecter avec Discord"
  → GET /api/auth/discord     (pose un state anti-CSRF, redirige vers Discord)
  → Discord authorize         (scopes: identify guilds)
  → GET /api/auth/callback     (vérifie state, échange le code, contrôle l'appartenance
                                au serveur, retrouve le Player par discordId, ouvre la session)
  → /me
Déconnexion : POST /api/auth/logout
```

## Sécurité
- Session = `base64url(payload).hmacSHA256` signé avec `AUTH_SECRET`, cookie **httpOnly + sameSite=lax**
  (+ `secure` en prod), comparaison de signature à temps constant, expiration 30 j.
- `state` anti-CSRF en cookie httpOnly court (10 min).
- Aucune donnée Discord sensible stockée : on ne garde que le `discordId` (déjà dans `Player`).

## Limite connue
Le contrôle d'appartenance au serveur utilise la liste des serveurs de l'utilisateur (scope `guilds`).
Pour lire en plus le pseudo Discord *dans* le serveur (nickname), il faudrait le scope
`guilds.members.read` — non nécessaire ici puisque le pseudo en jeu vient de l'inscription bot.
