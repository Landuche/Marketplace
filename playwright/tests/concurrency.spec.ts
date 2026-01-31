import { test, expect } from '@playwright/test';
import { createListing, randomUsername, registerUser } from './utils';
import { deleteUser } from './db-cleanup';
import path from 'path';

test.describe.configure({ mode: 'serial' });
const AUTH_DIR = path.join(__dirname, '../.auth');

test ('Race condition and redis cache', async ({browser}) => {
    const username1 = await randomUsername();
    const username2 = await randomUsername();
    try {
        // Create a new listing with 1 in stock
        const sellerContext = await browser.newContext({ storageState: path.join(AUTH_DIR, 'seller.json') });
        const sellerPage = await sellerContext.newPage();
        const listingTitle = crypto.randomUUID();
        const responseData = await createListing(sellerPage, listingTitle, '1');
        const listingId = responseData.id;

        // Create two new users
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();
        await registerUser(page1, username1);
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        await registerUser(page2, username2);

        // Open the listing
        await Promise.all([
            page1.goto(`/listings/${listingId}`),
            page2.goto(`/listings/${listingId}`)
        ]);

        // Both try to buy the same listing, only user 1 succeed
        await page1.getByRole('button', { name: 'Add to Cart' }).click();
        await page2.getByRole('button', { name: 'Add to Cart' }).click();
        await expect(page1).toHaveURL(/nginx\/cart/);
        await expect(page2).toHaveURL(/nginx\/cart/);
        const orderPromise = page1.waitForResponse(
            res => res.url().includes('/api/order/') && res.status() === 201, { timeout: 30000 }
        );
        await page1.getByRole('button', { name: 'Confirm and Pay' }).click();
        await page2.getByRole('button', { name: 'Confirm and Pay' }).click();
        const orderResponse = await orderPromise;
        const orderData = await orderResponse.json()
        const order_id = orderData.id
        await expect(page1).toHaveURL(/nginx\/checkout/);
        await expect(page2.getByText('Insufficient stock')).toBeVisible();

        // Check redis cache implementation
        await sellerPage.goto(`listing/${listingId}/edit`);
        await expect(sellerPage.locator('span:has-text("Total Inventory:")')).toContainText('1', { timeout: 5000 });
        await expect(sellerPage.locator('span:has-text("Currently Reserved:")')).toContainText('1');

        // Old order to check celery task implementation
        await sellerPage.request.post(`api/debug/age-order/${order_id}/`);
        await sellerPage.request.post(`api/debug/clean-orders/`);
        await expect(async () => {
            await sellerPage.reload();
            await expect(sellerPage.locator('span:has-text("Currently Reserved:")')).toContainText('0');
        }).toPass({ timeout: 30000 });
        await expect(sellerPage.locator('span:has-text("Total Inventory:")')).toContainText('1', { timeout: 5000 });
        await expect(sellerPage.locator('span:has-text("Currently Reserved:")')).toContainText('0');

        await sellerContext.close();
        await context1.close();
        await context2.close();
    } finally {
        deleteUser(username1);
        deleteUser(username2);
    }
});