import { test, expect } from "@playwright/test";

// Soumission d'une proposition de mode (server action + DB), puis affichage dans la liste.
test("proposer un mode l'ajoute à la liste", async ({ page }) => {
  const name = `Mode E2E ${Date.now()}`;

  await page.goto("/propose");
  await page.fill('input[name="name"]', name);
  await page.fill('textarea[name="pitch"]', "Format de test automatisé : capture de zone à 3v3.");
  await page.getByRole("button", { name: /Envoyer la proposition/i }).click();

  await expect(page.getByText(name)).toBeVisible();
});

// Navigation vers une page d'équipage et présence de la section membres.
test("la page d'un équipage affiche ses membres", async ({ page }) => {
  await page.goto("/teams");
  await expect(page.getByRole("heading", { name: /Les équipages/i })).toBeVisible();

  const firstTeam = page.locator('a[href^="/teams/"]').first();
  await expect(firstTeam).toBeVisible();
  await firstTeam.click();

  await expect(page.getByText(/Le rôle d'équipage/i)).toBeVisible();
});
