import { expect, type Page } from "@playwright/test";

export const registerUser = async (page: Page, username: string) => {
    await page.goto('/');

    await page.context().clearCookies();
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    await page.goto('/register');
    await page.locator('#username').fill(username);
    await page.locator('#email').fill(`${username}@mail.com`);
    await page.locator('#password').fill('password123');
    await page.locator('#password-confirmation').fill('password123');
    await page.locator('#maps-location').fill('Avenida Paulista, 1000');
    const sellerAddress = page.locator('.pac-item').first();
    await sellerAddress.waitFor({ state: 'visible', timeout: 5000 });
    await sellerAddress.click({ force: true }); 
    await page.waitForTimeout(1000);

    const tokenPromise = page.waitForResponse(
    response => response.url().includes('/token/') && response.status() === 200,
    { timeout: 15000 }
    );

    await page.locator('form').getByRole('button', { name: 'Register' }).click();
    await tokenPromise;
    await expect(page.getByText('Account created successfully')).toBeVisible();
    await page.waitForURL('/');
    await expect(page.getByRole('link', { name: 'Login' })).toBeHidden();
};

export const createListing = async (page: Page, title: string, quantity: string) => {
    await page.goto('/create-listing');
    await page.locator('#title').fill(title);
    await page.locator('#quantity').fill(quantity);
    await page.locator('#price').fill('10');

    const listingPromise = page.waitForResponse(
        response => response.status() === 201, {timeout: 15000}
    );

    await page.getByRole('button', {name: 'Create Listing'}).click();
    const response = await listingPromise;
    const responseData = await response.json();

    return responseData;
};

export const randomUsername = async () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};