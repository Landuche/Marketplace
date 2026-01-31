import { test as setup, expect } from '@playwright/test';
import { createListing, registerUser } from './utils';
import fs  from 'fs';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '../.auth');
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR);

setup('Setup order lifecycle test data', async ({ browser }) => {
  // Register seller
  const sellerContext = await browser.newContext();
  const sellerPage = await sellerContext.newPage();
  await registerUser(sellerPage, 'Seller');
  

  // Create listing
  await sellerPage.goto('/create-listing');
  const listingTitle = crypto.randomUUID();
  const responseData = await createListing(sellerPage, listingTitle, '10');
  const metadata = {
    listingId: responseData.id,
    listingTitle: listingTitle
  };
  fs.writeFileSync('test-metadata.json', JSON.stringify(metadata));
  await expect(sellerPage).toHaveTitle(new RegExp(listingTitle));

  await sellerContext.storageState({ path: path.join(AUTH_DIR, 'seller.json') });
  await sellerContext.close()

  // Register Buyer
  const buyerContext = await browser.newContext();
  const buyerPage = await buyerContext.newPage();
  await registerUser(buyerPage, 'Buyer');
  await buyerContext.storageState({ path: path.join(AUTH_DIR, 'buyer.json') });
  await buyerContext.close();
});