#!/usr/bin/env node
/**
 * A2ZEE Microgreenz — vulnerability / security audit suite.
 *
 * Usage:
 *   node tests/security/security-suite.js --list
 *   node tests/security/security-suite.js
 *   node tests/security/security-suite.js --base-url=http://127.0.0.1:4173 --fail-on=critical
 *
 * The suite audits the real source tree, the production bundle and the live
 * preview server. Exit code:
 *   0  no finding at or above the --fail-on severity
 *   1  findings at or above the threshold (use --fail-on=none to always pass)
 */
import fs from 'fs';
import path from 'path';
import { CATEGORIES, allChecks } from './cases/catalogue.js';
import { createTarget } from './lib/target.js';
import {
  summaryMarkdown,
  summarise,
  writeCsv,
  writeJson,
  writeSummaryMarkdown,
  writeWorkbook,
} from './lib/report.js';

const GREEN = process.stdout.isTTY ? '\u001b[32m' : '';
const RED = process.stdout.isTTY ? '\u001b[31m' : '';
const DIM = process.stdout.isTTY ? '\u001b[2m' : '';
const RESET = process.stdout.isTTY ? '\u001b[0m' : '';

const REPORT_FILES = {
  xlsx: 'Vulnerability_Test_Report.xlsx',
  csv: 'vulnerability-test-results.csv',
  json: 'vulnerability-test-results.json',
  markdown: 'vulnerability-summary.md',
};

const SEVERITY_ORDER = { none: 99, critical: 0, high: 1, medium: 2, low: 3 };

function parseArgs(argv) {
  const options = {
    list: false,
    baseUrl: process.env.E2E_BASE_URL || 'http://127.0.0.1:4173',
    reportDir: process.env.SEC_REPORT_DIR || 'reports',
    distDir: process.env.SEC_DIST_DIR || 'dist',
    category: '',
    failOn: process.env.SEC_FAIL_ON || 'critical',
  };
  for (const arg of argv.slice(2)) {
    const [key, rawValue] = arg.split('=');
    const value = rawValue === undefined ? true : rawValue;
    switch (key) {
      case '--list':
        options.list = true;
        break;
      case '--base-url':
        options.baseUrl = String(value);
        break;
      case '--report-dir':
        options.reportDir = String(value);
        break;
      case '--dist-dir':
        options.distDir = String(value);
        break;
      case '--category':
        options.category = String(value).toUpperCase();
        break;
      case '--fail-on':
        options.failOn = String(value).toLowerCase();
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
A2ZEE security audit suite

  --list                 Print the 350-control catalogue
  --category <CAT-01>    Run a single category
  --base-url <url>       Live application URL for HTTP header checks
  --report-dir <dir>     Report output directory
  --fail-on <severity>   critical | high | medium | low | none  (default critical)
`);
}

/** OWASP/ISO/GDPR alignment derived from the real category outcomes. */
function buildStandards(results) {
  const rate = (pattern) => {
    const rows = results.filter(
      (result) => pattern.test(result.category) || pattern.test(result.categoryName) || pattern.test(result.owasp || '')
    );
    if (!rows.length) return 100;
    return Math.round((rows.filter((row) => row.status === 'PASS').length / rows.length) * 100);
  };
  const overall = Math.round((results.filter((row) => row.status === 'PASS').length / results.length) * 100);

  return [
    { framework: 'OWASP Top 10 (2021)', control: 'A01:2021 — Broken Access Control', score: rate(/CAT-02/) },
    { framework: 'OWASP Top 10 (2021)', control: 'A02:2021 — Cryptographic Failures', score: rate(/CAT-08/) },
    { framework: 'OWASP Top 10 (2021)', control: 'A03:2021 — Injection', score: rate(/CAT-04|CAT-05/) },
    { framework: 'OWASP Top 10 (2021)', control: 'A05:2021 — Security Misconfiguration', score: rate(/CAT-06/) },
    { framework: 'OWASP Top 10 (2021)', control: 'A07:2021 — Identification & Authentication Failures', score: rate(/CAT-01|CAT-03/) },
    { framework: 'OWASP Top 10 (2021)', control: 'A09:2021 — Logging & Monitoring Failures', score: rate(/CAT-10/) },
    { framework: 'OWASP Top 10 (2021)', control: 'A10:2021 — SSRF / Integrity Failures', score: rate(/CAT-07/) },
    { framework: 'OWASP ASVS v4.0', control: 'V2 Authentication / V3 Session Management', score: rate(/CAT-01|CAT-03/) },
    { framework: 'OWASP ASVS v4.0', control: 'V4 Access Control / V5 Validation', score: rate(/CAT-02|CAT-04/) },
    { framework: 'ISO/IEC 27001:2022', control: 'A.8.5 Secure Authentication', score: rate(/CAT-01/) },
    { framework: 'ISO/IEC 27001:2022', control: 'A.8.9 Configuration Management', score: rate(/CAT-06|CAT-10/) },
    { framework: 'ISO/IEC 27001:2022', control: 'A.8.24 Use of Cryptography', score: rate(/CAT-08/) },
    { framework: 'ISO/IEC 27001:2022', control: 'A.8.12 Data Leakage Prevention', score: rate(/CAT-09/) },
    { framework: 'GDPR Privacy Standards', control: 'Article 32 — Security of Processing', score: Math.round((rate(/CAT-09/) + rate(/CAT-08/)) / 2) },
    { framework: 'GDPR Privacy Standards', control: 'Article 5 — Data Minimisation', score: rate(/CAT-09/) },
    { framework: 'NIST SSDF (SP 800-218)', control: 'PW.7 Code Review / PW.8 Executable Testing', score: overall },
  ];
}

function printCatalogue() {
  console.log(`\nA2ZEE security audit catalogue — ${allChecks().length} controls\n`);
  for (const category of CATEGORIES) {
    console.log(`${category.id}  ${category.name}  (${category.checks.length} controls)`);
  }
  console.log('\nUse --list --category=CAT-02 to print the individual controls.\n');
}

async function main() {
  const options = parseArgs(process.argv);
  const root = process.cwd();
  const startedAt = new Date().toISOString();

  const target = createTarget({ root, distDir: options.distDir, baseUrl: options.baseUrl });
  let probe = { status: 0 };
  try {
    probe = { status: (await target.fetchLive(options.baseUrl)) || 0 };
  } catch {
    probe = { status: 0 };
  }
  target.probe = probe;

  const categories = options.category
    ? CATEGORIES.filter((category) => category.id === options.category)
    : CATEGORIES;
  const checks = categories.flatMap((category) => category.checks);

  if (options.list) {
    if (options.category) {
      console.log(`\n${options.category} controls\n`);
      for (const check of checks) console.log(`  ${check.id.padEnd(12)} [${check.severity}] ${check.title}`);
      console.log(`\n${checks.length} controls in ${options.category}\n`);
    } else {
      printCatalogue();
    }
    return;
  }

  console.log(`▶ Security audit: ${checks.length} controls · ${categories.length} categories`);
  console.log(`▶ Target: ${options.baseUrl} · source files: ${target.sourceFiles.length} · bundle: ${target.bundleFiles.length} file(s)`);

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    let ok = false;
    let evidence = '';
    try {
      const outcome = await check.run(target);
      ok = Boolean(outcome && outcome.ok);
      evidence = outcome?.evidence || '';
    } catch (error) {
      ok = false;
      evidence = `check could not be evaluated: ${error.message}`;
    }

    if (ok) passed += 1;
    else failed += 1;

    const icon = ok ? `${GREEN}✓ PASS${RESET}` : `${RED}✗ FAIL${RESET}`;
    console.log(
      `[${String(passed + failed).padStart(3, '0')}/${checks.length}] ${check.id} ${check.title} ... ${icon}` +
        (ok ? `${DIM} (${String(evidence).slice(0, 90)})${RESET}` : ` — ${String(evidence).slice(0, 140)}`)
    );

    results.push({
      id: check.id,
      title: check.title,
      category: check.category,
      categoryName: check.categoryName,
      owasp: check.owasp,
      severity: check.severity,
      area: check.area,
      status: ok ? 'PASS' : 'FAIL',
      evidence,
      timestamp: new Date().toISOString(),
    });
  }

  const finishedAt = new Date().toISOString();
  const summary = summarise(results);
  const meta = {
    baseUrl: options.baseUrl,
    repository: process.env.GITHUB_REPOSITORY || 'hareshbharadwaj/abet',
    ref: process.env.GITHUB_REF_NAME || '',
    sha: process.env.GITHUB_SHA || '',
    runId: process.env.GITHUB_RUN_ID || '',
    runnerOs: process.env.RUNNER_OS ? `${process.env.RUNNER_OS}-${process.env.RUNNER_ARCH || ''}` : '',
    nodeVersion: process.version,
    sourceFiles: target.sourceFiles.length,
    bundleFiles: target.bundleFiles,
    startedAt,
    finishedAt,
    durationMs: Date.now() - Date.parse(startedAt),
  };

  const report = { meta, results, standards: buildStandards(results) };

  fs.mkdirSync(options.reportDir, { recursive: true });
  const reportFile = writeWorkbook(report, path.join(options.reportDir, REPORT_FILES.xlsx));
  writeCsv(results, path.join(options.reportDir, REPORT_FILES.csv));
  writeJson(report, path.join(options.reportDir, REPORT_FILES.json));
  writeSummaryMarkdown(report, path.join(options.reportDir, REPORT_FILES.markdown));

  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summaryMarkdown(report)}\n`);
    } catch {
      /* summary is best effort */
    }
  }

  const line = '─'.repeat(62);
  console.log('');
  console.log(line);
  console.log(' SUMMARY');
  console.log(line);
  console.log(` ✓ Passed:  ${summary.passed}`);
  console.log(` ✗ Failed:  ${summary.failed}`);
  console.log(` Total:     ${summary.total}`);
  console.log(` Pass rate: ${summary.passRate.toFixed(1)}%`);
  console.log(` Findings:  ${summary.criticalFindings} critical · ${summary.highFindings} high`);
  console.log(` Report:    ${path.resolve(reportFile)}`);
  console.log(line);

  const threshold = options.failOn;
  const blocking =
    threshold === 'none'
      ? []
      : results.filter(
          (result) =>
            result.status === 'FAIL' &&
            (SEVERITY_ORDER[String(result.severity).toLowerCase()] ?? 4) <= SEVERITY_ORDER[threshold]
        );

  if (results.some((result) => result.status === 'FAIL')) {
    console.log('\nOpen findings:');
    for (const result of results.filter((entry) => entry.status === 'FAIL')) {
      console.log(`  ✗ ${result.id} [${result.severity}] ${result.title}`);
    }
  }

  if (blocking.length > 0) {
    console.log(
      `\n✗ ${blocking.length} finding(s) at or above "${threshold}" severity — failing the run (use --fail-on=none to report only).`
    );
    process.exit(1);
  }

  console.log(`\n✓ No blocking findings at or above "${threshold}" severity.`);
  process.exit(0);
}

main().catch((error) => {
  console.error('\n✗ Security audit crashed:', error.stack || error.message);
  process.exit(1);
});
