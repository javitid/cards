import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { When, Then } = createBdd();

When('I deal a blackjack round', async ({ page }) => {
  await page.getByRole('button', { name: 'Repartir' }).click();
});

When('I open the blackjack game picker', async ({ page }) => {
  await page.locator('.blackjack-topbar__title').click();
  await expect(page.locator('.blackjack-game-picker')).toBeVisible();
});

When('I choose memory from the blackjack picker', async ({ page }) => {
  await page.locator('.blackjack-game-picker__item').filter({ hasText: 'Memoria' }).click({ force: true });
});

Then('I see the blackjack table', async ({ page }) => {
  await expect(page).toHaveURL(/#\/blackjack/);
  await expect(page.locator('.blackjack-table')).toBeVisible();
});

Then('I see the blackjack controls', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Repartir' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reiniciar mesa' })).toBeVisible();
});

Then('I see blackjack cards on the table', async ({ page }) => {
  await expect(page.locator('.playing-card').first()).toBeVisible();
});
