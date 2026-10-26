/**
 * Styled Excel / CSV / Markdown reporting for the load test.
 *
 * The workbook mirrors the Selenium one: Summary, Scenario Results,
 * Endpoint Metrics, Load Phase and Environment sheets, all styled with
 * xlsx-js-style so the committed file opens as a readable report.
 */
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx-js-style';

const COLORS = {
  brand: '1B4332',
  brandLight: '2D6A4F',
  headerText: 'FFFFFF',
  zebra: 'F3F7F4',
  border: 'C9D6CF',
  pass: 'C8F0D6',
  fail: 'FFD5D5',
  accent: 'D8F3DC',
};

const titleStyle = {
  font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: COLORS.brand } },
  alignment: { horizontal: 'left', vertical: 'center' },
};

const subtitleStyle = {
  font: { italic: true, sz: 10, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: COLORS.brandLight } },
  alignment: { horizontal: 'left', vertical: 'center' },
};

const headerStyle = {
  font: { bold: true, sz: 10, color: { rgb: COLORS.headerText } },
  fill: { fgColor: { rgb: COLORS.brandLight } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: COLORS.border } },
    bottom: { style: 'thin', color: { rgb: COLORS.border } },
    left: { style: 'thin', color: { rgb: COLORS.border } },
    right: { style: 'thin', color: { rgb: COLORS.border } },
  },
};

const bodyStyle = (zebra = false) => ({
  font: { sz: 10 },
  fill: { fgColor: { rgb: zebra ? COLORS.zebra : 'FFFFFF' } },
  alignment: { vertical: 'center', wrapText: false },
  border: {
    top: { style: 'thin', color: { rgb: COLORS.border } },
    bottom: { style: 'thin', color: { rgb: COLORS.border } },
    left: { style: 'thin', color: { rgb: COLORS.border } },
    right: { style: 'thin', color: { rgb: COLORS.border } },
  },
});

const statusStyle = (status, zebra) => ({
  ...bodyStyle(zebra),
  font: { sz: 10, bold: true, color: { rgb: status === 'PASS' ? '14532D' : '991B1B' } },
  fill: { fgColor: { rgb: status === 'PASS' ? COLORS.pass : COLORS.fail } },
  alignment: { horizontal: 'center', vertical: 'center' },
});

const kpiStyle = {
  font: { bold: true, sz: 18, color: { rgb: COLORS.brand } },
  fill: { fgColor: { rgb: COLORS.accent } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: COLORS.border } },
    bottom: { style: 'thin', color: { rgb: COLORS.border } },
    left: { style: 'thin', color: { rgb: COLORS.border } },
    right: { style: 'thin', color: { rgb: COLORS.border } },
  },
};

const labelStyle = {
  font: { bold: true, sz: 10, color: { rgb: COLORS.brand } },
  fill: { fgColor: { rgb: COLORS.accent } },
  alignment: { vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: COLORS.border } },
    bottom: { style: 'thin', color: { rgb: COLORS.border } },
    left: { style: 'thin', color: { rgb: COLORS.border } },
    right: { style: 'thin', color: { rgb: COLORS.border } },
  },
};

const setCell = (sheet, row, col, value, style) => {
  const address = XLSX.utils.encode_cell({ r: row, c: col });
  sheet[address] = {
    t: typeof value === 'number' ? 'n' : 's',
    v: value,
    s: style,
  };
};

const setRow = (sheet, row, values, styleFor) => {
  values.forEach((value, col) => {
    const style = typeof styleFor === 'function' ? styleFor(value, col) : styleFor;
    setCell(sheet, row, col, value ?? '', style);
  });
};

const setRange = (sheet, range) => {
  sheet['!ref'] = range;
};

const applyWidths = (sheet, widths) => {
  sheet['!cols'] = widths.map((wch) => ({ wch }));
};

const finishSheet = (sheet) => {
  sheet['!freeze'] = { xSplit: 0, ySplit: 1 };
};

export function writeWorkbook(report, file) {
  const workbook = XLSX.utils.book_new();
  const { meta, results, loadPhase, checks, endpoints } = report;
  const total = results.length;
  const passed = results.filter((result) => result.status === 'PASS').length;
  const failed = total - passed;
  const passRate = total ? (passed / total) * 100 : 0;

  /* ---------------------------------------------------------------- */
  /* Summary                                                          */
  /* ---------------------------------------------------------------- */
  const summary = {};
  setRange(summary, 'A1:F45');
  summary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } },
  ];

  setCell(summary, 0, 0, 'A2ZEE Microgreenz — Load Test Report', titleStyle);
  setCell(
    summary,
    1,
    0,
    `Generated ${meta.finishedAt} · ${meta.baseUrl} · Node ${meta.nodeVersion}`,
    subtitleStyle
  );
  setCell(summary, 3, 0, 'EXECUTION SUMMARY', labelStyle);

  const kpis = [
    ['Total scenarios', total],
    ['Passed', passed],
    ['Failed', failed],
    ['Pass rate (%)', Number(passRate.toFixed(1))],
    ['Duration (s)', Number((meta.durationMs / 1000).toFixed(2))],
    ['Reported failures', failed],
  ];

  kpis.forEach(([label, value], index) => {
    const row = 5 + index;
    setCell(summary, row, 0, label, labelStyle);
    setCell(summary, row, 1, value, kpiStyle);
  });

  const details = [
    ['Base URL', meta.baseUrl],
    ['Concurrency (scenarios)', meta.concurrency],
    ['Virtual users (load phase)', loadPhase.users],
    ['Load phase duration (s)', loadPhase.durationSeconds],
    ['Total requests', loadPhase.requests],
    ['Throughput (req/s)', loadPhase.rps],
    ['Average latency (ms)', loadPhase.averageMs],
    ['p95 latency (ms)', loadPhase.p95Ms],
    ['Error rate (%)', loadPhase.errorRate],
    ['Browser', meta.browser],
    ['Workflow run', meta.runId || 'local'],
    ['Git ref', meta.ref || 'local'],
    ['Commit', meta.sha || 'local'],
  ];

  details.forEach(([label, value], index) => {
    const row = 5 + index;
    setCell(summary, row, 3, label, labelStyle);
    setCell(summary, row, 4, value, bodyStyle(index % 2 === 0));
  });

  setCell(summary, 20, 0, 'SERVICE LEVEL OBJECTIVES', labelStyle);
  setCell(summary, 21, 0, 'Check', headerStyle);
  setCell(summary, 21, 1, 'Measured', headerStyle);
  setCell(summary, 21, 2, 'Threshold', headerStyle);
  setCell(summary, 21, 3, 'Result', headerStyle);

  checks.forEach((check, index) => {
    const row = 22 + index;
    setCell(summary, row, 0, check.name, bodyStyle(index % 2 === 0));
    setCell(summary, row, 1, check.measured, bodyStyle(index % 2 === 0));
    setCell(summary, row, 2, check.threshold, bodyStyle(index % 2 === 0));
    setCell(summary, row, 3, check.passed ? 'PASS' : 'FAIL', statusStyle(check.passed ? 'PASS' : 'FAIL', false));
  });

  const summaryRow = 24 + checks.length;
  setCell(summary, summaryRow, 0, 'Report', labelStyle);
  setCell(summary, summaryRow, 1, 'reports/Load_Test_Analysis_Report.xlsx', bodyStyle());
  setCell(summary, summaryRow + 1, 0, 'Scenario catalogue', labelStyle);
  setCell(summary, summaryRow + 1, 1, 'reports/load-test-results.csv', bodyStyle());

  applyWidths(summary, [34, 22, 18, 20, 30, 12]);
  finishSheet(summary);
  XLSX.utils.book_append_sheet(workbook, summary, 'Summary');

  /* ---------------------------------------------------------------- */
  /* Scenario Results                                                 */
  /* ---------------------------------------------------------------- */
  const header = [
    'Scenario ID',
    'Scenario',
    'Profile',
    'Method',
    'Endpoint',
    'Expected',
    'HTTP status',
    'Payload (B)',
    'Latency (ms)',
    'SLA (ms)',
    'Status',
    'Error',
  ];
  const rows = results.map((result) => [
    result.id,
    result.title,
    result.profile,
    result.method,
    result.path,
    result.expected,
    result.httpStatus,
    result.bytes,
    result.latencyMs,
    result.slaMs,
    result.status,
    result.error || '',
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  sheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: header.length - 1 } });
  header.forEach((_, col) => {
    sheet[XLSX.utils.encode_cell({ r: 0, c: col })].s = headerStyle;
  });
  rows.forEach((row, rowIndex) => {
    row.forEach((value, col) => {
      const cell = sheet[XLSX.utils.encode_cell({ r: rowIndex + 1, c: col })];
      if (!cell) return;
      cell.s = header[col] === 'Status' ? statusStyle(value, rowIndex % 2 === 0) : bodyStyle(rowIndex % 2 === 0);
    });
  });
  applyWidths(sheet, [12, 38, 12, 9, 38, 10, 12, 12, 12, 10, 10, 46]);
  finishSheet(sheet);
  sheet['!autofilter'] = { ref: `A1:L${rows.length + 1}` };
  XLSX.utils.book_append_sheet(workbook, sheet, 'Scenario Results');

  /* ---------------------------------------------------------------- */
  /* Endpoint Metrics                                                 */
  /* ---------------------------------------------------------------- */
  const endpointHeader = [
    'Endpoint',
    'Requests',
    'Failures',
    'Average (ms)',
    'p95 (ms)',
    'Max (ms)',
    'Avg payload (KB)',
    'HTTP statuses',
  ];
  const endpointRows = endpoints.map((entry) => [
    entry.endpoint,
    entry.requests,
    entry.failures,
    entry.averageMs,
    entry.p95Ms,
    entry.maxMs,
    entry.avgKb,
    entry.statuses,
  ]);
  const endpointSheet = XLSX.utils.aoa_to_sheet([endpointHeader, ...endpointRows]);
  endpointHeader.forEach((_, col) => {
    endpointSheet[XLSX.utils.encode_cell({ r: 0, c: col })].s = headerStyle;
  });
  endpointRows.forEach((row, rowIndex) => {
    row.forEach((value, col) => {
      const cell = endpointSheet[XLSX.utils.encode_cell({ r: rowIndex + 1, c: col })];
      if (cell) cell.s = bodyStyle(rowIndex % 2 === 0);
    });
  });
  applyWidths(endpointSheet, [46, 10, 10, 13, 10, 10, 16, 16]);
  finishSheet(endpointSheet);
  XLSX.utils.book_append_sheet(workbook, endpointSheet, 'Endpoint Metrics');

  /* ---------------------------------------------------------------- */
  /* Load Phase                                                       */
  /* ---------------------------------------------------------------- */
  const loadSheet = {};
  setRange(loadSheet, 'A1:F20');
  loadSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
  ];
  setCell(loadSheet, 0, 0, 'Sustained Load Phase', titleStyle);
  setCell(loadSheet, 2, 0, 'THROUGHPUT AND LATENCY', labelStyle);

  const loadDetails = [
    ['Virtual users', loadPhase.users],
    ['Duration (s)', loadPhase.durationSeconds],
    ['Requests', loadPhase.requests],
    ['Throughput (req/s)', loadPhase.rps],
    ['Data transfer (MB/s)', loadPhase.throughputMbps],
    ['Average latency (ms)', loadPhase.averageMs],
    ['p50 latency (ms)', loadPhase.p50Ms],
    ['p95 latency (ms)', loadPhase.p95Ms],
    ['p99 latency (ms)', loadPhase.p99Ms],
    ['Max latency (ms)', loadPhase.maxMs],
    ['Errors', loadPhase.errors],
    ['Error rate (%)', loadPhase.errorRate],
  ];
  loadDetails.forEach(([label, value], index) => {
    const row = 4 + index;
    setCell(loadSheet, row, 0, label, labelStyle);
    setCell(loadSheet, row, 1, value, kpiStyle);
  });

  setCell(loadSheet, 18, 0, 'LATENCY DISTRIBUTION', labelStyle);
  const bucketTitleRow = 19;
  setCell(loadSheet, bucketTitleRow, 0, 'Bucket', headerStyle);
  setCell(loadSheet, bucketTitleRow, 1, 'Requests', headerStyle);
  loadPhase.buckets.forEach((bucket, index) => {
    setCell(loadSheet, bucketTitleRow + 1 + index, 0, bucket.bucket, bodyStyle(index % 2 === 0));
    setCell(loadSheet, bucketTitleRow + 1 + index, 1, bucket.requests, bodyStyle(index % 2 === 0));
  });

  applyWidths(loadSheet, [34, 22, 14, 14, 14, 14]);
  XLSX.utils.book_append_sheet(workbook, loadSheet, 'Load Phase');

  /* ---------------------------------------------------------------- */
  /* Environment                                                      */
  /* ---------------------------------------------------------------- */
  const envSheet = {};
  setRange(envSheet, 'A1:D40');
  setCell(envSheet, 0, 0, 'Environment', titleStyle);
  envSheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

  const envRows = [
    ['Base URL', meta.baseUrl],
    ['Node.js', meta.nodeVersion],
    ['Platform', meta.platform],
    ['Runner OS', meta.runnerOs || process.platform],
    ['Workflow run id', meta.runId || 'local'],
    ['Repository', meta.repository],
    ['Git ref', meta.ref || 'local'],
    ['Commit SHA', meta.sha || 'local'],
    ['Started at', meta.startedAt],
    ['Finished at', meta.finishedAt],
    ['Scenario count', total],
    ['Concurrency', meta.concurrency],
    ['Load users', loadPhase.users],
    ['Load duration (s)', loadPhase.durationSeconds],
    ['Warm-up', 'none (cold start included)'],
  ];

  setCell(envSheet, 2, 0, 'Setting', headerStyle);
  setCell(envSheet, 2, 1, 'Value', headerStyle);
  envRows.forEach(([label, value], index) => {
    setCell(envSheet, 3 + index, 0, label, labelStyle);
    setCell(envSheet, 3 + index, 1, value, bodyStyle(index % 2 === 0));
  });

  applyWidths(envSheet, [32, 62, 18, 18]);
  finishSheet(envSheet);
  XLSX.utils.book_append_sheet(workbook, envSheet, 'Environment');

  fs.mkdirSync(path.dirname(file), { recursive: true });
  XLSX.writeFile(workbook, file);
  return file;
}

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function writeCsv(results, file) {
  const header = [
    'Scenario ID',
    'Scenario',
    'Profile',
    'Method',
    'Endpoint',
    'Expected',
    'HTTP status',
    'Payload (B)',
    'Latency (ms)',
    'SLA (ms)',
    'Status',
    'Error',
  ];
  const lines = [header.map(escapeCsv).join(',')];
  for (const result of results) {
    lines.push(
      [
        result.id,
        result.title,
        result.profile,
        result.method,
        result.path,
        result.expected,
        result.httpStatus,
        result.bytes,
        result.latencyMs,
        result.slaMs,
        result.status,
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

  const rows = [
    `## ${failed === 0 ? '✅' : '❌'} Load Test — ${passed}/${total} scenarios passed (${passRate.toFixed(1)}%)`,
    '',
    `- **Ref:** \`${meta.ref || 'local'}\` · **Commit:** \`${meta.sha || 'local'}\``,
    `- **Target:** ${meta.baseUrl}`,
    `- **Scenario phase:** ${(meta.durationMs / 1000).toFixed(1)}s · concurrency ${meta.concurrency}`,
    `- **Load phase:** ${loadPhase.requests} requests in ${loadPhase.durationSeconds}s · ${loadPhase.rps} req/s · p95 ${loadPhase.p95Ms}ms · ${loadPhase.errorRate}% errors`,
    '',
    '| SLO | Measured | Threshold | Result |',
    '| --- | ---: | ---: | --- |',
    ...checks.map(
      (check) => `| ${check.name} | ${check.measured} | ${check.threshold} | ${check.passed ? '✅ PASS' : '❌ FAIL'} |`
    ),
    '',
    '### Report',
    '',
    '- `reports/Load_Test_Analysis_Report.xlsx` — Summary, Scenario Results, Endpoint Metrics, Load Phase, Environment',
    '- `reports/load-test-results.csv` — flat results',
    '',
  ];
  return rows.join('\n');
}

export function writeSummaryMarkdown(report, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, summaryMarkdown(report), 'utf8');
  return file;
}
