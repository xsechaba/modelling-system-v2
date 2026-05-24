import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ── Load test state (project ID set by global-setup) ─────────────────────────
export function loadTestState(): { projectId: string | null; email: string } {
  const statePath = path.join(__dirname, '.auth', 'state.json');
  if (!fs.existsSync(statePath)) return { projectId: null, email: 'playwright@test.local' };
  return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
}

// ── Switch to light mode and verify theme attr is set ────────────────────────
export async function enableLightMode(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('dim-wiz-theme', 'light');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  // Wait for React/ThemeProvider to hydrate and apply data-theme="light".
  // A fixed timeout races against hydration; waitForFunction is reliable.
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-theme') === 'light',
    { timeout: 6000 }
  ).catch(() => {
    // Theme didn't switch within 6 s — assertTheme() will record the failure
  });
}

// ── Switch to dark mode ───────────────────────────────────────────────────────
export async function enableDarkMode(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('dim-wiz-theme', 'dark');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const t = document.documentElement.getAttribute('data-theme');
      return t === 'dark' || t === null; // null = not yet set, default is dark
    },
    { timeout: 6000 }
  ).catch(() => {});
}

// ── Check that data-theme is correctly applied ────────────────────────────────
export async function assertTheme(page: Page, expected: 'light' | 'dark') {
  const theme = await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme') ?? 'dark'
  );
  expect(theme, `Expected data-theme="${expected}"`).toBe(expected);
}

// ── Light mode CSS sanity checks ──────────────────────────────────────────────
// Returns a list of violations found (empty = pass)
export async function checkLightModeStyles(page: Page): Promise<string[]> {
  const violations: string[] = [];

  const result = await page.evaluate(() => {
    const issues: string[] = [];
    const allNodes = document.querySelectorAll('*');
    // Cap at 600 elements to avoid spending minutes on large pages
    const allElements = Array.from(allNodes).slice(0, 600);
    const DARK_BACKGROUNDS = [
      'rgb(5, 5, 5)',      // #050505
      'rgb(8, 8, 8)',      // #080808
      'rgb(10, 10, 10)',   // #0a0a0a
      'rgb(7, 7, 10)',     // #07070a
    ];
    const LIGHT_TEXT_ON_LIGHT = 'rgb(255, 255, 255)'; // white text = invisible in light mode

    let darkBgCount = 0;
    let whiteFgCount = 0;
    const sampleDark: string[] = [];
    const sampleWhite: string[] = [];

    allElements.forEach((el) => {
      const style = window.getComputedStyle(el as HTMLElement);
      const bg = style.backgroundColor;
      const color = style.color;
      const tag = (el as HTMLElement).tagName.toLowerCase();
      const cls = (el as HTMLElement).className?.toString().slice(0, 40);
      const id = (el as HTMLElement).id?.slice(0, 20);
      const label = `<${tag}${id ? ' id='+id : ''}${cls ? ' class='+cls : ''}>`;

      if (DARK_BACKGROUNDS.includes(bg) && darkBgCount < 5) {
        darkBgCount++;
        sampleDark.push(`${label} bg=${bg}`);
      }
      if (color === LIGHT_TEXT_ON_LIGHT && whiteFgCount < 5) {
        const bgCheck = style.backgroundColor;
        if (!bgCheck.includes('0, 0, 0') && bgCheck !== 'rgba(0, 0, 0, 0)') {
          whiteFgCount++;
          sampleWhite.push(`${label} color=white on bg=${bgCheck}`);
        }
      }
    });

    if (darkBgCount > 0) issues.push(`HARDCODED DARK BG: ${darkBgCount} element(s) — samples: ${sampleDark.join(' | ')}`);
    if (whiteFgCount > 0) issues.push(`WHITE TEXT ON LIGHT: ${whiteFgCount} element(s) — samples: ${sampleWhite.join(' | ')}`);
    return issues;
  });

  violations.push(...result);
  return violations;
}

// ── Check for JS console errors ───────────────────────────────────────────────
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`[page error] ${err.message}`));
  return errors;
}

// ── Check page for basic accessibility: heading exists, no broken images ──────
export async function checkBasicAccessibility(page: Page): Promise<string[]> {
  const issues: string[] = [];

  const hasHeading = await page.locator('h1, h2').count();
  if (hasHeading === 0) issues.push('No h1/h2 heading found on page');

  const brokenImages = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs
      .filter(img => !img.complete || img.naturalWidth === 0)
      .map(img => img.src || img.alt || '(unknown image)');
  });
  if (brokenImages.length > 0) issues.push(`Broken images: ${brokenImages.join(', ')}`);

  return issues;
}
