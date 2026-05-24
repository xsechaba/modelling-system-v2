import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
export const TEST_EMAIL = 'playwright@test.local';
export const TEST_PASSWORD = 'PlaywrightTest123!';
export const TEST_NAME = 'Playwright Tester';

async function globalSetup(config: FullConfig) {
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  // ── 1. Register test user (idempotent — silently ignores "Email taken") ──
  console.log('\n[setup] Registering test user...');
  const regRes = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const regText = await regRes.text();
  if (!regRes.ok && regText !== 'Email taken') {
    throw new Error(`Registration failed: ${regText}`);
  }
  console.log(`[setup] User status: ${regRes.ok ? 'newly created' : 'already exists'}`);

  // ── 2. Log in via browser to capture NextAuth session cookie ─────────────
  console.log('[setup] Logging in via browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/auth/login`);
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/projects', { timeout: 20000 });
  console.log('[setup] Login successful, on /projects page.');

  // ── 3. Capture first project ID for use in wizard tests ──────────────────
  let projectId: string | null = null;
  try {
    // Wait for project cards to appear
    await page.waitForSelector('[data-project-id], a[href*="/wizard/"]', { timeout: 8000 });
    const projectLink = await page.locator('a[href*="/wizard/"]').first().getAttribute('href');
    if (projectLink) {
      const match = projectLink.match(/\/wizard\/([^/]+)/);
      if (match) projectId = match[1];
    }
  } catch {
    // No projects yet — navigate to /projects and try to get from URL after clicking
    try {
      const firstCard = await page.locator('a[href*="/projects/"]').first();
      const href = await firstCard.getAttribute('href');
      if (href) {
        const match = href.match(/\/projects\/([^/]+)/);
        if (match) projectId = match[1];
      }
    } catch { /* no projects found */ }
  }

  console.log(`[setup] Test project ID: ${projectId ?? '(none found)'}`);

  // ── 4. Save auth cookie + project state for test files ───────────────────
  await context.storageState({ path: path.join(authDir, 'user.json') });
  fs.writeFileSync(
    path.join(authDir, 'state.json'),
    JSON.stringify({ projectId, email: TEST_EMAIL }, null, 2)
  );

  await browser.close();
  console.log('[setup] Auth state saved. Setup complete.\n');
}

export default globalSetup;
