import { test, expect } from "@playwright/test";

// Round-trip réel : édite la bio via le server action, vérifie la persistance
// puis l'affichage sur la page publique du pirate.
test("édition du profil persiste et s'affiche en public", async ({ page }) => {
  const bio = `Bio E2E ${Date.now()}`;

  await page.goto("/me");
  await expect(page.getByRole("heading", { name: /Mon profil/i })).toBeVisible();
  const original = await page.inputValue('textarea[name="bio"]'); // pour restaurer après

  await page.fill('textarea[name="bio"]', bio);
  await page.getByRole("button", { name: /Enregistrer le profil/i }).click();

  // bannière de succès + url ok=1
  await expect(page.getByText(/Profil enregistré/i)).toBeVisible();
  await expect(page).toHaveURL(/ok=1/);

  // la bio doit apparaître sur la page publique
  await page.getByRole("link", { name: /Voir ma page publique/i }).click();
  await expect(page.getByText(bio)).toBeVisible();

  // on remet la bio d'origine pour ne pas polluer la base
  await page.goto("/me");
  await page.fill('textarea[name="bio"]', original);
  await page.getByRole("button", { name: /Enregistrer le profil/i }).click();
  await expect(page).toHaveURL(/ok=1/);
});
