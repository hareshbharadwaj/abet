/**
 * Load test configuration.
 *
 * Everything can be overridden from the CLI (see load-suite.js) or from the
 * environment so the same suite runs locally and in GitHub Actions.
 */
export const CONFIG = {
  baseUrl: process.env.E2E_BASE_URL || 'http://127.0.0.1:4173',
  /** Number of enumerated load-test scenarios (300+). */
  scenarios: Number(process.env.LOAD_SCENARIOS || 300),
  /** Requests kept in flight while walking the scenario catalogue. */
  concurrency: Number(process.env.LOAD_CONCURRENCY || 10),
  /** Sustained load phase length in seconds. */
  durationSeconds: Number(process.env.LOAD_DURATION || 20),
  /** Virtual users used during the sustained load phase. */
  virtualUsers: Number(process.env.LOAD_VIRTUAL_USERS || 20),
  /** Directory that receives the Excel / CSV reports. */
  reportDir: process.env.LOAD_REPORT_DIR || 'reports',
  /** Per-request timeout. */
  requestTimeoutMs: Number(process.env.LOAD_REQUEST_TIMEOUT_MS || 15000),
  /** Built app directory used to discover real hashed assets. */
  distDir: process.env.LOAD_DIST_DIR || 'dist',
  /** Service-level objectives for the sustained load phase. */
  thresholds: {
    maxP95Ms: Number(process.env.LOAD_MAX_P95_MS || 3000),
    maxErrorRate: Number(process.env.LOAD_MAX_ERROR_RATE || 1), // percent
    minRps: Number(process.env.LOAD_MIN_RPS || 5),
  },
};

export const REPORT_FILES = {
  xlsx: 'Load_Test_Analysis_Report.xlsx',
  csv: 'load-test-results.csv',
  json: 'load-test-results.json',
  markdown: 'load-test-summary.md',
};
