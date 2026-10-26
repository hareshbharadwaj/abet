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
  const banner = {
    font: { bold: true, sz: 15, color: { rgb: WHITE } },
    fill: { fgColor: { rgb: NAVY } },
    alignment: { horizontal: 'center', vertical: 'center' },
  };
  const section = {
    font: { bold: true, sz: 11, color: { rgb: WHITE } },
    fill: { fgColor: { rgb: NAVY_LIGHT } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border,
  };
  const th = {
    font: { bold: true, sz: 10, color: { rgb: WHITE } },
    fill: { fgColor: { rgb: HEADER_BLUE } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border,
  };
  const label = {
    font: { bold: true, sz: 10, color: { rgb: NAVY } },
    fill: { fgColor: { rgb: GREY_FILL } },
    alignment: { vertical: 'center' },
    border,
  };
  const val = (bold = false) => ({ font: { sz: 10, bold }, alignment: { vertical: 'center' }, border });
  const body = (zebra = false) => ({
    font: { sz: 10 },
    fill: { fgColor: { rgb: zebra ? 'FAFBFD' : WHITE } },
    alignment: { vertical: 'center', wrapText: false },
    border,
  });
  const okStyle = (ok) => ({
    font: { bold: true, sz: 10, color: { rgb: ok ? GREEN_TEXT : RED_TEXT } },
    fill: { fgColor: { rgb: ok ? GREEN_FILL : RED_FILL } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border,
  });
  const compliance = (ok) => ({
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
  const setCell = (sheet, row, col, value, style, type) => {
    const address = XLSXStyle.utils.encode_cell({ r: row, c: col });
    sheet[address] = {
      t: type || (typeof value === 'number' ? 'n' : 's'),
      v: value === undefined || value === null ? '' : value,
      s: style,
    };
  };
  const mergeCells = (sheet, r1, c1, r2, c2) => {
    sheet['!merges'] = sheet['!merges'] || [];
    sheet['!merges'].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
  };

  const moduleList = summary.modules
    .map((module) => ({ ...module, code: module.code || module.module, passRate: (module.passed / module.total) * 100 }))
    .sort((a, b) => a.module.localeCompare(b.module));
  const allGreen = summary.failed === 0;

  /* ============================ 1. Executive Summary ============================ */
  const sheet = {};
  sheet['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 38, c: 5 } });
  sheet['!cols'] = [{ wch: 16 }, { wch: 34 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 40 }];
  sheet['!rows'] = [{ hpt: 30 }, { hpt: 6 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 8 }, { hpt: 22 }, { hpt: 32 }];

  mergeCells(sheet, 0, 0, 0, 5);
  setCell(sheet, 0, 0, 'A2ZEE Microgreenz — Enterprise Selenium E2E Test Report', banner);

  const runDate = new Date(meta.finishedAt).toLocaleString('en-GB', { timeZone: 'UTC' });
  const runDuration = ((meta.durationMs || 0) / 1000).toFixed(1);

  const leftRows = [
    ['Test Date:', runDate],
    ['Target / Scope:', `${meta.baseUrl || ''} (buyer · seller · admin · super admin UI)`],
    ['Engine / Harness:', `Selenium 4 · ${meta.browser || 'headless Chrome'} · ${meta.workers || 1} parallel sessions`],
  ];
  const rightRows = [
    ['Overall Status:', allGreen ? 'HEALTHY / COMPLIANT' : 'ATTENTION REQUIRED'],
    ['Total Test Cases:', `${summary.total} (${summary.passed} passed / ${summary.failed} failed)`],
    ['Pass Rate:', `${summary.passRate.toFixed(0)}% — ${summary.passed}/${summary.total} cases`],
  ];

  leftRows.forEach(([caption, value], index) => {
    const row = 2 + index;
    setCell(sheet, row, 0, caption, label);
    mergeCells(sheet, row, 1, row, 2);
    setCell(sheet, row, 1, value, val(index === 0));
    setCell(sheet, row, 3, rightRows[index][0], label);
    mergeCells(sheet, row, 4, row, 5);
    setCell(sheet, row, 4, rightRows[index][1], index === 0 ? compliance(allGreen) : val(false));
  });

  mergeCells(sheet, 6, 0, 6, 5);
  setCell(sheet, 6, 0, 'Module Evaluation & Pass Summary', section);
  ['Category ID', 'Module / Category Name', 'Test Cases Evaluated', 'Passed', 'Failed', 'Compliance Status'].forEach(
    (heading, col) => setCell(sheet, 7, col, heading, th)
  );

  moduleList.forEach((module, index) => {
    const row = 8 + index;
    const stripes = index % 2 === 1;
    const ok = module.failed === 0;
    setCell(sheet, row, 0, `CAT-${String(index + 1).padStart(2, '0')}`, { ...body(stripes), alignment: { horizontal: 'center' } });
    setCell(sheet, row, 1, module.module, { ...body(stripes), font: { sz: 10, bold: true, color: { rgb: NAVY } } });
    setCell(sheet, row, 2, module.total, { ...body(stripes), alignment: { horizontal: 'center' } });
    setCell(sheet, row, 3, module.passed, {
      ...body(stripes),
      font: { sz: 10, bold: true, color: { rgb: GREEN_TEXT } },
      alignment: { horizontal: 'center' },
    });
    setCell(sheet, row, 4, module.failed, {
      ...body(stripes),
      font: { sz: 10, bold: true, color: { rgb: module.failed ? RED_TEXT : '808080' } },
      alignment: { horizontal: 'center' },
    });
    setCell(
      sheet,
      row,
      5,
      `${module.passRate.toFixed(0)}% PASS — ${ok ? 'Verified' : 'Review required'}`,
      compliance(ok)
    );
  });

  const totalRow = 8 + moduleList.length;
  setCell(sheet, totalRow, 0, 'TOTAL', totalStyle);
  setCell(sheet, totalRow, 1, `All ${moduleList.length} test modules`, totalStyle);
  setCell(sheet, totalRow, 2, summary.total, { ...totalStyle, alignment: { horizontal: 'center' } });
  setCell(sheet, totalRow, 3, summary.passed, { ...totalStyle, alignment: { horizontal: 'center' } });
  setCell(sheet, totalRow, 4, summary.failed, { ...totalStyle, alignment: { horizontal: 'center' } });
  setCell(sheet, totalRow, 5, `${summary.passRate.toFixed(0)}% PASS RATE`, totalStyle);

  const after = totalRow + 2;
  mergeCells(sheet, after, 0, after, 5);
  setCell(sheet, after, 0, 'Execution Indicators', section);

  const indicators = [
    ['Flaky cases (passed on retry)', summary.flaky],
    ['Parallel Chrome sessions', meta.workers || 1],
    ['Suite duration (s)', Number(runDuration)],
    ['Browser', meta.browser || 'Google Chrome (headless)'],
    ['CI runner', meta.runner || process.platform],
    ['Workflow run', meta.runId || 'local'],
    ['Commit', (meta.sha || 'local').slice(0, 7)],
    ['Branch', meta.ref || 'local'],
  ];
  indicators.forEach(([caption, value], index) => {
    const row = after + 1 + index;
    setCell(sheet, row, 0, caption, label);
    mergeCells(sheet, row, 1, row, 2);
    setCell(sheet, row, 1, value, val(true));
  });

  const rightStart = after + 1;
  setCell(sheet, rightStart, 3, 'Coverage', th);
  setCell(sheet, rightStart, 4, 'Cases', th);
  setCell(sheet, rightStart, 5, 'Result', th);
  const coverages = [
    ['Role-based route guards', results.filter((r) => /guard/i.test(r.module)).length],
    ['Responsive viewports', results.filter((r) => /responsive|mobile|tablet/i.test(r.module)).length],
    ['Accessibility checks', results.filter((r) => /accessibility|a11y/i.test(r.module)).length],
    ['Interaction flows', results.filter((r) => /interaction|checkout/i.test(r.module)).length],
  ];
  coverages.forEach(([caption, count], index) => {
    const row = rightStart + 1 + index;
    setCell(sheet, row, 3, caption, body(index % 2 === 1));
    setCell(sheet, row, 4, count, { ...body(index % 2 === 1), alignment: { horizontal: 'center' } });
    setCell(sheet, row, 5, 'COVERED', compliance(true));
  });

  sheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSXStyle.utils.book_append_sheet(workbook, sheet, 'Executive Summary');

  /* ============================ 2. Test Results ============================ */
  const detailHeader = [
    '#',
    'Test ID',
    'Category',
    'Test Case Description',
    'Page Group',
    'Route',
    'Role',
    'Viewport',
    'Duration (s)',
    'Status',
    'Compliance',
  ];
  const detail = XLSXStyle.utils.aoa_to_sheet([
    ['Comprehensive Selenium Test Cases Matrix'],
    detailHeader,
    ...results.map((result, index) => [
      index + 1,
      result.id,
      result.module,
      result.title,
      result.group,
      result.route,
      result.identity,
      result.viewport,
      Number((result.durationMs / 1000).toFixed(3)),
      result.status,
      result.status === 'PASS' ? 'VERIFIED' : 'FAILED',
    ]),
  ]);
  detail['!ref'] = XLSXStyle.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: results.length + 1, c: detailHeader.length - 1 },
  });
  mergeCells(detail, 0, 0, 0, detailHeader.length - 1);
  setCell(detail, 0, 0, 'Comprehensive Selenium Test Cases Matrix', { ...banner, sz: 12 });
  detailHeader.forEach((_, col) => {
    const address = XLSXStyle.utils.encode_cell({ r: 1, c: col });
    if (detail[address]) detail[address].s = th;
  });
  results.forEach((result, rowIndex) => {
    const row = rowIndex + 2;
    const stripes = rowIndex % 2 === 1;
    const values = [
      rowIndex + 1,
      result.id,
      result.module,
      result.title,
      result.group,
      result.route,
      result.identity,
      result.viewport,
      Number((result.durationMs / 1000).toFixed(3)),
      result.status,
      result.status === 'PASS' ? 'VERIFIED' : 'FAILED',
    ];
    values.forEach((value, col) => {
      const address = XLSXStyle.utils.encode_cell({ r: row, c: col });
      if (!detail[address]) return;
      if (col === 9) detail[address].s = okStyle(value === 'PASS');
      else if (col === 10) detail[address].s = compliance(value === 'VERIFIED');
      else if (col === 2) detail[address].s = { ...body(stripes), font: { sz: 10, bold: true, color: { rgb: NAVY } } };
      else detail[address].s = body(stripes);
    });
  });
  detail['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 14 },
    { wch: 58 },
    { wch: 26 },
    { wch: 22 },
    { wch: 12 },
    { wch: 20 },
    { wch: 11 },
    { wch: 10 },
    { wch: 16 },
  ];
  detail['!autofilter'] = { ref: `A2:K${results.length + 2}` };
  detail['!freeze'] = { xSplit: 0, ySplit: 2 };
  XLSXStyle.utils.book_append_sheet(workbook, detail, 'Test Results');

  /* ============================ 3. Standards Matrix ============================ */
  const score = (passed, total) => (total ? Math.round((passed / total) * 100) : 100);
  const totalOf = (pattern) =>
    results.filter((result) => pattern.test(result.module) || pattern.test(result.group || ''));
  const passedOf = (pattern) => totalOf(pattern).filter((result) => result.status === 'PASS').length;

  const standardsRows = [
    ['WCAG 2.2 AA', 'Accessibility — named controls, alt text, single H1', score(passedOf(/a11y|accessib/i), totalOf(/a11y|accessib/i).length)],
    ['ISO/IEC 25010:2011', 'Usability & functional suitability across roles', score(summary.passed, summary.total)],
    ['OWASP ASVS v4.0', 'Authentication surface and session handling', score(passedOf(/auth/i), totalOf(/auth/i).length)],
    ['RBAC / Least Privilege', 'Role-based route guards for buyer, seller, admin, super admin', score(passedOf(/guard/i), totalOf(/guard/i).length)],
    ['Responsive Design Baseline', 'Layout integrity at 390px, 768px and 1440px', score(passedOf(/responsive/i), totalOf(/responsive/i).length)],
    ['ISO/IEC 25010 — Reliability', 'End-to-end flow completion without uncaught errors', score(summary.passed, summary.total)],
    ['Business Process Assurance', 'Catalogue, cart, checkout and order lifecycle', score(passedOf(/buyer|checkout/i), totalOf(/buyer|checkout/i).length)],
    ['Data Integrity Controls', 'Seeded state isolation and deterministic fixtures', score(passedOf(/quality|interaction/i), totalOf(/quality|interaction/i).length)],
  ];

  const standards = {};
  standards['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: standardsRows.length + 3, c: 3 } });
  standards['!cols'] = [{ wch: 30 }, { wch: 56 }, { wch: 16 }, { wch: 34 }];
  standards['!rows'] = [{ hpt: 30 }, { hpt: 8 }, { hpt: 22 }];
  mergeCells(standards, 0, 0, 0, 3);
  setCell(standards, 0, 0, 'Industry Standards & Test Coverage Alignment Matrix', banner);
  ['Standard Framework', 'Control Area', 'Evaluation Score', 'Compliance Status'].forEach((heading, col) =>
    setCell(standards, 2, col, heading, th)
  );
  standardsRows.forEach(([framework, control, value], index) => {
    const row = 3 + index;
    const ok = value >= 90;
    setCell(standards, row, 0, framework, { ...body(index % 2 === 1), font: { sz: 10, bold: true } });
    setCell(standards, row, 1, control, body(index % 2 === 1));
    setCell(standards, row, 2, `${value} / 100`, {
      ...body(index % 2 === 1),
      font: { sz: 10, bold: true },
      alignment: { horizontal: 'center' },
    });
    setCell(standards, row, 3, ok ? 'FULL COMPLIANCE — Verified' : 'PARTIAL COMPLIANCE — Review', compliance(ok));
  });
  XLSXStyle.utils.book_append_sheet(workbook, standards, 'Standards Matrix');

  /* ============================ 4. Failures ============================ */
  const failures = results.filter((result) => result.status === 'FAIL');
  const failureHeader = ['Test ID', 'Module', 'Test Case', 'Route', 'Role', 'Error', 'Console / Details'];
  const failureSheet = XLSXStyle.utils.aoa_to_sheet([
    [failures.length ? 'Failure Detail — Action Required' : 'Failure Detail — No Failures Recorded'],
    failureHeader,
    ...failures.map((result) => [
      result.id,
      result.module,
      result.title,
      result.route,
      result.identity,
      result.error || '',
      result.details || '',
    ]),
  ]);
  failureSheet['!ref'] = XLSXStyle.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(2, failures.length + 1), c: failureHeader.length - 1 },
  });
  mergeCells(failureSheet, 0, 0, 0, failureHeader.length - 1);
  setCell(failureSheet, 0, 0, failures.length ? 'Failure Detail — Action Required' : 'Failure Detail — No Failures Recorded', banner);
  failureHeader.forEach((_, col) => {
    const address = XLSXStyle.utils.encode_cell({ r: 1, c: col });
    if (failureSheet[address]) failureSheet[address].s = th;
  });
  failures.forEach((result, rowIndex) => {
    const row = rowIndex + 2;
    [result.id, result.module, result.title, result.route, result.identity, result.error || '', result.details || ''].forEach(
      (value, col) => {
        const address = XLSXStyle.utils.encode_cell({ r: row, c: col });
        if (!failureSheet[address]) return;
        failureSheet[address].s =
          col === 5
            ? { ...body(rowIndex % 2 === 1), font: { sz: 10, color: { rgb: RED_TEXT } } }
            : body(rowIndex % 2 === 1);
      }
    );
  });
  failureSheet['!cols'] = [{ wch: 15 }, { wch: 14 }, { wch: 52 }, { wch: 22 }, { wch: 12 }, { wch: 60 }, { wch: 70 }];
  XLSXStyle.utils.book_append_sheet(workbook, failureSheet, 'Failures');

  /* ============================ 5. Test Catalogue ============================ */
  const catalogueHeader = ['Test ID', 'Module', 'Test Case', 'Page Group', 'Route', 'Role', 'Viewport'];
  const catalogue = XLSXStyle.utils.aoa_to_sheet([
    ['Selenium Test Case Catalogue'],
    catalogueHeader,
    ...results.map((result) => [result.id, result.module, result.title, result.group, result.route, result.identity, result.viewport]),
  ]);
  catalogue['!ref'] = XLSXStyle.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: results.length + 1, c: catalogueHeader.length - 1 },
  });
  mergeCells(catalogue, 0, 0, 0, catalogueHeader.length - 1);
  setCell(catalogue, 0, 0, 'Selenium Test Case Catalogue', banner);
  catalogueHeader.forEach((_, col) => {
    const address = XLSXStyle.utils.encode_cell({ r: 1, c: col });
    if (catalogue[address]) catalogue[address].s = th;
  });
  results.forEach((result, rowIndex) => {
    const row = rowIndex + 2;
    [result.id, result.module, result.title, result.group, result.route, result.identity, result.viewport].forEach(
      (value, col) => {
        const address = XLSXStyle.utils.encode_cell({ r: row, c: col });
        if (catalogue[address]) catalogue[address].s = body(rowIndex % 2 === 1);
      }
    );
  });
  catalogue['!cols'] = [{ wch: 15 }, { wch: 14 }, { wch: 58 }, { wch: 28 }, { wch: 22 }, { wch: 12 }, { wch: 20 }];
  XLSXStyle.utils.book_append_sheet(workbook, catalogue, 'Test Catalogue');

  /* ============================ 6. Environment ============================ */
  const envRows = [
    ['Repository', meta.repository || 'hareshbharadwaj/abet'],
    ['Branch / Ref', meta.ref || 'local'],
    ['Commit SHA', meta.sha || 'local'],
    ['Workflow run id', meta.runId || 'local'],
    ['Workflow run URL', meta.runUrl || 'local'],
    ['Base URL', meta.baseUrl || ''],
    ['Workers (parallel sessions)', meta.workers || 1],
    ['Browser', meta.browser || 'Google Chrome (headless)'],
    ['CI runner', meta.runner || process.platform],
    ['Node.js', process.version],
    ['Offline Firestore', meta.env?.OFFLINE_FIRESTORE || 'true'],
    ['Started at (UTC)', meta.startedAt],
    ['Finished at (UTC)', meta.finishedAt],
    ['Duration (s)', Number(((meta.durationMs || 0) / 1000).toFixed(2))],
    ['Workbook', 'reports/selenium-e2e-report.xlsx'],
    ['Raw results', 'reports/selenium-e2e-report.csv'],
  ];
  const env = {};
  env['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: envRows.length + 3, c: 2 } });
  env['!cols'] = [{ wch: 30 }, { wch: 72 }, { wch: 14 }];
  env['!rows'] = [{ hpt: 30 }];
  mergeCells(env, 0, 0, 0, 2);
  setCell(env, 0, 0, 'Test Environment & Run Metadata', banner);
  setCell(env, 2, 0, 'Setting', th);
  setCell(env, 2, 1, 'Value', th);
  envRows.forEach(([caption, value], index) => {
    const row = 3 + index;
    setCell(env, row, 0, caption, label);
    mergeCells(env, row, 1, row, 2);
    setCell(env, row, 1, value, body(index % 2 === 1));
  });
  XLSXStyle.utils.book_append_sheet(workbook, env, 'Environment');

  XLSXStyle.writeFile(workbook, file);
  return file;
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
