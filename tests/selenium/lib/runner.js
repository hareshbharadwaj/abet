/**
 * Parallel Selenium runner.
 *
 * Groups are the unit of navigation: a group boots the app once with a seeded
 * localStorage state, then executes several independent test cases against the
 * same page. This keeps 300+ cases fast enough for CI.
 */
import fs from 'fs';
import path from 'path';
import { CONFIG, VIEWPORTS } from '../config.js';
import { PageContext } from './ctx.js';
import { buildSeedScript } from './fixtures.js';
import {
  createDriver,
  readBodyText,
  safeGet,
  setViewport,
  waitForMount,
  waitForSettled,
} from './driver.js';
import { snippet } from './assert.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runSuite({ groups, log = console.log } = {}) {
  const startedAt = Date.now();
  const results = [];
  let cursor = 0;
  let completed = 0;
  const totalCases = groups.reduce((sum, group) => sum + group.cases.length, 0);

  const workerCount = Math.max(1, Math.min(CONFIG.workers, groups.length));
  log(`▶ Selenium suite: ${groups.length} page groups / ${totalCases} test cases`);
  log(`▶ Base URL: ${CONFIG.baseUrl}`);
  log(`▶ Workers: ${workerCount} · headless: ${CONFIG.headless} · retries: ${CONFIG.retries}`);

  const runWorker = async (workerId) => {
    let driver = null;
    let currentViewportKey = null;

    const ensureDriver = async (viewport) => {
      if (!driver) {
        driver = await createDriver({ viewport });
        currentViewportKey = viewport?.label;
        log(`[w${workerId}] Chrome session ready`);
      } else if (currentViewportKey !== viewport?.label) {
        await setViewport(driver, viewport);
        currentViewportKey = viewport?.label;
      }
      return driver;
    };

    try {
      while (cursor < groups.length) {
        const group = groups[cursor++];
        const viewport = VIEWPORTS[group.viewport || 'desktop'];
        const workerDriver = await ensureDriver(viewport);

        const ctx = new PageContext({
          driver: workerDriver,
          baseUrl: CONFIG.baseUrl,
          identity: group.identity || 'guest',
          viewport,
          log: (message) => log(`[w${workerId}] ${message}`),
        });

        let prepareError = null;
        try {
          await prepareGroup(workerDriver, ctx, group, viewport);
        } catch (error) {
          prepareError = error;
          log(`[w${workerId}] ✗ setup failed for ${group.code}: ${error.message}`);
        }

        for (const testCase of group.cases) {
          const outcome = await executeCase({
            workerId,
            driver: workerDriver,
            ctx,
            group,
            testCase,
            prepareError,
            prepare: () => prepareGroup(workerDriver, ctx, group, viewport),
          });

          results.push(outcome);
          completed += 1;
          const icon = outcome.status === 'PASS' ? '✓' : '✗';
          log(
            `[w${workerId}] ${icon} ${String(completed).padStart(3)}/${totalCases} ` +
              `${outcome.id} ${outcome.title} (${(outcome.durationMs / 1000).toFixed(2)}s)` +
              (outcome.status === 'PASS' ? '' : ` — ${outcome.error}`)
          );
        }
      }
    } finally {
      if (driver) {
        try {
          await driver.quit();
        } catch {
          /* ignore */
        }
      }
    }
  };

  await Promise.all(Array.from({ length: workerCount }, (_, index) => runWorker(index + 1)));

  results.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));

  return {
    results,
    totalCases,
    groupCount: groups.length,
    durationMs: Date.now() - startedAt,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    workers: workerCount,
  };
}

/**
 * Boots the SPA with a seeded localStorage state and navigates to the group's route.
 */
export async function prepareGroup(driver, ctx, group, viewport) {
  await setViewport(driver, viewport);

  const bootError = await safeGet(driver, `${CONFIG.baseUrl}/`);
  if (bootError) throw new Error(`Could not load ${CONFIG.baseUrl}: ${bootError.message}`);

  await waitForMount(driver);
  const seedResult = await driver.executeScript(
    buildSeedScript({
      identity: group.identity || 'guest',
      ...(group.seed || {}),
    })
  );
  if (typeof seedResult === 'string' && seedResult.startsWith('seed-error')) {
    throw new Error(seedResult);
  }

  // Reload once so AuthContext boots with the seeded identity *before* the
  // router evaluates guards. Without this the app still believes it is a guest
  // and bounces the hash back to "/" before the target route can render.
  try {
    await driver.navigate().refresh();
  } catch {
    /* A reload is best effort; the navigation below still runs. */
  }
  await waitForMount(driver);
  await waitForSettled(driver);

  const route = group.path || '/';
  const navError = await safeGet(driver, `${CONFIG.baseUrl}/#${route}`);
  if (navError && !group.navigationTolerant) {
    throw new Error(`Navigation to ${route} failed: ${navError.message}`);
  }

  try {
    await driver.navigate().refresh();
  } catch (error) {
    if (!group.navigationTolerant) {
      throw new Error(`Reload after seeding failed: ${error.message}`);
    }
  }

  await waitForMount(driver);
  await waitForSettled(driver);

  if (group.setup) {
    await group.setup(ctx);
  }
}

async function executeCase({
  workerId,
  driver,
  ctx,
  group,
  testCase,
  prepareError,
  prepare,
}) {
  const startedAt = Date.now();

  const attempt = async () => {
    if (prepareError) throw prepareError;
    if (testCase.before) await testCase.before(ctx);
    await testCase.run(ctx);
  };

  try {
    await withCaseTimeout(attempt(), testCase.timeoutMs || CONFIG.caseTimeoutMs);
    return baseResult({ group, testCase, status: 'PASS', startedAt, attempts: 1 });
  } catch (error) {
    try {
      error.snapshot = snippet(await readBodyText(driver), 260);
    } catch {
      /* ignore */
    }
    const firstError = error;
    const screenshot = await captureFailure(driver, group, testCase, workerId);
    let consoleNote = '';

    for (let retry = 1; retry <= CONFIG.retries; retry += 1) {
      try {
        await prepare().catch(() => {});
        prepareError = null;
        await withCaseTimeout(attempt(), testCase.timeoutMs || CONFIG.caseTimeoutMs);
        return {
          ...baseResult({ group, testCase, status: 'PASS', startedAt, attempts: retry + 1 }),
          flaky: true,
          details: `Passed on retry ${retry} after: ${firstError.message}`,
        };
      } catch (retryError) {
        if (retry === CONFIG.retries) {
          consoleNote = await consoleSummary(driver);
          return {
            ...baseResult({
              group,
              testCase,
              status: 'FAIL',
              startedAt,
              attempts: retry + 1,
              error: `${retryError.message}`,
              details: `Attempt ${retry + 1} failed: ${retryError.message}${consoleNote ? ` | console: ${consoleNote}` : ''}${retryError.snapshot ? ` | page: ${retryError.snapshot}` : ''}`,
            }),
            screenshot,
          };
        }
      }
    }

    return {
      ...baseResult({
        group,
        testCase,
        status: 'FAIL',
        startedAt,
        attempts: 1,
        error: firstError.message,
        details: firstError.snapshot ? `page: ${firstError.snapshot}` : firstError.message,
      }),
      screenshot,
    };
  }
}

function baseResult({ group, testCase, status, startedAt, attempts, error = '', details = '' }) {
  return {
    id: testCase.id,
    module: group.module,
    moduleCode: group.code,
    title: testCase.title,
    group: group.title,
    identity: group.identity || 'guest',
    viewport: VIEWPORTS[group.viewport || 'desktop'].label,
    route: group.path || '/',
    status,
    flaky: false,
    attempts,
    durationMs: Date.now() - startedAt,
    error,
    details: details || '',
    timestamp: new Date().toISOString(),
  };
}

async function captureFailure(driver, group, testCase, workerId) {
  try {
    fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
    const base64 = await driver.takeScreenshot();
    const file = path.join(CONFIG.screenshotDir, `${testCase.id}-w${workerId}.png`);
    fs.writeFileSync(file, base64, 'base64');
    return file;
  } catch {
    return null;
  }
}

async function consoleSummary(driver) {
  try {
    const entries = await driver.manage().logs().get('browser');
    const severe = entries
      .filter((entry) => String(entry.level?.name || entry.level).toUpperCase() === 'SEVERE')
      .map((entry) => snippet(entry.message, 140))
      .slice(-3);
    return severe.join(' || ');
  } catch {
    return '';
  }
}

async function withCaseTimeout(promise, timeoutMs) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Test case timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export { sleep };
