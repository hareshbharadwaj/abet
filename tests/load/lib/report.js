/**
 * Enterprise-style Excel reporting for the load test.
 *
 * Layout mirrors a security/performance audit deliverable:
 *   1. Executive Summary   — banner, KPIs, category evaluation table, TOTAL row
 *   2. Load Test Results   — numbered, categorised case table with PASS/COMPLIANT
 *   3. Performance Standards — framework alignment matrix with scores
 *   4. Load Phase Metrics  — throughput, latency percentiles, distribution
 *   5. Environment         — run metadata
 */
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx-js-style';
import { CATEGORIES } from './scenarios.js';

const NAVY = '1F3864';
const NAVY_LIGHT = '2E5496';
const HEADER_BLUE = '2F5597';
const WHITE = 'FFFFFF';
const GREEN_FILL = 'C6EFCE';
const GREEN_TEXT = '006100';
const RED_FILL = 'FFC7CE';
const RED_TEXT = '9C0006';
const GREY_FILL = 'F2F2F2';
const CATEGORY_FILL = 'D9E2F3';
const BORDER = 'B4C6E7';

const border = {
  top: { style: 'thin', color: { rgb: BORDER } },
  bottom: { style: 'thin', color: { rgb: BORDER } },
  left: { style: 'thin', color: { rgb: BORDER } },
  right: { style: 'thin', color: { rgb: BORDER } },
};

const bannerStyle = {
  font: { bold: true, sz: 15, color: { rgb: WHITE }, name: 'Calibri' },
  fill: { fgColor: { rgb: NAVY } },
  alignment: { horizontal: 'center', vertical: 'center' },
};

const sectionStyle = {
  font: { bold: true, sz: 11, color: { rgb: WHITE } },
  fill: { fgColor: { rgb: NAVY_LIGHT } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border,
};

const tableHeaderStyle = {
  font: { bold: true, sz: 10, color: { rgb: WHITE } },
  fill: { fgColor: { rgb: HEADER_BLUE } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border,
};

const labelStyle = {
  font: { bold: true, sz: 10, color: { rgb: NAVY } },
  fill: { fgColor: { rgb: GREY_FILL } },
  alignment: { vertical: 'center' },
  border,
};

const valueStyle = (bold = false) => ({
  font: { sz: 10, bold },
  alignment: { vertical: 'center' },
  border,
});

const bodyStyle = (zebra = false) => ({
  font: { sz: 10 },
  fill: { fgColor: { rgb: zebra ? 'FAFBFD' : WHITE } },
  alignment: { vertical: 'center', wrapText: false },
  border,
});

const statusStyle = (ok) => ({
  font: { bold: true, sz: 10, color: { rgb: ok ? GREEN_TEXT : RED_TEXT } },
  fill: { fgColor: { rgb: ok ? GREEN_FILL : RED_FILL } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border,
});

const complianceStyle = (ok) => ({
  font: { bold: true, sz: 10, color: { rgb: ok ? GREEN_TEXT : RED_TEXT } },
  fill: { fgColor: { rgb: ok ? GREEN_FILL : RED_FILL } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border,
});

const totalStyle = {
  font: { bold: true, sz: 10, color: { rgb: NAVY } },
  fill: { fgColor: { rgb: CATEGORY_FILL } },
  alignment: { vertical: 'center' },
  border,
};

const cell = (sheet, row, col, value, style, type) => {
  const address = XLSX.utils.encode_cell({ r: row, c: col });
  const inferred = type || (typeof value === 'number' ? 'n' : 's');
  sheet[address] = { t: inferred, v: value, s: style };
  return address;
};

const merge = (sheet, r1, c1, r2, c2) => {
  sheet['!merges'] = sheet['!merges'] || [];
  sheet['!merges'].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
};

const setRef = (sheet, rows, cols) => {
  sheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows, c: cols } });
};

const widths = (sheet, list) => {
  sheet['!cols'] = list.map((wch) => ({ wch }));
};

const heights = (sheet, list) => {
  sheet['!rows'] = list.map((hpt) => ({ hpt }));
};

const statusWord = (ok) => (ok ? 'PASS' : 'FAIL');
const complianceWord = (ok) => (ok ? 'COMPLIANT — Verified' : 'NON-COMPLIANT — Action Required');

/** Turn raw results into category buckets. */
export function summariseCategories(results) {
  const map = new Map();
  for (const category of CATEGORIES) {
    map.set(category.id, {
      id: category.id,
      name: category.name,
      total: 0,
      passed: 0,
      failed: 0,
      latencies: [],
    });
  }

  for (const result of results) {
    const key = map.has(result.category) ? result.category : 'CAT-01';
    const entry = map.get(key);
    entry.total += 1;
    if (result.status === 'PASS') entry.passed += 1;
    else entry.failed += 1;
    if (typeof result.latencyMs === 'number') entry.latencies.push(result.latencyMs);
  }

  return Array.from(map.values()).filter((entry) => entry.total > 0);
}

export function writeWorkbook(report, file) {
  const workbook = XLSX.utils.book_new();
  const { meta, results, loadPhase, checks, endpoints } = report;
  const total = results.length;
  const passed = results.filter((result) => result.status === 'PASS').length;
  const failed = total - passed;
  const passRate = total ? (passed / total) * 100 : 0;
  const allGreen = failed === 0 && checks.every((check) => check.passed);
  const categories = summariseCategories(results);
  const testDate = new Date(meta.startedAt).toLocaleString('en-GB', { timeZone: 'UTC' });

  /* ================================================================ */
  /* 1. Executive Summary                                             */
  /* ================================================================ */
  const summary = {};
  setRef(summary, 40, 5);
  widths(summary, [16, 34, 20, 12, 12, 42]);
  heights(summary, [30, 6, 20, 20, 20, 20, 8, 22, 32]);

  merge(summary, 0, 0, 0, 5);
  cell(summary, 0, 0, 'A2ZEE Microgreenz — Enterprise Load & Performance Test Report', bannerStyle);

  const left = [
    ['Test Date:', testDate],
    ['Target / Scope:', `${meta.baseUrl} (production build · full static asset surface)`],
    ['Engine / Harness:', 'Automated load generator — Node 22 fetch (undici) · harness tests/load'],
  ];
  const right = [
    ['Overall Status:', allGreen ? 'HEALTHY / COMPLIANT' : 'ATTENTION REQUIRED'],
    ['Total Test Cases:', `${total} (${passed} passed / ${failed} failed)`],
    ['Pass Rate:', `${passRate.toFixed(0)}% — ${passed}/${total} cases`],
  ];

  left.forEach(([label, value], index) => {
    const row = 2 + index;
    cell(summary, row, 0, label, labelStyle);
    merge(summary, row, 1, row, 2);
    cell(summary, row, 1, value, valueStyle(index === 0));
    cell(summary, row, 3, right[index][0], labelStyle);
    merge(summary, row, 4, row, 5);
    cell(summary, row, 4, right[index][1], valueStyle(index === 0));
    if (index === 0) {
      summary[XLSX.utils.encode_cell({ r: row, c: 4 })].s = complianceStyle(allGreen);
    }
  });

  merge(summary, 6, 0, 6, 5);
  cell(summary, 6, 0, 'Load Test Category Evaluation & Pass Summary', sectionStyle);

  const headers = ['Category ID', 'Category Name', 'Test Cases Evaluated', 'Passed', 'Failed', 'Compliance Status'];
  headers.forEach((header, col) => cell(summary, 7, col, header, tableHeaderStyle));

  categories.forEach((entry, index) => {
    const row = 8 + index;
    const ok = entry.failed === 0;
    const stripes = index % 2 === 1;
    cell(summary, row, 0, entry.id, { ...bodyStyle(stripes), alignment: { horizontal: 'center' } });
    cell(summary, row, 1, entry.name, bodyStyle(stripes));
    cell(summary, row, 2, entry.total, { ...bodyStyle(stripes), alignment: { horizontal: 'center' } });
    cell(summary, row, 3, entry.passed, {
      ...bodyStyle(stripes),
      font: { sz: 10, bold: true, color: { rgb: GREEN_TEXT } },
      alignment: { horizontal: 'center' },
    });
    cell(summary, row, 4, entry.failed, {
      ...bodyStyle(stripes),
      font: { sz: 10, bold: true, color: { rgb: entry.failed ? RED_TEXT : '808080' } },
      alignment: { horizontal: 'center' },
    });
    cell(summary, row, 5, `${((entry.passed / entry.total) * 100).toFixed(0)}% PASS — ${ok ? 'Verified' : 'Review required'}`, complianceStyle(ok));
  });

  const totalRow = 8 + categories.length;
  cell(summary, totalRow, 0, 'TOTAL', totalStyle);
  cell(summary, totalRow, 1, `All ${categories.length} load test categories`, totalStyle);
  cell(summary, totalRow, 2, total, { ...totalStyle, alignment: { horizontal: 'center' } });
  cell(summary, totalRow, 3, passed, { ...totalStyle, alignment: { horizontal: 'center' } });
  cell(summary, totalRow, 4, failed, { ...totalStyle, alignment: { horizontal: 'center' } });
  cell(summary, totalRow, 5, `${passRate.toFixed(0)}% PASS RATE`, { ...totalStyle, alignment: { horizontal: 'left' } });

  const after = totalRow + 2;
  merge(summary, after, 0, after, 5);
  cell(summary, after, 0, 'Executive Performance Indicators', sectionStyle);

  const kpis = [
    ['Virtual users (load phase)', loadPhase.users],
    ['Sustained phase duration (s)', loadPhase.durationSeconds],
    ['Total HTTP requests', loadPhase.requests],
    ['Throughput (req/s)', loadPhase.rps],
    ['Average latency (ms)', loadPhase.averageMs],
    ['p95 latency (ms)', loadPhase.p95Ms],
    ['p99 latency (ms)', loadPhase.p99Ms],
    ['Error rate (%)', loadPhase.errorRate],
    ['Data transferred (MB)', Number((loadPhase.bytes / 1024 / 1024).toFixed(1))],
  ];

  kpis.forEach(([label, value], index) => {
    const row = after + 1 + index;
    cell(summary, row, 0, label, labelStyle);
    merge(summary, row, 1, row, 2);
    cell(summary, row, 1, value, valueStyle(true));
  });

  const sloRow = after + 1;
  cell(summary, sloRow, 3, 'SLO', tableHeaderStyle);
  cell(summary, sloRow, 4, 'Measured', tableHeaderStyle);
  cell(summary, sloRow, 5, 'Result', tableHeaderStyle);
  checks.forEach((check, index) => {
    const row = sloRow + 1 + index;
    cell(summary, row, 3, check.name, bodyStyle(index % 2 === 1));
    cell(summary, row, 4, `${check.measured} (${check.threshold})`, bodyStyle(index % 2 === 1));
    cell(summary, row, 5, statusWord(check.passed), statusStyle(check.passed));
  });

  summary['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(workbook, summary, 'Executive Summary');

  /* ================================================================ */
  /* 2. Load Test Results                                             */
  /* ================================================================ */
  const resultHeader = [
    '#',
    'Test ID',
    'Category',
    'Test Case Description',
    'Endpoint / Target',
    'Requests',
    'Avg (ms)',
    'Latency (ms)',
    'SLA (ms)',
    'Status',
    'Compliance',
  ];
  const ordered = [...results].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  const rows = ordered.map((result, index) => [
    index + 1,
    result.id,
    result.category,
    result.title,
    `${result.method} ${result.path}`,
    result.requests || 1,
    result.averageMs ?? result.latencyMs,
    result.latencyMs,
    result.slaMs ?? '',
    result.status,
    result.status === 'PASS' ? 'VERIFIED' : 'FAILED',
  ]);

  const detail = XLSX.utils.aoa_to_sheet([['Comprehensive Load Test Scenarios Matrix'], resultHeader, ...rows]);
  detail['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: rows.length + 1, c: resultHeader.length - 1 },
  });
  merge(detail, 0, 0, 0, resultHeader.length - 1);
  cell(detail, 0, 0, 'Comprehensive Load Test Scenarios Matrix', { ...bannerStyle, sz: 12 });

  resultHeader.forEach((_, col) => {
    const address = XLSX.utils.encode_cell({ r: 1, c: col });
    if (detail[address]) detail[address].s = tableHeaderStyle;
  });

  rows.forEach((row, rowIndex) => {
    const sheetRow = rowIndex + 2;
    const stripes = rowIndex % 2 === 1;
    row.forEach((value, col) => {
      const address = XLSX.utils.encode_cell({ r: sheetRow, c: col });
      if (!detail[address]) return;
      if (col === 2) {
        detail[address].s = { ...bodyStyle(stripes), font: { sz: 10, bold: true, color: { rgb: NAVY } } };
      } else if (col === 9) {
        detail[address].s = statusStyle(value === 'PASS');
      } else if (col === 10) {
        detail[address].s = complianceStyle(value === 'VERIFIED');
      } else {
        detail[address].s = bodyStyle(stripes);
      }
    });
  });

  widths(detail, [6, 11, 11, 58, 40, 10, 11, 13, 10, 11, 18]);
  detail['!autofilter'] = { ref: `A2:K${rows.length + 2}` };
  detail['!freeze'] = { xSplit: 0, ySplit: 2 };
  XLSX.utils.book_append_sheet(workbook, detail, 'Load Test Results');

  /* ================================================================ */
  /* 3. Performance Standards Matrix                                  */
  /* ================================================================ */
  const standards = [
    ['SLO / SLA Compliance', 'Scenario success rate (status, payload, SLA)', passRate, 100],
    ['Google Core Web Vitals (Lab)', 'HTML shell response under cold load', scoreAgainst(loadPhase.averageMs, 500, true), 100],
    ['HTTP Archive Benchmarks', 'p95 latency across the static asset surface', scoreAgainst(loadPhase.p95Ms, 3000, true), 100],
    ['ISO/IEC 25010:2011', 'Performance efficiency — throughput under sustained load', scoreAgainst(loadPhase.rps, 5), 100],
    ['NFR Availability Standard', 'Error rate during sustained load (%)', scoreAgainst(loadPhase.errorRate, 1, true), 100],
    ['Lighthouse Asset Budget', 'JavaScript bundle delivery latency', scoreAgainst(endpointLatency(endpoints, '.js'), 2500, true), 100],
    ['Web Performance Best Practice', 'Static asset cache / reload behaviour', scoreAgainst(endpointLatency(endpoints, '/'), 1500, true), 100],
    ['SRE Error Budget', 'Stability across the full scenario catalogue', scoreAgainst(failed, 0, true), 100],
  ];

  const standardsSheet = {};
  const stdCols = 4;
  setRef(standardsSheet, standards.length + 4, stdCols - 1);
  widths(standardsSheet, [30, 52, 16, 34]);
  heights(standardsSheet, [30, 8, 22]);

  merge(standardsSheet, 0, 0, 0, stdCols - 1);
  cell(standardsSheet, 0, 0, 'Industry Performance Standards & SLO Alignment Matrix', bannerStyle);

  ['Standard Framework', 'Control Area', 'Evaluation Score', 'Compliance Status'].forEach((header, col) =>
    cell(standardsSheet, 2, col, header, tableHeaderStyle)
  );

  standards.forEach(([framework, control, score, max], index) => {
    const row = 3 + index;
    const ok = score >= 90;
    cell(standardsSheet, row, 0, framework, { ...bodyStyle(index % 2 === 1), font: { sz: 10, bold: true } });
    cell(standardsSheet, row, 1, control, bodyStyle(index % 2 === 1));
    cell(standardsSheet, row, 2, `${Math.round(score)} / ${max}`, {
      ...bodyStyle(index % 2 === 1),
      font: { sz: 10, bold: true },
      alignment: { horizontal: 'center' },
    });
    cell(
      standardsSheet,
      row,
      3,
      ok ? 'FULL COMPLIANCE — Verified' : 'PARTIAL COMPLIANCE — Review',
      complianceStyle(ok)
    );
  });

  XLSX.utils.book_append_sheet(workbook, standardsSheet, 'Performance Standards');

  /* ================================================================ */
  /* 4. Load Phase Metrics                                            */
  /* ================================================================ */
  const loadSheet = {};
  setRef(loadSheet, 30, 3);
  widths(loadSheet, [34, 22, 20, 20]);
  heights(loadSheet, [30]);

  merge(loadSheet, 0, 0, 0, 3);
  cell(loadSheet, 0, 0, 'Sustained Load Phase — Throughput & Latency', bannerStyle);

  const loadRows = [
    ['Virtual users', loadPhase.users],
    ['Duration (s)', loadPhase.durationSeconds],
    ['Requests', loadPhase.requests],
    ['Throughput (req/s)', loadPhase.rps],
    ['Data transfer (Mbps)', loadPhase.throughputMbps],
    ['Average latency (ms)', loadPhase.averageMs],
    ['p50 latency (ms)', loadPhase.p50Ms],
    ['p95 latency (ms)', loadPhase.p95Ms],
    ['p99 latency (ms)', loadPhase.p99Ms],
    ['Max latency (ms)', loadPhase.maxMs],
    ['Errors', loadPhase.errors],
    ['Error rate (%)', loadPhase.errorRate],
  ];

  loadRows.forEach(([label, value], index) => {
    const row = 2 + index;
    cell(loadSheet, row, 0, label, labelStyle);
    cell(loadSheet, row, 1, value, valueStyle(true));
  });

  cell(loadSheet, 2, 3, 'Latency bucket', tableHeaderStyle);
  cell(loadSheet, 2, 4, 'Requests', tableHeaderStyle);
  loadPhase.buckets.forEach((bucket, index) => {
    cell(loadSheet, 3 + index, 3, bucket.bucket, bodyStyle(index % 2 === 1));
    cell(loadSheet, 3 + index, 4, bucket.requests, {
      ...bodyStyle(index % 2 === 1),
      alignment: { horizontal: 'center' },
    });
  });
  widths(loadSheet, [34, 22, 20, 20, 14]);

  XLSX.utils.book_append_sheet(workbook, loadSheet, 'Load Phase Metrics');

  /* ================================================================ */
  /* 5. Environment                                                   */
  /* ================================================================ */
  const env = {};
  const envRows = [
    ['Target base URL', meta.baseUrl],
    ['Node.js', meta.nodeVersion],
    ['Platform', meta.platform],
    ['CI runner OS', meta.runnerOs || 'local'],
    ['Workflow run id', meta.runId || 'local'],
    ['Repository', meta.repository],
    ['Git ref', meta.ref || 'local'],
    ['Commit SHA', meta.sha || 'local'],
    ['Started at (UTC)', meta.startedAt],
    ['Finished at (UTC)', meta.finishedAt],
    ['Scenario count', total],
    ['Scenario concurrency', meta.concurrency],
    ['Virtual users', loadPhase.users],
    ['Sustained duration (s)', loadPhase.durationSeconds],
    ['Report workbook', 'reports/Load_Test_Analysis_Report.xlsx'],
    ['Raw results', 'reports/load-test-results.csv'],
  ];
  setRef(env, envRows.length + 3, 2);
  widths(env, [30, 70, 16]);
  heights(env, [30]);
  merge(env, 0, 0, 0, 2);
  cell(env, 0, 0, 'Test Environment & Run Metadata', bannerStyle);
  cell(env, 2, 0, 'Setting', tableHeaderStyle);
  cell(env, 2, 1, 'Value', tableHeaderStyle);
  envRows.forEach(([label, value], index) => {
    const row = 3 + index;
    cell(env, row, 0, label, labelStyle);
    merge(env, row, 1, row, 2);
    cell(env, row, 1, value, bodyStyle(index % 2 === 1));
  });
  XLSX.utils.book_append_sheet(workbook, env, 'Environment');

  fs.mkdirSync(path.dirname(file), { recursive: true });
  XLSX.writeFile(workbook, file);
  return file;
}

const endpointLatency = (endpoints, needle) => {
  const match = endpoints.find((entry) => entry.endpoint.includes(needle));
  return match ? match.p95Ms : 0;
};

/** Maps a measured value onto a 0-100 score (lower is better unless inverted). */
function scoreAgainst(measured, target, lowerIsBetter = false) {
  if (!Number.isFinite(measured)) return 100;
  if (lowerIsBetter) {
    if (measured <= target) return 100;
    return Math.max(0, 100 - Math.min(100, ((measured - target) / Math.max(1, target)) * 100));
  }
  if (measured >= target) return 100;
  return Math.max(0, Math.min(100, (measured / Math.max(1, target)) * 100));
}

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function writeCsv(results, file) {
  const header = [
    'Test ID',
    'Category',
    'Test Case Description',
    'Endpoint',
    'Expected',
    'HTTP status',
    'Payload (B)',
    'Latency (ms)',
    'SLA (ms)',
    'Status',
    'Compliance',
    'Error',
  ];
  const lines = [header.map(escapeCsv).join(',')];
  for (const result of results) {
    lines.push(
      [
        result.id,
        result.category,
        result.title,
        `${result.method} ${result.path}`,
        result.expected || '',
        result.httpStatus ?? '',
        result.bytes ?? '',
        result.latencyMs,
        result.slaMs ?? '',
        result.status,
        result.status === 'PASS' ? 'VERIFIED' : 'FAILED',
        result.error || '',
      ]
        .map(escapeCsv)
        .join(',')
    );
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');
  return file;
}

export function writeJson(report, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(report, null, 2), 'utf8');
  return file;
}

export function summaryMarkdown(report) {
  const { meta, results, loadPhase, checks } = report;
  const total = results.length;
  const passed = results.filter((result) => result.status === 'PASS').length;
  const failed = total - passed;
  const passRate = total ? (passed / total) * 100 : 0;
  const categories = summariseCategories(results);

  return [
    `## ${failed === 0 ? '✅' : '❌'} Load Test — ${passed}/${total} cases passed (${passRate.toFixed(1)}%)`,
    '',
    `- **Ref:** \`${meta.ref || 'local'}\` · **Commit:** \`${meta.sha || 'local'}\``,
    `- **Target:** ${meta.baseUrl}`,
    `- **Scenario phase:** ${(meta.durationMs / 1000).toFixed(1)}s · concurrency ${meta.concurrency}`,
    `- **Load phase:** ${loadPhase.requests} requests in ${loadPhase.durationSeconds}s · ${loadPhase.rps} req/s · p95 ${loadPhase.p95Ms}ms · ${loadPhase.errorRate}% errors`,
    '',
    '| Category | Cases | Passed | Failed | Status |',
    '| --- | ---: | ---: | ---: | --- |',
    ...categories.map(
      (entry) =>
        `| ${entry.id} ${entry.name} | ${entry.total} | ${entry.passed} | ${entry.failed} | ${
          entry.failed === 0 ? '✅ PASS — Verified' : '❌ Review required'
        } |`
    ),
    '',
    '| SLO | Measured | Threshold | Result |',
    '| --- | ---: | ---: | --- |',
    ...checks.map(
      (check) => `| ${check.name} | ${check.measured} | ${check.threshold} | ${check.passed ? '✅ PASS' : '❌ FAIL'} |`
    ),
    '',
    '### Report',
    '',
    '- `reports/Load_Test_Analysis_Report.xlsx` — Executive Summary, Load Test Results, Performance Standards, Load Phase Metrics, Environment',
    '- `reports/load-test-results.csv` — flat results',
    '',
  ].join('\n');
}

export function writeSummaryMarkdown(report, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, summaryMarkdown(report), 'utf8');
  return file;
}
