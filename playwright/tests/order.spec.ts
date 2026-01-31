import { test, expect } from '@playwright/test';
import path from 'path';
import fs  from 'fs';

const AUTH_DIR = path.join(__dirname, '../.auth');

test('Create order', async ({ browser }) => {
    const metadata = JSON.parse(fs.readFileSync('test-metadata.json', 'utf-8'));
    const { listingId, listingTitle } = metadata;

    if (!listingId || !listingTitle) throw new Error('Missing listing metadata');

    const buyerContext = await browser.newContext({ storageState: path.join(AUTH_DIR, 'buyer.json') });
    const page = await buyerContext.newPage();

    // Open listing
    await page.goto(`/listings/${listingId}`);
    await expect(page).toHaveTitle(new RegExp(listingTitle));
    await expect(page.locator('main').getByRole('heading', { level: 1 })).toContainText(new RegExp(listingTitle));

    // Add to cart
    await page.getByRole('button', { name: 'Add to Cart' }).click();
    await expect(page).toHaveURL(/nginx\/cart/);

    // Click on confirm
    await page.getByRole('button', { name: 'Confirm and Pay' }).click();
    await expect(page).toHaveURL(/nginx\/checkout/);
    await expect(page.getByText('Complete Your Purchase')).toBeVisible();

    // Handle stripe form
    const cardFrame = page.frameLocator('.StripeElement iframe');
    await cardFrame.locator('input[name="number"]').fill('4242'.repeat(4));
    await cardFrame.locator('input[name="expiry"]').fill('12/26');
    await cardFrame.locator('input[name="cvc"]').fill('123');
    const postalCode = cardFrame.locator('input[name="postalCode"]');
    if (await postalCode.isVisible()) {
        await postalCode.fill('90210');
    }

    // Click on pay
    await page.getByRole('button', {name: /pay now/i }).click();

    // Await for redirect
    await expect(page).toHaveURL(/\/order\/[0-9a-f-]+/, { timeout: 30000 })
    await expect(page.getByText('Order Details')).toBeVisible({ timeout: 30000 });
    const refundButton = page.getByRole('button', {name: 'Refund'});
    await expect(refundButton).toBeVisible();

    // Refund
    await refundButton.click();
    const continueButton = page.getByRole('button', {name: 'Continue'});
    await expect(continueButton).toBeVisible();
    await continueButton.click();
    await expect(page.getByText('Loading')).toBeHidden();
});