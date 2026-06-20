// Mini "modèle" OCR : lit le texte d'une image (capture in-game) côté serveur.
// Moteur : tesseract.js (réseau LSTM entraîné, 100% local, aucun service externe).
// Sert à deux choses : vérifier un pseudo et contrôler une preuve de score.

import os from "node:os";
import { createWorker, type Worker } from "tesseract.js";

// Un seul worker réutilisé entre les appels (le chargement du modèle est coûteux).
let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    // "eng" suffit pour des pseudos latins et des chiffres.
    // cachePath -> dossier inscriptible (indispensable en serverless type Vercel : /tmp).
    workerPromise = createWorker("eng", 1, { cachePath: os.tmpdir() });
  }
  return workerPromise;
}

/** Reconnaît le texte brut d'une image (Buffer/Uint8Array ou data URL). */
export async function recognizeText(image: Buffer | Uint8Array | string): Promise<string> {
  const worker = await getWorker();
  const input = image instanceof Uint8Array ? Buffer.from(image) : image;
  const { data } = await worker.recognize(input);
  return data.text ?? "";
}

/** Normalise pour comparaison robuste : minuscules + alphanumérique only. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents (diacritiques combinants)
    .replace(/[^a-z0-9]/g, "");
}

/** Distance de Levenshtein (pour tolérer une lettre mal lue par l'OCR). */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const prev = Array.from({ length: n + 1 }, (_, i) => i);
  const curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

export type PseudoCheck = { ok: boolean; confidence: number; found: string | null };

/**
 * Vérifie qu'un pseudo apparaît dans le texte OCR. Tolère 1 erreur de lecture
 * pour les pseudos d'au moins 4 caractères (l'OCR confond parfois O/0, l/I…).
 */
export function checkPseudo(text: string, handle: string): PseudoCheck {
  const target = norm(handle);
  if (!target) return { ok: false, confidence: 0, found: null };

  const haystack = norm(text);
  if (haystack.includes(target)) return { ok: true, confidence: 1, found: handle };

  // tolérance : on glisse une fenêtre de la taille du pseudo sur le texte
  const tolerance = target.length >= 6 ? 2 : target.length >= 4 ? 1 : 0;
  let best = Infinity;
  for (let i = 0; i + target.length <= haystack.length; i++) {
    const window = haystack.slice(i, i + target.length);
    const d = levenshtein(window, target);
    if (d < best) best = d;
    if (best === 0) break;
  }
  if (best <= tolerance) {
    return { ok: true, confidence: 1 - best / target.length, found: handle };
  }
  return { ok: false, confidence: 0, found: null };
}

export type ScoreCheck = { ok: boolean; numbersFound: number[] };

/**
 * Contrôle qu'une preuve de score contient bien les deux scores annoncés.
 * Best-effort : si les deux nombres sont présents dans le texte, on considère
 * la preuve cohérente (auto-validation possible côté staff).
 */
export function checkScores(text: string, scoreA: number, scoreB: number): ScoreCheck {
  const numbers = (text.match(/\d+/g) ?? []).map(Number);
  const set = new Set(numbers);
  const ok = set.has(scoreA) && set.has(scoreB);
  return { ok, numbersFound: numbers };
}

/** Libère le worker (utile en fin de script ; inutile en serveur long-running). */
export async function terminateOcr(): Promise<void> {
  if (workerPromise) {
    const w = await workerPromise;
    await w.terminate();
    workerPromise = null;
  }
}
