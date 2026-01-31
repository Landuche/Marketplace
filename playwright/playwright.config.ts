import { defineConfig, devices } from '@playwright/test';


/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: process.env.CI ? 60000 : 45000,
  globalTeardown: require.resolve('./tests/teardown.ts'),
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  reporter: 'html',
  use: {

    baseURL: process.env.BASE_URL || 'http://localhost',
    trace: 'on-first-retry',
    viewport: {width: 1280, height: 720},
    ignoreHTTPSErrors: true,
    actionTimeout: 15000,
    navigationTimeout: 20000,
    screenshot: 'on',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },

    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-dev-shm-usage', 
            '--disable-gpu',          
            '--no-sandbox',            
          ],
        }, 
      },
    },

    {
      name: 'firefox',
      dependencies: ['setup'],
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'privacy.trackingprotection.enabled': false,
            'privacy.trackingprotection.pbmode.enabled': false,
            'privacy.fingerprintingProtection': false,
          },
        },
      },
    },

    {
      name: 'webkit',
      dependencies: ['setup'],
      use: { 
        ...devices['Desktop Safari'],
        bypassCSP: true, 
        ignoreHTTPSErrors: true,
      },
    },
  ],
});