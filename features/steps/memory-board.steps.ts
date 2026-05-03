import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { When, Then } = createBdd();

When('I open the current memory game picker', async ({ page }) => {
  await page.locator('.board-header__eyebrow--action').click();
  await expect(page.locator('.board-game-picker')).toBeVisible();
});

When('I choose the memory game {string}', async ({ page }, gameName: string) => {
  await page.locator('.board-game-picker__item', { hasText: gameName }).click();
});

When('I reload the page', async ({ page }) => {
  await page.reload();
});

When('I switch to blackjack from the page header', async ({ page }) => {
  await page.locator('.board-header__page-switch').getByRole('button', { name: 'Blackjack', exact: true }).click({ force: true });
});

Then('I see the selected memory game {string}', async ({ page }, gameName: string) => {
  await expect(page.locator('.board-header__eyebrow--action')).toHaveText(gameName);
});
