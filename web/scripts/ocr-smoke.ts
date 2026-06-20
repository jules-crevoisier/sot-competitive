// Vérifie de bout en bout que l'OCR lit bien un pseudo et des scores.
// Génère une image avec Chromium (Playwright), puis la passe dans lib/ocr.
import { chromium } from "@playwright/test";
import { recognizeText, checkPseudo, checkScores, terminateOcr } from "../src/lib/ocr";

const HANDLE = "Blackwater";
const SCORE_A = 3;
const SCORE_B = 1;

const html = `<!doctype html><html><body style="margin:0;background:#10202c;width:900px;height:520px;font-family:Arial,Helvetica,sans-serif">
  <div style="padding:60px;color:#f4ecd8">
    <div style="font-size:30px;letter-spacing:2px;color:#c8a24b">SEA OF THIEVES — SCOREBOARD</div>
    <div style="margin-top:40px;font-size:64px;font-weight:bold">${HANDLE}</div>
    <div style="margin-top:30px;font-size:48px">Crew A ${SCORE_A}  -  ${SCORE_B} Crew B</div>
  </div>
</body></html>`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 520 } });
  await page.setContent(html);
  const buf = await page.screenshot();
  await browser.close();

  console.log("→ OCR en cours…");
  const text = await recognizeText(buf);
  console.log("Texte lu :", JSON.stringify(text.replace(/\s+/g, " ").trim()));

  const pseudo = checkPseudo(text, HANDLE);
  const scores = checkScores(text, SCORE_A, SCORE_B);
  console.log(`Pseudo "${HANDLE}" trouvé :`, pseudo.ok, `(confiance ${pseudo.confidence.toFixed(2)})`);
  console.log(`Scores ${SCORE_A}-${SCORE_B} trouvés :`, scores.ok, "| nombres:", scores.numbersFound.join(","));

  await terminateOcr();
  const passed = pseudo.ok && scores.ok;
  console.log(passed ? "\n✅ OCR OK" : "\n❌ OCR a échoué");
  process.exit(passed ? 0 : 1);
}

main();
