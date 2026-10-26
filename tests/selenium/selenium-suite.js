#!/usr/bin/env node
/**
 * A2ZEE Microgreenz – Selenium E2E suite.
 *
 * Usage:
 *   node tests/selenium/selenium-suite.js --list           # print the test catalogue
 *   node tests/selenium/selenium-suite.js                  # run everything
 *   node tests/selenium/selenium-suite.js --module buyer   # run one module
 *   node tests/selenium/selenium-suite.js --workers 4 --base-url http://localhost:4173
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { CONFIG } from './config.js';
import { buildGroups, countCases, listCases, validateRegistry, MIN_CASES, MAX_CASES } from './cases/registry.js';
import { runSuite } from './lib/runner.js';
import {
  summarise,
  summaryMarkdown,
  writeCsv,
  writeJUnit,
  writeJson,
  writeManifest,
  writeSummaryMarkdown,
  writeXlsx,
} from './lib/report.js';

function parseArgs(argv) {
  const options = {
    list: false,
    dryRun: false,
    module: '',
    group: '',
    baseUrl: CONFIG.baseUrl,
    workers: CONFIG.workers,
    retries: CONFIG.retries,
    headless: CONFIG.headless,
    reportDir: CONFIG.reportDir,
  };

  for (const arg of argv.slice(2)) {
    const [key, rawValue] = arg.split('=');
    const value = rawValue === undefined ? true : rawValue;

    switch (key) {
      case '--list':
        options.list = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--module':
        options.module = String(value);
        break;
      case '--group':
        options.group = String(value);
        break;
      case '--base-url':
        options.baseUrl = String(value);
        break;
      case '--workers':
        options.workers = Number(value);
        break;
      case '--retries':
        options.retries = Number(value);
        break;
      case '--headless':
        options.headless = String(value) !== 'false';
        break;
      case '--report-dir':
        options.reportDir = String(value);
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        if (key.startsWith('--')) {
          console.warn(`Unknown option: ${key}`);
        }
    }
  }

  return options;
}

function printHelp() {
  console.log(`
A2ZEE Selenium E2E suite

  --list                 Print every test case and write the manifest CSV
  --module <name>        Filter by module name or code (e.g. buyer, ADM)
  --group <code>         Filter by a single page group code (e.g. BUY-CART)
  --base-url <url>       Target application URL (default ${CONFIG.baseUrl})
  --workers <n>          Parallel Chrome sessions (default ${CONFIG.workers})
  --retries <n>          Retries for failing cases (default ${CONFIG.retries})
  --headless=false       Show the browser window
  --report-dir <dir>     Report output directory (default ${CONFIG.reportDir})
`);
}

function applyOptions(options) {
  CONFIG.baseUrl = options.baseUrl;
  CONFIG.workers = options.workers;
  CONFIG.retries = options.retries;
  CONFIG.headless = options.headless;
  CONFIG.reportDir = options.reportDir;
  CONFIG.screenshotDir = path.join(options.reportDir, 'screenshots');
}

async function ensureServer(baseUrl, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: 'follow' });
      if (response.ok) return true;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Application did not become reachable at ${baseUrl} (${lastError})`);
}

function chromeVersion() {
  const binary = process.env.CHROME_BIN || 'google-chrome';
  try {
    const output = execSync(`"${binary}" --version`, {
      encoding: 'utf8',
      timeout: 8000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.trim();
  } catch {
    return 'Google Chrome (headless)';
  }
}

function buildMeta(options, runInfo) {
  const runId = process.env.GITHUB_RUN_ID || '';
  const base = {
    repository: process.env.GITHUB_REPOSITORY || 'hareshbharadwaj/abet',
    ref: process.env.GITHUB_REF_NAME || '',
    sha: process.env.GITHUB_SHA || '',
    runId,
    runUrl: runId
      ? `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY || 'hareshbharadwaj/abet'}/actions/runs/${runId}`
      : '',
    baseUrl: CONFIG.baseUrl,
    workers: runInfo.workers || CONFIG.workers,
    browser: chromeVersion(),
    runner: process.env.RUNNER_OS ? `${process.env.RUNNER_OS} / ${process.env.RUNNER_ARCH || ''}` : process.platform,
    startedAt: runInfo.startedAt,
    finishedAt: runInfo.finishedAt,
    durationMs: runInfo.durationMs,
    env: {
      NODE_VERSION: process.version,
      WORKERS: String(CONFIG.workers),
      HEADLESS: String(CONFIG.headless),
      RETRIES: String(CONFIG.retries),
      BASE_URL: CONFIG.baseUrl,
      OFFLINE_FIRESTORE: String(CONFIG.offlineFirestore),
      GITHUB_RUN_ID: runId || 'local',
    },
  };
  return base;
}

function printCatalogue(groups) {
  console.log('\nA2ZEE Selenium test catalogue\n');
  let moduleName = '';
  for (const group of groups) {
    if (group.module !== moduleName) {
      moduleName = group.module;
      console.log(`\n${moduleName}`);
      console.log('─'.repeat(Math.max(moduleName.length, 20)));
    }
    for (const testCase of group.cases) {
      console.log(
        `  ${testCase.id.padEnd(16)} ${testCase.title}  [${group.identity || 'guest'} · ${group.path || '/'}]`
      );
    }
  }
  console.log(`\nTotal: ${countCases(groups)} test cases across ${groups.length} page groups\n`);
}

function appendStepSummary(markdown) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (!file) return;
  try {
    fs.appendFileSync(file, `${markdown}\n`);
  } catch (error) {
    console.warn(`Could not write step summary: ${error.message}`);
  }
}

async function main() {
  const options = parseArgs(process.argv);
  applyOptions(options);

  const groups = buildGroups({ moduleFilter: options.module, groupFilter: options.group });
  const errors = validateRegistry(groups);
  if (errors.length) {
    console.error('Invalid test registry:');
    for (const error of errors) console.error(` - ${error}`);
    process.exit(1);
  }

  const total = countCases(groups);
  if (!groups.length) {
    console.error(`No test groups matched module="${options.module}" group="${options.group}"`);
    process.exit(1);
  }

  fs.mkdirSync(CONFIG.reportDir, { recursive: true });
  const manifestFile = writeManifest(groups, path.join(CONFIG.reportDir, 'selenium-test-cases.csv'));

  if (options.list) {
    printCatalogue(groups);
    console.log(`Manifest written to ${manifestFile}`);
    if (!options.module && !options.group && (total < MIN_CASES || total > MAX_CASES)) {
      console.error(`✗ Expected between ${MIN_CASES} and ${MAX_CASES} cases, found ${total}`);
      process.exit(1);
    }
    return;
  }

  if (!options.dryRun && !options.module && !options.group && (total < MIN_CASES || total > MAX_CASES)) {
    console.error(`✗ Expected between ${MIN_CASES} and ${MAX_CASES} cases, found ${total}`);
    process.exit(1);
  }

  console.log(`A2ZEE Selenium E2E · ${total} cases · ${groups.length} page groups`);
  console.log(`Manifest: ${manifestFile}`);

  if (options.dryRun) {
    printCatalogue(groups);
    return;
  }

  await ensureServer(CONFIG.baseUrl);

  const runInfo = await runSuite({ groups });
  const meta = buildMeta(options, runInfo);
  const summary = summarise(meta, runInfo.results);

  const files = {
    xlsx: writeXlsx(meta, runInfo.results, path.join(CONFIG.reportDir, 'selenium-e2e-report.xlsx')),
    csv: writeCsv(runInfo.results, path.join(CONFIG.reportDir, 'selenium-e2e-report.csv')),
    json: writeJson(meta, runInfo.results, path.join(CONFIG.reportDir, 'selenium-results.json')),
    junit: writeJUnit(meta, runInfo.results, path.join(CONFIG.reportDir, 'selenium-junit.xml')),
    markdown: writeSummaryMarkdown(meta, runInfo.results, path.join(CONFIG.reportDir, 'selenium-summary.md')),
  };

  const markdown = summaryMarkdown(meta, runInfo.results);
  appendStepSummary(markdown);

  console.log('\n' + '─'.repeat(72));
  console.log(`Total: ${summary.total} · Passed: ${summary.passed} · Failed: ${summary.failed} · Flaky: ${summary.flaky}`);
  console.log(`Pass rate: ${summary.passRate.toFixed(1)}% · Duration: ${(runInfo.durationMs / 1000).toFixed(1)}s`);
  for (const file of Object.values(files)) console.log(`Report: ${file}`);
  console.log('─'.repeat(72));

  if (summary.failed > 0) {
    console.log('\nFailing cases:');
    for (const result of runInfo.results.filter((entry) => entry.status === 'FAIL')) {
      console.log(`  ✗ ${result.id} ${result.title} — ${result.error}`);
    }
    process.exit(1);
  }

  // Force a clean exit so stray browser handles cannot keep CI jobs alive.
  process.exit(0);
}

main().catch((error) => {
  console.error('\n✗ Selenium suite crashed:', error.stack || error.message);
  process.exit(1);
});
