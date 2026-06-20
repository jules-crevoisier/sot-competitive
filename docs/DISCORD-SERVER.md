# Template de serveur Discord — Custom Seas Lounge

Deux façons de monter le serveur :

- **Automatique** (recommandé) : le bot crée rôles + salons → `cd bot && npm run setup-server`
  (cf. [`bot/README.md`](../bot/README.md)).
- **Manuel** : reproduis la structure ci-dessous.

---

## 1. Rôles (du plus haut au plus bas)

| Rôle | Couleur | Qui | Permissions clés |
|---|---|---|---|
| **Amiral** | or `#e6c168` | Toi / fondateurs | Administrateur |
| **Quartier-maître** | vert-de-gris `#3fa796` | Arbitres / staff | Gérer salons, exclure, voir `#litiges` |
| **Partenaire** | violet Twitch `#9146ff` | Streamers mis en avant | Mentionnable |
| **Légende des Mers** | `#c9463c` | rang MMR ≥ 2600 | — |
| **Capitaine** | `#e6c168` | MMR ≥ 2300 | — |
| **Corsaire** | `#c8a24b` | MMR ≥ 2000 | — |
| **Maître d'équipage** | `#3fa796` | MMR ≥ 1750 | — |
| **Matelot** | `#b9c2c4` | MMR ≥ 1500 | — |
| **Mousse** | `#9c7b46` | MMR ≥ 1300 | — |
| **Fond de cale** | `#6b7b80` | nouveaux | — |

> Les rôles de rang sont attribués **automatiquement par le bot** selon le MMR
> (source : `web/src/lib/ranks.ts`). Ne les assigne pas à la main.

## 2. Salons

```
📜 ACCUEIL
  # règlement          (lecture seule)
  # annonces           (lecture seule)
  # inscription        → on tape /inscription <pseudo in-game> ici
  # présentation

🏴 COMPÉTITION
  # files-d-attente    (embeds des files / tables formées)
  # résultats          (log auto des matchs validés)
  # litiges            (staff uniquement)
  # ladder

💬 COMMUNAUTÉ
  # général
  # recherche-équipage
  # clips-et-vods
  # propositions-de-modes

🎙️ SALONS VOCAUX
  🔊 Taverne
  🔊 Sloop 2v2
  🔊 Brigantine 3v3
  🔊 Galion 4v4
```

## 3. Parcours d'un nouveau membre (onboarding)

1. Il arrive → lit `#règlement`, accepte.
2. Dans `#inscription` : `/inscription <son pseudo Sea of Thieves>`.
   → le bot crée/lie son compte (le même que sur le site) et lui donne le rôle **Fond de cale**.
3. Il peut alors faire la file dans `#files-d-attente` et compléter son profil sur le site.
4. Au fil des matchs validés, le bot fait monter son rôle de rang automatiquement.

> **C'est exactement la règle que tu voulais** : être sur le serveur **et** inscrit via le bot
> avec son pseudo in-game lié, sinon pas d'accès à la compétition.

## 4. Texte de règlement (à coller dans #règlement)

```
🏴‍☠️ RÈGLEMENT — CUSTOM SEAS LOUNGE

1. Respect total entre pirates. Toxicité = sanction.
2. Inscris-toi avec ton VRAI pseudo en jeu : /inscription <pseudo>.
3. Un seul compte par personne. Le smurf est interdit.
4. Les matchs se jouent avec les réglages imposés (voir le site, page Modes).
5. Capture le Scoreboard final : c'est ta preuve en cas de litige.
6. Triche, item banni, no-show → litige + sanction du staff.
7. Les décisions des Quartier-maîtres sont finales.

En restant sur ce serveur, tu acceptes ce règlement. Bon vent ⚓
```

## 5. Réglages serveur conseillés

- **Niveau de vérification** : Moyen (compte vérifié + ancienneté).
- **Onboarding Discord** (Paramètres → Onboarding) : marque `#inscription` comme étape obligatoire.
- **AutoMod** : filtre anti-spam de liens + insultes.
- Synchronise le rôle **Partenaire** avec la page Partenaires Twitch du site.

## 6. Partager le serveur comme modèle réutilisable

Une fois le serveur monté : **Paramètres du serveur → Modèle de serveur → Générer un code**.
Tu obtiens un lien `discord.new/...` qui recrée toute la structure (salons + rôles, sans les
messages ni les membres) en un clic — pratique pour un serveur de test ou une refonte.
