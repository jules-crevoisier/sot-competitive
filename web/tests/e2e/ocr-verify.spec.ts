import { test, expect, chromium } from "@playwright/test";

// Flux complet de vérification OCR dans l'app réelle :
// 1) on lit le pseudo courant sur /me, 2) on fabrique une capture qui le contient,
// 3) on l'upload, 4) le serveur lit l'image (OCR) et le compte passe « vérifié ».
test("vérification du pseudo par capture (OCR) de bout en bout", async ({ page }) => {
  await page.goto("/me");
  const handle = await page.inputValue('input[name="handle"]');
  expect(handle.length).toBeGreaterThan(1);

  // fabrique une image contenant le pseudo
  const browser = await chromium.launch();
  const shotPage = await browser.newPage({ viewport: { width: 800, height: 400 } });
  await shotPage.setContent(
    `<body style="margin:0;background:#10202c;color:#f4ecd8;font-family:Arial">
       <div style="padding:60px;font-size:64px;font-weight:bold">${handle}</div>
     </body>`,
  );
  const buffer = await shotPage.screenshot();
  await browser.close();

  // le compte n'est pas forcément déjà vérifié ; si la carte d'upload est absente, on
  // considère le pseudo déjà vérifié (badge présent)
  const uploadInput = page.locator('input[name="shot"]');
  if (await uploadInput.count()) {
    await uploadInput.setInputFiles({ name: "proof.png", mimeType: "image/png", buffer });
    await page.getByRole("button", { name: /^Vérifier$/ }).click();
    // succès = bannière dédiée (l'OCR a retrouvé le pseudo dans l'image)
    await expect(page.getByText(/bienvenue parmi les pirates confirmés/i)).toBeVisible({ timeout: 60_000 });
  }
  // le badge « vérifié » est présent dans tous les cas une fois le compte confirmé
  await expect(page.getByText("✓ Pseudo vérifié")).toBeVisible();
});
