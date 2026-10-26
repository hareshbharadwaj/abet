/**
 * Report writers: styled Excel workbook, CSV, JSON, JUnit XML and Markdown.
 */
import fs from 'fs';
import path from 'path';
import XLSXStyle from 'xlsx-js-style';

const COLORS = {
  green: '15803D',
  greenLight: 'DCFCE7',
  red: 'B91C1C',
  redLight: 'FEE2E2',
  amber: 'B45309',
  amberLight: 'FEF3C7',
  slate: '0F172A',
  grey: '64748B',
  light: 'F1F5F9',
  white: 'FFFFFF',
};

const headerStyle = {
  font: { bold: true, color: { rgb: COLORS.white }, sz: 11 },
  fill: { fgColor: { rgb: COLORS.green } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: {
    bottom: { style: 'thin', color: { rgb: COLORS.green } },
  },
};

const titleStyle = {
  font: { bold: true, sz: 16, color: { rgb: COLORS.slate } },
};

const subtitleStyle = {
  font: { bold: true, sz: 12, color: { rgb: COLORS.green } },
};

const statusStyle = (status) => {
  if (status === 'PASS') {
    return {
      font: { bold: true, color: { rgb: COLORS.green } },
      fill: { fgColor: { rgb: COLORS.greenLight } },
    };
  }
  if (status === 'FAIL') {
    return {
      font: { bold: true, color: { rgb: COLORS.red } },
      fill: { fgColor: { rgb: COLORS.redLight } },
    };
  }
  return {
    font: { bold: true, color: { rgb: COLORS.amber } },
    fill: { fgColor: { rgb: COLORS.amberLight } },
  };
};

const textStyle = {
  alignment: { vertical: 'top', wrapText: true },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cell(value, style = {}) {
  const isNumber = typeof value === 'number';
  return {
    v: value === undefined || value === null ? '' : value,
    t: isNumber ? 'n' : 's',
    s: { ...textStyle, ...style },
  };
}

function applyGrid(ws, rows, cols) {
  ws['!cols'] = cols.map((width) => ({ wch: width }));
  const range = XLSXStyle.utils.decode_range(ws['!ref']);
  for (let r = 0; r <= range.e.r; r += 1) {
    for (let c = 0; c <= range.e.c; c += 1) {
      const address = XLSXStyle.utils.encode_cell({ r, c });
      const existing = ws[address];
      if (!existing) {
        ws[address] = cell('');
      }
      if (rows[r] && rows[r][c] && rows[r][c].s) {
        ws[address].s = { ...ws[address].s, ...rows[r][c].s };
      }
    }
  }
}

export function summarise(meta, results) {
  const total = results.length;
  const passed = results.filter((result) => result.status === 'PASS').length;
  const failed = results.filter((result) => result.status === 'FAIL').length;
  const flaky = results.filter((result) => result.flaky).length;
  const passRate = total ? (passed / total) * 100 : 0;

  const modules = new Map();
  for (const result of results) {
    const key = result.module;
    const entry = modules.get(key) || {
      module: key,
      code: result.moduleCode,
      total: 0,
      passed: 0,
      failed: 0,
      durationMs: 0,
    };
    entry.total += 1;
    entry.passed += result.status === 'PASS' ? 1 : 0;
    entry.failed += result.status === 'FAIL' ? 1 : 0;
    entry.durationMs += result.durationMs || 0;
    modules.set(key, entry);
  }

  return {
    total,
    passed,
    failed,
    flaky,
    passRate,
    modules: [...modules.values()].sort((a, b) => a.module.localeCompare(b.module)),
  };
}

export function writeCsv(results, file) {
  ensureDir(path.dirname(file));
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = [
    'Test ID',
    'Module',
    'Test Case',
    'Page Group',
    'Route',
    'Role',
    'Viewport',
    'Status',
    'Duration (s)',
    'Attempts',
    'Flaky',
    'Error',
    'Timestamp',
  ];
  const rows = results.map((result) =>
    [
      result.id,
      result.module,
      result.title,
      result.group,
      result.route,
      result.identity,
      result.viewport,
      result.status,
      (result.durationMs / 1000).toFixed(2),
      result.attempts,
      result.flaky ? 'yes' : 'no',
      result.error || '',
      result.timestamp,
    ].map(escape).join(',')
  );
  fs.writeFileSync(file, [header.map(escape).join(','), ...rows].join('\n'));
  return file;
}

export function writeJson(meta, results, file) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(
    file,
    JSON.stringify({ meta, summary: summarise(meta, results), results }, null, 2)
  );
  return file;
}

export function writeManifest(groups, file) {
  ensureDir(path.dirname(file));
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = ['Test ID', 'Module', 'Test Case', 'Page Group', 'Route', 'Role', 'Viewport'];
  const rows = [];
  for (const group of groups) {
    for (const testCase of group.cases) {
      rows.push(
        [
          testCase.id,
          group.module,
          testCase.title,
          group.title,
          group.path || '/',
          group.identity || 'guest',
          group.viewport || 'desktop',
        ].map(escape).join(',')
      );
    }
  }
  fs.writeFileSync(file, [header.map(escape).join(','), ...rows].join('\n'));
  return file;
}

export function writeXlsx(meta, results, file) {
  ensureDir(path.dirname(file));
  const summary = summarise(meta, results);
  const workbook = XLSXStyle.utils.book_new();

  /* ----------------------------- Summary ----------------------------- */
  const summaryRows = [
    [cell('A2ZEE Microgreenz — Selenium E2E Test Report', titleStyle)],
    [cell(`Generated: ${new Date(meta.finishedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, { font: { color: { rgb: COLORS.grey } } })],
    [],
    [cell('Run information', subtitleStyle)],
    [cell('Field', headerStyle), cell('Value', headerStyle)],
    [cell('Repository'), cell(meta.repository || 'hareshbharadwaj/abet')],
    [cell('Branch / Ref'), cell(meta.ref || '')],
    [cell('Commit'), cell(meta.sha || '')],
    [cell('Workflow run'), cell(meta.runUrl || meta.runId || 'local')],
    [cell('Base URL'), cell(meta.baseUrl || '')],
    [cell('Workers'), cell(meta.workers || 1)],
    [cell('Browser'), cell(meta.browser || 'Google Chrome (headless)')],
    [cell('CI runner'), cell(meta.runner || process.platform)],
    [cell('Duration (s)'), cell(Number(((meta.durationMs || 0) / 1000).toFixed(2)))],
    [],
    [cell('Results', subtitleStyle)],
    [cell('Metric', headerStyle), cell('Value', headerStyle)],
    [cell('Total test cases'), cell(summary.total)],
    [cell('Passed'), cell(summary.passed, statusStyle('PASS'))],
    [cell('Failed'), cell(summary.failed, statusStyle(summary.failed ? 'FAIL' : 'PASS'))],
    [cell('Flaky (passed on retry)'), cell(summary.flaky, statusStyle('SKIP'))],
    [cell('Pass rate (%)'), cell(Number(summary.passRate.toFixed(1)))],
    [cell('Status'), cell(summary.failed === 0 ? 'PASS' : 'FAIL', statusStyle(summary.failed === 0 ? 'PASS' : 'FAIL'))],
    [],
    [cell('Module breakdown', subtitleStyle)],
    [
      cell('Module', headerStyle),
      cell('Total', headerStyle),
      cell('Passed', headerStyle),
      cell('Failed', headerStyle),
      cell('Pass rate (%)', headerStyle),
    ],
    ...summary.modules.map((module) => [
      cell(module.module),
      cell(module.total),
      cell(module.passed, statusStyle('PASS')),
      cell(module.failed, statusStyle(module.failed ? 'FAIL' : 'PASS')),
      cell(Number(((module.passed / module.total) * 100).toFixed(1))),
    ]),
  ];
  const summarySheet = XLSXStyle.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 16 }];
  summarySheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  XLSXStyle.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  /* --------------------------- Test Results --------------------------- */
  const resultHeader = [
    'Test ID',
    'Module',
    'Test Case',
    'Page Group',
    'Route',
    'Role',
    'Viewport',
    'Status',
    'Duration (s)',
    'Attempts',
    'Flaky',
    'Error',
    'Screenshot',
  ];
  const resultRows = [
    resultHeader.map((title) => cell(title, headerStyle)),
    ...results.map((result, index) => [
      cell(result.id),
      cell(result.module),
      cell(result.title),
      cell(result.group),
      cell(result.route),
      cell(result.identity),
      cell(result.viewport),
      cell(result.status, statusStyle(result.status)),
      cell(Number((result.durationMs / 1000).toFixed(3))),
      cell(result.attempts),
      cell(result.flaky ? 'yes' : 'no', result.flaky ? statusStyle('SKIP') : {}),
      cell(result.error || ''),
      cell(result.screenshot ? path.basename(result.screenshot) : ''),
    ]),
  ];
  const resultSheet = XLSXStyle.utils.aoa_to_sheet(resultRows);
  resultSheet['!cols'] = [
    { wch: 12 },
    { wch: 24 },
    { wch: 52 },
    { wch: 30 },
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
    { wch: 9 },
    { wch: 12 },
    { wch: 9 },
    { wch: 8 },
    { wch: 55 },
    { wch: 24 },
  ];
  resultSheet['!autofilter'] = { ref: `A1:M${resultRows.length}` };
  XLSXStyle.utils.book_append_sheet(workbook, resultSheet, 'Test Results');

  /* --------------------------- Module Summary -------------------------- */
  const moduleRows = [
    [
      cell('Module', headerStyle),
      cell('Total', headerStyle),
      cell('Passed', headerStyle),
      cell('Failed', headerStyle),
      cell('Pass rate (%)', headerStyle),
      cell('Avg duration (s)', headerStyle),
    ],
    ...summary.modules.map((module) => [
      cell(module.module),
      cell(module.total),
      cell(module.passed, statusStyle('PASS')),
      cell(module.failed, statusStyle(module.failed ? 'FAIL' : 'PASS')),
      cell(Number(((module.passed / module.total) * 100).toFixed(1))),
      cell(Number((module.durationMs / module.total / 1000).toFixed(3))),
    ]),
  ];
  const moduleSheet = XLSXStyle.utils.aoa_to_sheet(moduleRows);
  moduleSheet['!cols'] = [
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 18 },
  ];
  XLSXStyle.utils.book_append_sheet(workbook, moduleSheet, 'Module Summary');

  /* ------------------------------ Failures ----------------------------- */
  const failures = results.filter((result) => result.status === 'FAIL');
  const failureRows = [
    [
      cell('Test ID', headerStyle),
      cell('Module', headerStyle),
      cell('Test Case', headerStyle),
      cell('Route', headerStyle),
      cell('Role', headerStyle),
      cell('Error', headerStyle),
      cell('Console / Details', headerStyle),
    ],
    ...failures.map((result) => [
      cell(result.id),
      cell(result.module),
      cell(result.title),
      cell(result.route),
      cell(result.identity),
      cell(result.error || '', { font: { color: { rgb: COLORS.red } }, ...textStyle }),
      cell(result.details || ''),
    ]),
  ];
  const failureSheet = XLSXStyle.utils.aoa_to_sheet(failureRows);
  failureSheet['!cols'] = [
    { wch: 12 },
    { wch: 24 },
    { wch: 50 },
    { wch: 18 },
    { wch: 12 },
    { wch: 60 },
    { wch: 70 },
  ];
  XLSXStyle.utils.book_append_sheet(workbook, failureSheet, 'Failures');

  /* ----------------------------- Test Catalogue ------------------------ */
  const catalogRows = [
    [
      cell('Test ID', headerStyle),
      cell('Module', headerStyle),
      cell('Test Case', headerStyle),
      cell('Page Group', headerStyle),
      cell('Route', headerStyle),
      cell('Role', headerStyle),
      cell('Viewport', headerStyle),
    ],
    ...results.map((result) => [
      cell(result.id),
      cell(result.module),
      cell(result.title),
      cell(result.group),
      cell(result.route),
      cell(result.identity),
      cell(result.viewport),
    ]),
  ];
  const catalogSheet = XLSXStyle.utils.aoa_to_sheet(catalogRows);
  catalogSheet['!cols'] = [
    { wch: 12 },
    { wch: 24 },
    { wch: 52 },
    { wch: 30 },
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
  ];
  XLSXStyle.utils.book_append_sheet(workbook, catalogSheet, 'Test Catalogue');

  /* ----------------------------- Environment -------------------------- */
  const envRows = [
    [cell('Environment', subtitleStyle)],
    [cell('Key', headerStyle), cell('Value', headerStyle)],
    ...Object.entries(meta.env || {}).map(([key, value]) => [cell(key), cell(String(value))]),
    [],
    [cell('Coverage by role', subtitleStyle)],
    [cell('Role', headerStyle), cell('Cases', headerStyle)],
    ...roleCoverage(results),
    [],
    [cell('Coverage by viewport', subtitleStyle)],
    [cell('Viewport', headerStyle), cell('Cases', headerStyle)],
    ...viewportCoverage(results),
  ];
  const envSheet = XLSXStyle.utils.aoa_to_sheet(envRows);
  envSheet['!cols'] = [{ wch: 36 }, { wch: 70 }];
  XLSXStyle.utils.book_append_sheet(workbook, envSheet, 'Environment');

  XLSXStyle.writeFile(workbook, file);
  return file;
}

function roleCoverage(results) {
  const map = new Map();
  for (const result of results) map.set(result.identity, (map.get(result.identity) || 0) + 1);
  return [...map.entries()].map(([role, count]) => [cell(role), cell(count)]);
}

function viewportCoverage(results) {
  const map = new Map();
  for (const result of results) map.set(result.viewport, (map.get(result.viewport) || 0) + 1);
  return [...map.entries()].map(([viewport, count]) => [cell(viewport), cell(count)]);
}

export function writeJUnit(meta, results, file) {
  ensureDir(path.dirname(file));
  const summary = summarise(meta, results);
  const escape = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const cases = results
    .map((result) => {
      const time = (result.durationMs / 1000).toFixed(3);
      const failure = result.status === 'FAIL'
        ? `\n      <failure message="${escape(result.error)}" type="AssertionError">${escape(result.details || result.error)}</failure>`
        : '';
      return `    <testcase classname="${escape(result.module)}" name="${escape(`${result.id} ${result.title}`)}" time="${time}">${failure}\n    </testcase>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="A2ZEE Selenium E2E" tests="${summary.total}" failures="${summary.failed}" time="${((meta.durationMs || 0) / 1000).toFixed(3)}">
  <testsuite name="selenium-e2e" tests="${summary.total}" failures="${summary.failed}" skipped="0" time="${((meta.durationMs || 0) / 1000).toFixed(3)}" timestamp="${escape(meta.startedAt)}">
${cases}
  </testsuite>
</testsuites>
`;
  fs.writeFileSync(file, xml);
  return file;
}

export function summaryMarkdown(meta, results) {
  const summary = summarise(meta, results);
  const failures = results.filter((result) => result.status === 'FAIL');
  const statusIcon = summary.failed === 0 ? '✅' : '❌';
  const lines = [
    `## ${statusIcon} Selenium E2E — ${summary.passed}/${summary.total} passed (${summary.passRate.toFixed(1)}%)`,
    '',
    `- **Ref:** \`${meta.ref || 'local'}\` · **Commit:** \`${(meta.sha || 'n/a').slice(0, 7)}\``,
    `- **Base URL:** ${meta.baseUrl}`,
    `- **Duration:** ${((meta.durationMs || 0) / 1000).toFixed(1)}s across ${meta.workers} parallel Chrome sessions`,
    `- **Failed:** ${summary.failed} · **Flaky (passed on retry):** ${summary.flaky}`,
    '',
    '| Module | Cases | Passed | Failed | Pass rate |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...summary.modules.map(
      (module) =>
        `| ${module.module} | ${module.total} | ${module.passed} | ${module.failed} | ${((module.passed / module.total) * 100).toFixed(1)}% |`
    ),
  ];

  if (failures.length) {
    lines.push('', '### Failing cases', '', '| Test | Route | Error |', '| --- | --- | --- |');
    for (const failure of failures.slice(0, 20)) {
      lines.push(
        `| ${failure.id} — ${failure.title} | \`${failure.route}\` | ${String(failure.error).replace(/\|/g, '\\|').slice(0, 160)} |`
      );
    }
    if (failures.length > 20) lines.push(`| … ${failures.length - 20} more | | |`);
  }

  lines.push(
    '',
    '### Reports',
    '',
    '- `reports/selenium-e2e-report.xlsx` — full workbook (Summary, Test Results, Module Summary, Failures, Test Catalogue, Environment)',
    '- `reports/selenium-e2e-report.csv` — flat results',
    '- `reports/selenium-results.json` and `reports/selenium-junit.xml` — machine-readable results',
    ''
  );

  return lines.join('\n');
}

export function writeSummaryMarkdown(meta, results, file) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, summaryMarkdown(meta, results));
  return file;
}
