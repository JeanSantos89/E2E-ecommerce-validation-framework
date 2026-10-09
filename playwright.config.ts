import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    // Testado contra o site demo público do nopCommerce (terceiro, fora do
    // nosso controle). Ver README, seção "E2E Tests (quality gate)", sobre
    // por que a suíte roda em modo best-effort no CI.
    baseURL: 'https://demo.nopcommerce.com',
  },
  /* Configure projects for major browsers */
 projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'WebKit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});