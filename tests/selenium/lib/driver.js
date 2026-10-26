/**
 * Chrome driver factory + low-level page helpers.
 */
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { CONFIG } from '../config.js';

/** Hosts that are forced offline so the SPA always uses its localStorage fallback. */
const OFFLINE_HOSTS = [
  'firestore.googleapis.com',
  '*.firestore.googleapis.com',
  'generativelanguage.googleapis.com',
];

function hostResolverRules() {
  return OFFLINE_HOSTS.map((host) => `MAP ${host} ~NOTFOUND`).join(', ');
}

export function buildChromeOptions({ viewport, headless = CONFIG.headless } = {}) {
  const options = new chrome.Options();
  const width = viewport?.width || 1440;
  const height = viewport?.height || 900;

  if (headless) {
    const mode = CONFIG.headlessMode || 'new';
    options.addArguments(mode === 'shell' ? '--headless=shell' : '--headless=new');
  }

  options.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-notifications',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-search-engine-choice-screen',
    '--disable-features=Translate,BackForwardCache,MediaRouter,OptimizationHints',
    '--no-first-run',
    '--no-default-browser-check',
    '--force-device-scale-factor=1',
    '--lang=en-US',
    `--window-size=${width},${height}`
  );

  if (CONFIG.offlineFirestore) {
    options.addArguments(`--host-resolver-rules=${hostResolverRules()}`);
  }

  if (CONFIG.extraChromeArgs.length) {
    options.addArguments(...CONFIG.extraChromeArgs);
  }

  if (CONFIG.chromeBinary) {
    options.setChromeBinaryPath(CONFIG.chromeBinary);
  }

  // Required to collect browser console logs for the "no JS errors" checks.
  options.setLoggingPrefs({ browser: 'ALL' });

  return options;
}

export async function createDriver({ viewport } = {}) {
  const options = buildChromeOptions({ viewport });
  const builder = new Builder().forBrowser('chrome').setChromeOptions(options);

  if (CONFIG.chromedriverPath) {
    builder.setChromeService(new chrome.ServiceBuilder(CONFIG.chromedriverPath));
  }

  const driver = await builder.build();

  await driver.manage().setTimeouts({
    implicit: 0,
    pageLoad: CONFIG.pageLoadTimeoutMs,
    script: 20000,
  });
  await setViewport(driver, viewport);
  return driver;
}

export async function setViewport(driver, viewport) {
  if (!viewport) return;
  try {
    await driver.manage().window().setRect({
      width: viewport.width,
      height: viewport.height,
      x: 0,
      y: 0,
    });
  } catch {
    /* Window sizing is best effort in some headless environments. */
  }
  await driver.sleep(120);
}

export async function readBodyText(driver) {
  return driver.executeScript(
    'return document.body ? document.body.innerText : "";'
  );
}

export async function readHash(driver) {
  return driver.executeScript('return window.location.hash || "";');
}

export async function setHash(driver, route) {
  const target = route.startsWith('#') ? route : `#${route}`;
  await driver.executeScript('window.location.hash = arguments[0];', target);
}

/** True once React has mounted something inside #root. */
export async function isMounted(driver) {
  try {
    return await driver.executeScript(
      'var r = document.getElementById("root"); return !!(r && r.children.length > 0);'
    );
  } catch {
    return false;
  }
}

export async function waitForMount(driver, timeout = CONFIG.mountTimeoutMs) {
  return driver.wait(() => isMounted(driver), timeout, 'React app did not mount');
}

/** Wait until the full-page "Loading..." spinner has disappeared. */
export async function waitForSettled(driver, timeout = 12000) {
  try {
    await driver.wait(
      async () => {
        const text = await readBodyText(driver);
        return !/^\s*Loading\.\.\.\s*$/.test(text);
      },
      timeout,
      'App stayed on the loading screen'
    );
  } catch {
    /* Callers assert on real content; a lingering spinner is reported there. */
  }
  await driver.sleep(150);
}

/** Navigate to an absolute URL and swallow driver-level navigation errors. */
export async function safeGet(driver, url) {
  try {
    await driver.get(url);
    return null;
  } catch (error) {
    return error;
  }
}

export async function clearBrowserLogs(driver) {
  try {
    await driver.manage().logs().get('browser');
  } catch {
    /* Logging is optional. */
  }
}

export async function browserConsoleMessages(driver) {
  try {
    const entries = await driver.manage().logs().get('browser');
    return entries.map((entry) => ({
      level: entry.level?.name || String(entry.level),
      message: entry.message,
    }));
  } catch {
    return [];
  }
}

/** Run a promise with a hard timeout so a hung browser cannot stall the suite. */
export function withTimeout(promise, ms, message = 'Operation timed out') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${message} (${ms}ms)`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
