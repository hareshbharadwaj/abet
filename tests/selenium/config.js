/**
 * Central configuration for the Selenium E2E suite.
 *
 * Every value can be overridden from the command line (see selenium-suite.js)
 * or from the environment so the same suite runs locally and in GitHub Actions.
 */

export const CONFIG = {
  /** Base URL of the running application (vite preview in CI). */
  baseUrl: process.env.E2E_BASE_URL || 'http://localhost:4173',
  /** Number of parallel Chrome sessions. */
  workers: Number(process.env.E2E_WORKERS || 4),
  /** Run Chrome without a visible window. */
  headless: process.env.E2E_HEADLESS !== 'false',
  /** Per test-case timeout. */
  caseTimeoutMs: Number(process.env.E2E_CASE_TIMEOUT_MS || 25000),
  /** Timeout for any single page load. */
  pageLoadTimeoutMs: Number(process.env.E2E_PAGE_TIMEOUT_MS || 30000),
  /** Retries for a failed case (helps against CI flakiness). */
  retries: Number(process.env.E2E_RETRIES ?? 1),
  /** Timeout while waiting for the SPA to mount. */
  mountTimeoutMs: Number(process.env.E2E_MOUNT_TIMEOUT_MS || 20000),
  /** Directory that receives the Excel / CSV / JUnit reports. */
  reportDir: process.env.E2E_REPORT_DIR || 'reports',
  /** Directory that receives failure screenshots. */
  screenshotDir: process.env.E2E_SCREENSHOT_DIR || 'reports/screenshots',
  /** Chrome binary override (used when Chrome lives outside PATH). */
  chromeBinary: process.env.CHROME_BIN || '',
  /** ChromeDriver binary override (bypasses Selenium Manager downloads). */
  chromedriverPath: process.env.E2E_CHROMEDRIVER || '',
  /** Headless mode: 'new' (default) or 'shell' for chromium headless shells. */
  headlessMode: process.env.E2E_HEADLESS_MODE || 'new',
  /** Extra Chrome switches, comma separated (CI or local headless shells). */
  extraChromeArgs: (process.env.E2E_CHROME_ARGS || '')
    .split(',')
    .map((arg) => arg.trim())
    .filter(Boolean),
  /** Block Firestore traffic so the app deterministically uses localStorage. */
  offlineFirestore: process.env.E2E_OFFLINE_FIRESTORE !== 'false',
};

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, label: 'Desktop 1440x900' },
  laptop: { width: 1280, height: 800, label: 'Laptop 1280x800' },
  tablet: { width: 768, height: 1024, label: 'Tablet 768x1024' },
  mobile: { width: 390, height: 844, label: 'Mobile 390x844' },
  mobileSmall: { width: 320, height: 640, label: 'Small mobile 320x640' },
};

/**
 * Test identities. Users live in localStorage (the app's offline fallback),
 * so no Firebase credentials are required to exercise protected screens.
 */
export const IDENTITIES = {
  guest: { label: 'Guest', user: null },
  buyer: {
    label: 'Buyer',
    user: {
      uid: 'e2e-buyer-001',
      name: 'E2E Buyer',
      email: 'e2e.buyer@a2zee.test',
      phone: '9876543210',
      role: 'buyer',
      status: 'active',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
  },
  seller: {
    label: 'Seller',
    user: {
      uid: 'e2e-seller-001',
      name: 'E2E Seller',
      email: 'e2e.seller@a2zee.test',
      phone: '9876500001',
      role: 'seller',
      status: 'active',
      createdAt: '2025-02-10T10:00:00.000Z',
    },
  },
  admin: {
    label: 'Admin',
    user: {
      uid: 'e2e-admin-001',
      name: 'E2E Admin',
      email: 'e2e.admin@a2zee.test',
      phone: '9876500002',
      role: 'admin',
      status: 'active',
      createdAt: '2025-02-11T10:00:00.000Z',
    },
  },
  superadmin: {
    label: 'Super Admin',
    user: {
      uid: 'superadmin-hardcoded',
      name: 'Super Administrator',
      email: 'admin123@gmail.com',
      phone: '9876500003',
      role: 'superadmin',
      status: 'active',
      createdAt: '2025-02-12T10:00:00.000Z',
    },
  },
};

/** The homepage each role lands on after login. */
export const HOME_BY_ROLE = {
  buyer: '/home',
  seller: '/seller/dashboard',
  admin: '/admin/dashboard',
  superadmin: '/superadmin',
};
