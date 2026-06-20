import { test, expect } from "@playwright/test";

// Vérifie la section saison de l'admin SANS muter la base : on soumet une
// confirmation incorrecte → l'action est annulée (garde-fou), aucun reset réel.
test("admin : la section saison s'affiche et refuse une confirmation incorrecte", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: /Saison \d+ en cours/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Réinitialiser la saison/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Démarrer la saison/i })).toBeVisible();

  // formulaire de reset : confirmation volontairement fausse
  const resetForm = page.locator("form").filter({ hasText: /Réinitialiser les MMR/i });
  await resetForm.getByPlaceholder("RESET").fill("pas-bon");
  await resetForm.getByRole("button", { name: /Réinitialiser la saison/i }).click();

  await expect(page.getByText(/Confirmation incorrecte/i)).toBeVisible();
});
