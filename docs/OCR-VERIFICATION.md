# Vérification automatique par image (OCR)

Un « mini-modèle » de lecture de texte tourne **en local**, sans aucun service externe ni clé API.
Moteur : **tesseract.js** (réseau de neurones LSTM entraîné). Code partagé : [`web/src/lib/ocr.ts`](../web/src/lib/ocr.ts).

## À quoi ça sert

| Usage | Où | Effet |
|---|---|---|
| **Vérifier un pseudo** | Page `/me` (web) + `/inscription` (bot) | On lit la capture, on confirme que le pseudo en jeu y figure → compte « vérifié » ✓ |
| **Vérifier une preuve de score** | Report de match (`/matches/[id]`) | On lit le Scoreboard, on confirme que les deux scores annoncés y figurent → preuve confirmée |

## API de la lib

```ts
recognizeText(image: Buffer | Uint8Array | string): Promise<string>   // texte brut
checkPseudo(text, handle): { ok, confidence, found }                  // pseudo présent ? (tolère 1-2 fautes OCR)
checkScores(text, scoreA, scoreB): { ok, numbersFound }               // les 2 scores présents ?
```

`checkPseudo` normalise (minuscules, sans accents ni symboles) et tolère une à deux erreurs de
lecture (Levenshtein) car l'OCR confond parfois `O/0`, `l/I`, etc.

## Détails techniques

- **Un seul worker** réutilisé entre les appels (le chargement du modèle est coûteux).
- **`serverExternalPackages: ["tesseract.js"]`** dans `next.config.ts` : sans ça, Turbopack bundle
  le moteur et casse le chemin de son worker Node.
- **`cachePath: os.tmpdir()`** : le modèle de langue se télécharge au premier appel et doit
  s'écrire dans un dossier inscriptible (`/tmp` en serverless Vercel).
- Sur Vercel, le premier appel à froid télécharge ~10 Mo de modèle (quelques secondes). Pour un
  trafic important, héberger l'OCR côté **bot** (process long-running) est plus efficace — c'est
  déjà le cas pour `/inscription`.

## Vérifier que ça marche

```bash
cd web && npm run ocr:smoke      # génère une image, la lit, contrôle pseudo + scores
npm run test:e2e                 # inclut un test OCR de bout en bout dans l'app réelle
```

## Limites

L'OCR est une **aide**, pas une preuve infaillible : une capture floue, un pseudo stylisé ou un
overlay peuvent échouer. En cas d'échec, le flux retombe sur la **validation humaine** (staff pour
les matchs, nouvel essai pour le pseudo). Rien n'est jamais validé à tort automatiquement.
