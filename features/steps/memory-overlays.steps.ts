import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { When, Then } = createBdd();

When('I open the memory options menu', async ({ page }) => {
  await page.locator('.board-header__menu-button').click();
});

When('I open the leaderboard dialog', async ({ page }) => {
  await page.getByRole('button', { name: 'Mejores tiempos' }).click();
});

Then('I see the memory options menu', async ({ page }) => {
  await expect(page.locator('.board-menu')).toBeVisible();
  await expect(page.getByText('Opciones')).toBeVisible();
  await expect(page.getByText('Dificultad')).toBeVisible();
});

Then('I see the leaderboard dialog', async ({ page }) => {
  await expect(page.getByText('Ranking actual')).toBeVisible();
});
