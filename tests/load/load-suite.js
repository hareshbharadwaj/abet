#!/usr/bin/env node
/**
 * A2ZEE Microgreenz — HTTP load test suite.
 *
 * Usage:
 *   node tests/load/load-suite.js --list
 *   node tests/load/load-suite.js
 *   node tests/load/load-suite.js --scenarios=350 --concurrency=20 --duration=30
 *
 * Output mirrors the Selenium runner: numbered cases with PASS/FAIL and a
 * SUMMARY block, followed by a styled Excel workbook in reports/.
 */
import fs from 'fs';
import path from 'path';
import { CONFIG, REPORT_FILES } from './config.js';
import { buildScenarios, discoverAssets } from './lib/scenarios.js';
import { aggregateByEndpoint, runLoadPhase, runScenarios } from './lib/runner.js';
import {
  summaryMarkdown,
  writeCsv,
  writeJson,
  writeSummaryMarkdown,
  writeWorkbook,
} from './lib/report.js';

const GREEN = process.stdout.isTTY ? '\u001b[32m' : '';
const RED = process.stdout.isTTY ? '\u001b[31m' : '';
const DIM = process.stdout.isTTY ? '\u001b[2m' : '';
const RESET = process.stdout.isTTY ? '\u001b[0m' : '';

function parseArgs(argv) {
  const options = {
    list: false,
    dryRun: false,
    baseUrl: CONFIG.baseUrl,
    scenarios: CONFIG.scenarios,
    concurrency: CONFIG.concurrency,
    duration: CONFIG.durationSeconds,
    users: CONFIG.virtualUsers,
    reportDir: CONFIG.reportDir,
    distDir: CONFIG.distDir,
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
      case '--base-url':
        options.baseUrl = String(value);
        break;
      case '--scenarios':
        options.scenarios = Number(value);
        break;
      case '--concurrency':
        options.concurrency = Number(value);
        break;
      case '--duration':
        options.duration = Number(value);
        break;
      case '--users':
        options.users = Number(value);
        break;
      case '--report-dir':
        options.reportDir = String(value);
        break;
      case '--dist-dir':
        options.distDir = String(value);
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        if (key.startsWith('--')) console.warn(`Unknown option: ${key}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
A2ZEE load test suite

  --list                 Print every scenario without sending traffic
  --scenarios <n>        Number of load scenarios (default ${CONFIG.scenarios})
  --concurrency <n>      Requests in flight for the scenario phase (default ${CONFIG.concurrency})
  --duration <s>         Sustained load duration in seconds (default ${CONFIG.durationSeconds})
  --users <n>            Virtual users for the load phase (default ${CONFIG.virtualUsers})
  --base-url <url>       Target application URL (default ${CONFIG.baseUrl})
  --report-dir <dir>     Report output directory (default ${CONFIG.reportDir})
  --dist-dir <dir>       Built app used to discover assets (default ${CONFIG.distDir})
`);
}

async function ensureServer(baseUrl, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(5000) });
      if (response.ok) return true;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Application did not become reachable at ${baseUrl} (${lastError})`);
}

const fmt = (value) => value.toLocaleString('en-US');

function buildMeta(options, startedAt, finishedAt) {
  const runId = process.env.GITHUB_RUN_ID || '';
  return {
    baseUrl: options.baseUrl,
    nodeVersion: process.version,
    platform: `${process.platform} ${process.arch}`,
    runnerOs: process.env.RUNNER_OS || '',
    runId,
    repository: process.env.GITHUB_REPOSITORY || 'hareshbharadwaj/abet',
    ref: process.env.GITHUB_REF_NAME || '',
    sha: (process.env.GITHUB_SHA || '').slice(0, 7),
    startedAt,
    finishedAt,
    durationMs: Date.now() - Date.parse(startedAt),
    concurrency: options.concurrency,
    browser: 'HTTP (Node fetch / undici keep-alive)',
  };
}

function buildChecks(loadPhase) {
  const checks = [
    {
      name: 'Throughput (req/s)',
      measured: `${loadPhase.rps}`,
      threshold: `≥ ${CONFIG.thresholds.minRps}`,
      passed: loadPhase.rps >= CONFIG.thresholds.minRps,
    },
    {
      name: 'p95 latency (ms)',
      measured: `${loadPhase.p95Ms}`,
      threshold: `≤ ${CONFIG.thresholds.maxP95Ms}`,
      passed: loadPhase.p95Ms <= CONFIG.thresholds.maxP95Ms,
    },
    {
      name: 'Error rate (%)',
      measured: `${loadPhase.errorRate}`,
      threshold: `≤ ${CONFIG.thresholds.maxErrorRate}`,
      passed: loadPhase.errorRate <= CONFIG.thresholds.maxErrorRate,
    },
  ];
  return checks;
}

function printSummary({ total, passed, failed, durationMs, reportFile, checks, loadPhase }) {
  const line = '─'.repeat(62);
  console.log('');
  console.log(line);
  console.log(' SUMMARY');
  console.log(line);
  console.log(` ✓ Passed:  ${passed}`);
  console.log(` ✗ Failed:  ${failed}`);
  console.log(` Total:     ${total}`);
  console.log(` Pass rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log(` Duration:  ${(durationMs / 1000).toFixed(2)}s`);
  console.log(` Report:    ${reportFile}`);
  console.log(line);
  console.log('');
  console.log(`▶ Load phase: ${fmt(loadPhase.requests)} requests · ${loadPhase.rps} req/s · p95 ${loadPhase.p95Ms}ms · ${loadPhase.errorRate}% errors`);
  for (const check of checks) {
    const icon = check.passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`  ${icon} ${check.name}: ${check.measured} (${check.threshold})`);
  }
  console.log(line);
}

async function main() {
  const options = parseArgs(process.argv);
  const startedAt = new Date().toISOString();

  if (!fs.existsSync(options.distDir)) {
    console.warn(`⚠ ${options.distDir}/ not found — run "npm run build" first for asset discovery`);
  }
  const assets = discoverAssets(options.distDir);
  const scenarios = buildScenarios({
    baseUrl: options.baseUrl,
    distDir: options.distDir,
    count: options.scenarios,
  });

  if (options.list) {
    console.log(`\nA2ZEE load test catalogue — ${scenarios.length} scenarios\n`);
    for (const scenario of scenarios) {
      console.log(
        `  ${scenario.id.padEnd(7)} ${scenario.method.padEnd(4)} ${scenario.path.padEnd(42)} ${scenario.title}`
      );
    }
    console.log(`\nAssets discovered: JS ${assets.js.file}, CSS ${assets.css.file}, images ${assets.images.length}\n`);
    return;
  }

  console.log(`▶ Load test: ${scenarios.length} scenarios · ${options.concurrency} concurrent · target ${options.baseUrl}`);
  console.log(`▶ Assets: ${assets.js.file} · ${assets.css.file} · ${assets.images.length} images`);

  if (!options.dryRun) {
    await ensureServer(options.baseUrl);
  }

  const phaseStart = Date.now();
  let passed = 0;
  let failed = 0;

  // Results complete out of order under concurrency; buffer them so the log
  // reads sequentially like a classic test runner.
  let nextToPrint = 1;
  const pending = new Map();

  const flush = () => {
    while (pending.has(nextToPrint)) {
      const result = pending.get(nextToPrint);
      pending.delete(nextToPrint);
      if (result.status === 'PASS') passed += 1;
      else failed += 1;
      const icon = result.status === 'PASS' ? `${GREEN}✓ PASS${RESET}` : `${RED}✗ FAIL${RESET}`;
      const suffix = result.status === 'PASS' ? '' : ` — ${result.error}`;
      console.log(
        `[${String(nextToPrint).padStart(3, '0')}/${scenarios.length}] ${result.id} ${result.title} ... ${icon} (${result.latencyMs}ms)${suffix}`
      );
      nextToPrint += 1;
    }
  };

  const results = await runScenarios(scenarios, {
    concurrency: options.concurrency,
    timeoutMs: CONFIG.requestTimeoutMs,
    onResult: (result, index) => {
      pending.set(index, result);
      flush();
    },
  });

  const durationMs = Date.now() - phaseStart;

  /* ---------------- sustained load phase ---------------- */
  const endpoints = scenarios
    .filter((scenario) => scenario.profile !== '404' && scenario.method !== 'HEAD')
    .map((scenario) => ({ url: scenario.url, path: scenario.path }));

  console.log('');
  console.log(`▶ Sustained load: ${options.users} virtual users for ${options.duration}s`);

  const loadPhase = options.dryRun
    ? {
        users: options.users,
        durationSeconds: 0,
        requests: 0,
        rps: 0,
        bytes: 0,
        throughputMbps: 0,
        averageMs: 0,
        p50Ms: 0,
        p95Ms: 0,
        p99Ms: 0,
        maxMs: 0,
        errors: 0,
        errorRate: 0,
        statuses: {},
        buckets: [],
      }
    : await runLoadPhase({
        endpoints: endpoints.length ? endpoints : [{ url: `${options.baseUrl}/`, path: '/' }],
        users: options.users,
        durationSeconds: options.duration,
        timeoutMs: CONFIG.requestTimeoutMs,
      });

  const checks = buildChecks(loadPhase);
  const finishedAt = new Date().toISOString();
  const meta = buildMeta(options, startedAt, finishedAt);
  const report = {
    meta,
    results,
    endpoints: aggregateByEndpoint(results),
    loadPhase,
    checks,
  };

  fs.mkdirSync(options.reportDir, { recursive: true });
  const reportFile = writeWorkbook(report, path.join(options.reportDir, REPORT_FILES.xlsx));
  writeCsv(results, path.join(options.reportDir, REPORT_FILES.csv));
  writeJson(report, path.join(options.reportDir, REPORT_FILES.json));
  writeSummaryMarkdown(report, path.join(options.reportDir, REPORT_FILES.markdown));

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    try {
      fs.appendFileSync(summaryFile, `${summaryMarkdown(report)}\n`);
    } catch (error) {
      console.warn(`Could not write job summary: ${error.message}`);
    }
  }

  printSummary({
    total: results.length,
    passed,
    failed,
    durationMs,
    reportFile: path.resolve(reportFile),
    checks,
    loadPhase,
  });

  if (failed > 0) {
    console.log('\nFailing scenarios:');
    for (const result of results.filter((entry) => entry.status === 'FAIL')) {
      console.log(`  ✗ ${result.id} ${result.title} — ${result.error}`);
    }
  }

  const sloFailed = checks.some((check) => !check.passed);
  if (failed > 0 || sloFailed) process.exit(1);
  process.exit(0);
}

main().catch((error) => {
  console.error('\n✗ Load test crashed:', error.stack || error.message);
  process.exit(1);
});
