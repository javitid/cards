import { expect, Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

async function seedAuthenticatedSession(page: Page, username = 'e2e.user@cards.test') {
  await page.addInitScript((seedUsername) => {
    window.sessionStorage.setItem('cards:e2e-auth', 'true');
    window.sessionStorage.setItem('token', 'e2e-token');
    window.sessionStorage.setItem('username', seedUsername);
    window.localStorage.setItem('sound', 'false');
  }, username);
}

Given('I am on the login page', async ({ page }) => {
  await page.goto('/#/login');
});

Given('I have a seeded authenticated session', async ({ page }) => {
  await seedAuthenticatedSession(page);
});

When('I open the memory board', async ({ page }) => {
  await page.goto('/#/game');
});

When('I open the blackjack board', async ({ page }) => {
  await page.goto('/#/blackjack');
});

Then('I see the login actions', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar como invitado' })).toBeVisible();
});

Then('I see the memory board', async ({ page }) => {
  await expect(page).toHaveURL(/#\/game/);
  await expect(page.locator('.board-shell')).toBeVisible();
  await expect(page.locator('.card').first()).toBeVisible();
});
