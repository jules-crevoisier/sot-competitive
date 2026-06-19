# Custom Seas — Modes Ranked & Réglages (Saison 20)

> Référence des modes compétitifs jouables via **Custom Seas**, avec les *Switches* exacts à
> imposer. Tout le classement vit **hors-jeu** (Custom Seas ne sauvegarde aucune progression et
> n'a pas de matchmaking) — la plateforme gère file d'attente, formation des tables, settings
> imposés, soumission + validation des résultats, MMR et ladder. Modèle inspiré de **MK8DX Lounge**.

## Principe de fairness

Custom Seas fige les *Switches* au lancement de la session : on standardise donc **avant** le
coup d'envoi. Pour chaque match ranked :

1. Un **Host** (joueur désigné par la plateforme, rôle « tabler » à la MK Lounge) crée la session
   avec le **preset du mode** et publie le **Join Code (5 caractères)** sur la page du match.
2. Les joueurs check-in, rejoignent via le code, vérifient les Switches affichés dans le Lobby.
3. Match joué. **Capture du Scoreboard final** obligatoire comme preuve.
4. Résultat soumis → confirmé par les deux camps **ou** validé par un arbitre/staff.
5. Litige → file de **validation** (staff avec Free Camera comme GM neutre si besoin).

Réglages communs à tous les modes PvP ranked (sauf mention contraire) :

| Switch | Valeur | Raison |
|---|---|---|
| Player Damage | **On** | combat réel |
| Ship Damage | **On** | naval |
| Infinite Ammo | **Off** | la gestion des ressources fait partie du skill |
| Crew Proximity Chat | **Off** | comms via Discord, pas de fuite d'info |
| Emergent Creatures (Megalodon, Kraken, Skeleton Ships) | **Off** | zéro interférence PvE |
| Emergent World Events | **Off** | idem |
| World Settings — Météo | **Calme, jour fixe, pas de tempête/brouillard** | conditions égales |
| Legendary Location | **Off** (régions normales) | cartes connues |
| Scoring | **Custom Scoring On** | détermine le vainqueur |

---

## Ladders principaux

### 1. Sloop Duel — 1v1 (ladder phare)

Le format le plus pur : duel de sloops, lecture du vent et de l'eau, gunfight, board.

- **Crews** : 2 navires (1 Sloop chacun), 1 joueur par navire.
- **Preset de base** : Competitive Pirates.
- **Scoring** : Method = **Ship/Crew** · *Sink Enemy Ship* = **+1** · **Best of 5** (premier à 3 coulages).
- **Time Limit** : 25 min (si égalité au temps → mort subite : prochain coulage gagne).
- **Loadout** : libre, **items bannis** : Fire Bombs en quantité, Blunderbomb spam (cf. règlement). Override Loadout = *No*.

### 2. Brigantine Brawl — 2v2

- **Crews** : 2 Brigs, 2 joueurs chacun.
- **Friendly Fire** : Off.
- **Scoring** : Ship/Crew · *Sink Enemy Ship* = **+1** · **Best of 3**.
- **Time Limit** : 30 min.

### 3. Galleon War — 3v3 / 4v4

- **Crews** : 2 Galleons, 3 ou 4 joueurs chacun.
- **Friendly Fire** : Off.
- **Scoring** : Ship/Crew · *Sink Enemy Ship* = **+1** · **Best of 3**.
- **Time Limit** : 35 min. Resupply standardisé par le Host via Command Menu entre les manches.

---

## Ladders secondaires (fun / saisonniers)

### 4. Sniper Arena — FFA (dérivé du « Skeleton Snipe Hunt » du guide, version PvP)

- **Setup** : tous sur un même Galleon ou sur une arène fermée (Legendary Location possible).
- **Override Loadout** : Yes · Primary = **Eye of Reach** · Secondary = **Flintlock**.
- **Infinite Ammo** : On (ladder d'aim pur).
- **Scoring** : Method = **Player** · *Defeat Player* = **+10** · Time Limit = **300 s** · premier au score.

### 5. Treasure Race — PvPvE (Competitive Sandbox)

- **Preset** : Competitive Sandbox.
- 2 crews, banque le plus de valeur de trésor dans le temps imparti.
- **Scoring** : *Hand in Treasure* = valeur · *Sink Enemy Ship* = bonus · Time Limit = 30 min.
- Validation plus délicate (PvE) → ladder secondaire, capture scoreboard + VOD recommandée.

---

## Cartographie Switch → preset officiel

| Mode | Preset officiel de départ | Scoring Method |
|---|---|---|
| Sloop Duel 1v1 | Competitive Pirates | Ship/Crew |
| Brigantine Brawl 2v2 | Competitive Pirates | Ship/Crew |
| Galleon War 3v3/4v4 | Competitive Pirates | Ship/Crew |
| Sniper Arena FFA | Creative (tout off, on configure) | Player |
| Treasure Race | Competitive Sandbox | Ship/Crew |

Ces réglages sont aussi encodés dans la plateforme (`web/src/lib/modes.ts`) pour être affichés
joueur-side sur chaque page de match.
