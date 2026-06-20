import { test, expect } from "@playwright/test";

// Vérifie que chaque page publique répond et affiche son titre.
const ROUTES: { path: string; heading: RegExp }[] = [
  { path: "/", heading: /La mer a enfin/i },
  { path: "/me", heading: /Mon profil/i },
  { path: "/teams", heading: /Classement des équipages/i },
  { path: "/archives", heading: /Archives des saisons/i },
  { path: "/modes", heading: /Modes/i },
  { path: "/play", heading: /Rejoindre une file/i },
  { path: "/friends", heading: /Amis/i },
  { path: "/events", heading: /Événements/i },
  { path: "/partners", heading: /Partenaires Twitch/i },
  { path: "/donate", heading: /Soutenir la plateforme/i },
  { path: "/propose", heading: /Proposer un mode/i },
  { path: "/admin", heading: /Espace staff/i },
  { path: "/ladder/sloop-2v2", heading: /Sloop Clash/i },
];

for (const { path, heading } of ROUTES) {
  test(`page ${path} charge`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status(), `status de ${path}`).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
    // l'en-tête de marque est toujours présent
    await expect(page.getByText("CUSTOM SEAS").first()).toBeVisible();
  });
}
