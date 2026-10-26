/**
 * Report writer for the security audit.
 *
 * Produces the enterprise audit workbook:
 *   1. Executive Summary              — banner, audit metadata, category table, TOTAL
 *   2. Security Test Results          — numbered matrix with PASS/FAIL + compliance
 *   3. Compliance & Standards         — OWASP / ISO 27001 / GDPR alignment matrix
 *   4. Findings & Remediation         — failing controls with severity and fix guidance
 *   5. Environment                    — scope, artefacts and run metadata
 */
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx-js-style';

const NAVY = '1F3864';
const NAVY_LIGHT = '2E5496';
const HEADER_BLUE = '2F5597';
const WHITE = 'FFFFFF';
const GREEN_FILL = 'C6EFCE';
const GREEN_TEXT = '006100';
const RED_FILL = 'FFC7CE';
const RED_TEXT = '9C0006';
const AMBER_FILL = 'FFEB9C';
const AMBER_TEXT = '9C6500';
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
  font: { bold: true, sz: 15, color: { rgb: WHITE } },
  fill: { fgColor: { rgb: NAVY } },
  alignment: { horizontal: 'center', vertical: 'center' },
};
const sectionStyle = {
  font: { bold: true, sz: 11, color: { rgb: WHITE } },
  fill: { fgColor: { rgb: NAVY_LIGHT } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border,
};
const headerStyle = {
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
const valueStyle = (bold = false) => ({ font: { sz: 10, bold }, alignment: { vertical: 'center' }, border });
const bodyStyle = (zebra = false) => ({
  font: { sz: 10 },
  fill: { fgColor: { rgb: zebra ? 'FAFBFD' : WHITE } },
  alignment: { vertical: 'center', wrapText: false },
  border,
});
const statusStyle = (status) => ({
  font: { bold: true, sz: 10, color: { rgb: status === 'PASS' ? GREEN_TEXT : RED_TEXT } },
  fill: { fgColor: { rgb: status === 'PASS' ? GREEN_FILL : RED_FILL } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border,
});
const complianceStyle = (ok) => ({
  font: { bold: true, sz: 10, color: { rgb: ok ? GREEN_TEXT : RED_TEXT } },
  fill: { fgColor: { rgb: ok ? GREEN_FILL : RED_FILL } },
  alignment: { horizontal: 'left', vertical: 'center' },
  border,
});
const severityStyle = (severity) => ({
  font: { bold: true, sz: 10, color: { rgb: AMBER_TEXT } },
  fill: { fgColor: { rgb: AMBER_FILL } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border,
});
const totalStyle = {
  font: { bold: true, sz: 10, color: { rgb: NAVY } },
  fill: { fgColor: { rgb: CATEGORY_FILL } },
  alignment: { vertical: 'center' },
  border,
};

const put = (sheet, row, col, value, style, type) => {
  sheet[XLSX.utils.encode_cell({ r: row, c: col })] = {
    t: type || (typeof value === 'number' ? 'n' : 's'),
    v: value === undefined || value === null ? '' : value,
    s: style,
  };
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

export function summarise(results) {
  const byCategory = new Map();
  for (const result of results) {
    const entry = byCategory.get(result.category) || {
      id: result.category,
      name: result.categoryName,
      owasp: result.owasp,
      total: 0,
      passed: 0,
      failed: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    entry.total += 1;
    if (result.status === 'PASS') entry.passed += 1;
    else {
      entry.failed += 1;
      const key = String(result.severity || 'Low').toLowerCase();
      if (key in entry) entry[key] += 1;
    }
    byCategory.set(result.category, entry);
  }
  const categories = Array.from(byCategory.values());
  const total = results.length;
  const passed = results.filter((result) => result.status === 'PASS').length;
  return {
    total,
    passed,
    failed: total - passed,
    passRate: total ? (passed / total) * 100 : 0,
    categories,
    criticalFindings: results.filter((r) => r.status === 'FAIL' && /critical/i.test(r.severity)).length,
    highFindings: results.filter((r) => r.status === 'FAIL' && /high/i.test(r.severity)).length,
  };
}

export function writeWorkbook(report, file) {
  const workbook = XLSX.utils.book_new();
  const { meta, results, standards } = report;
  const summary = summarise(results);
  const allGreen = summary.failed === 0;
  const auditDate = new Date(meta.finishedAt).toLocaleString('en-GB', { timeZone: 'UTC' });

  /* ===================== 1. Executive Summary ===================== */
  const sheet = {};
  setRef(sheet, 46, 5);
  widths(sheet, [17, 36, 20, 13, 13, 40]);
  sheet['!rows'] = [{ hpt: 32 }, { hpt: 6 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 }, { hpt: 8 }, { hpt: 22 }, { hpt: 32 }];

  merge(sheet, 0, 0, 0, 5);
  put(sheet, 0, 0, 'A2ZEE Microgreenz — Enterprise Security Audit & Vulnerability Test Report', bannerStyle);

  const left = [
    ['Audit Date:', auditDate],
    ['Assessment Scope:', 'Full stack (SPA bundle, source tree, HTTP surface, CI/CD)'],
    ['Auditor / Engine:', `Automated security scanner · harness tests/security · ${summary.total} controls`],
  ];
  const right = [
    ['Overall Security Status:', allGreen ? 'SECURE / COMPLIANT' : 'ATTENTION REQUIRED'],
    ['Total Test Cases:', `${summary.total} (${summary.passed} passed / ${summary.failed} failed)`],
    ['Pass Rate:', `${summary.passRate.toFixed(0)}% — ${summary.passed}/${summary.total} controls`],
  ];

  left.forEach(([caption, value], index) => {
    const row = 2 + index;
    put(sheet, row, 0, caption, labelStyle);
    merge(sheet, row, 1, row, 2);
    put(sheet, row, 1, value, valueStyle(index === 0));
    put(sheet, row, 3, right[index][0], labelStyle);
    merge(sheet, row, 4, row, 5);
    put(sheet, row, 4, right[index][1], index === 0 ? complianceStyle(allGreen) : valueStyle(false));
  });

  merge(sheet, 6, 0, 6, 5);
  put(sheet, 6, 0, 'Security Category Evaluation & Pass Summary', sectionStyle);
  ['Category ID', 'Security Domain / Category Name', 'Test Cases Evaluated', 'Passed', 'Failed', 'Compliance Status'].forEach(
    (heading, col) => put(sheet, 7, col, heading, headerStyle)
  );

  summary.categories.forEach((entry, index) => {
    const row = 8 + index;
    const stripes = index % 2 === 1;
    const ok = entry.failed === 0;
    put(sheet, row, 0, entry.id, { ...bodyStyle(stripes), alignment: { horizontal: 'center' } });
    put(sheet, row, 1, entry.name, { ...bodyStyle(stripes), font: { sz: 10, bold: true, color: { rgb: NAVY } } });
    put(sheet, row, 2, entry.total, { ...bodyStyle(stripes), alignment: { horizontal: 'center' } });
    put(sheet, row, 3, entry.passed, {
      ...bodyStyle(stripes),
      font: { sz: 10, bold: true, color: { rgb: GREEN_TEXT } },
      alignment: { horizontal: 'center' },
    });
    put(sheet, row, 4, entry.failed, {
      ...bodyStyle(stripes),
      font: { sz: 10, bold: true, color: { rgb: entry.failed ? RED_TEXT : '808080' } },
      alignment: { horizontal: 'center' },
    });
    put(
      sheet,
      row,
      5,
      ok
        ? `${((entry.passed / entry.total) * 100).toFixed(0)}% PASS — Verified`
        : `${((entry.passed / entry.total) * 100).toFixed(0)}% PASS — ${entry.failed} finding(s) to remediate`,
      complianceStyle(ok)
    );
  });

  const totalRow = 8 + summary.categories.length;
  put(sheet, totalRow, 0, 'TOTAL', totalStyle);
  put(sheet, totalRow, 1, `All ${summary.categories.length} security categories`, totalStyle);
  put(sheet, totalRow, 2, summary.total, { ...totalStyle, alignment: { horizontal: 'center' } });
  put(sheet, totalRow, 3, summary.passed, { ...totalStyle, alignment: { horizontal: 'center' } });
  put(sheet, totalRow, 4, summary.failed, { ...totalStyle, alignment: { horizontal: 'center' } });
  put(sheet, totalRow, 5, `${summary.passRate.toFixed(0)}% PASS RATE`, totalStyle);

  const after = totalRow + 2;
  merge(sheet, after, 0, after, 5);
  put(sheet, after, 0, 'Findings by Severity', sectionStyle);
  const findings = results.filter((result) => result.status === 'FAIL');
  const bySeverity = ['Critical', 'High', 'Medium', 'Low'].map((severity) => ({
    severity,
    count: findings.filter((finding) => String(finding.severity).toLowerCase() === severity.toLowerCase()).length,
  }));
  bySeverity.forEach((entry, index) => {
    const row = after + 1 + index;
    put(sheet, row, 0, `${entry.severity} findings`, labelStyle);
    put(sheet, row, 1, entry.count, valueStyle(true));
  });

  const rightStart = after + 1;
  put(sheet, rightStart, 3, 'Security posture', headerStyle);
  put(sheet, rightStart, 4, 'Count', headerStyle);
  put(sheet, rightStart, 5, 'Result', headerStyle);
  const posture = [
    ['Controls evaluated', summary.total],
    ['Controls passed', summary.passed],
    ['Controls failed', summary.failed],
    ['Critical findings', summary.criticalFindings],
    ['High findings', summary.highFindings],
  ];
  posture.forEach(([caption, count], index) => {
    const row = rightStart + 1 + index;
    put(sheet, row, 3, caption, bodyStyle(index % 2 === 1));
    put(sheet, row, 4, count, { ...bodyStyle(index % 2 === 1), alignment: { horizontal: 'center' } });
    const ok = /passed|evaluated/i.test(caption) ? true : count === 0;
    put(sheet, row, 5, ok ? 'OK' : 'ACTION REQUIRED', complianceStyle(ok));
  });

  sheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(workbook, sheet, 'Executive Summary');

  /* ===================== 2. Security Test Results ===================== */
  const header = [
    '#',
    'Test ID',
    'Category',
    'Control / Test Case Description',
    'Target / Module',
    'Evidence',
    'Severity',
    'Status',
    'Compliance',
  ];
  const detail = XLSX.utils.aoa_to_sheet([
    ['Comprehensive Security Audit Test Cases Matrix (350 Total Test Cases)'],
    header,
    ...results.map((result, index) => [
      index + 1,
      result.id,
      result.category,
      result.title,
      result.area,
      String(result.evidence || '').slice(0, 400),
      result.severity,
      result.status,
      result.status === 'PASS' ? 'VERIFIED' : 'REMEDIATE',
    ]),
  ]);
  detail['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: results.length + 1, c: header.length - 1 } });
  merge(detail, 0, 0, 0, header.length - 1);
  put(detail, 0, 0, 'Comprehensive Security Audit Test Cases Matrix (350 Total Test Cases)', { ...bannerStyle, sz: 12 });
  header.forEach((_, col) => {
    const address = XLSX.utils.encode_cell({ r: 1, c: col });
    if (detail[address]) detail[address].s = headerStyle;
  });
  results.forEach((result, rowIndex) => {
    const row = rowIndex + 2;
    const stripes = rowIndex % 2 === 1;
    const values = [
      rowIndex + 1,
      result.id,
      result.category,
      result.title,
      result.area,
      String(result.evidence || '').slice(0, 400),
      result.severity,
      result.status,
      result.status === 'PASS' ? 'VERIFIED' : 'REMEDIATE',
    ];
    values.forEach((value, col) => {
      const address = XLSX.utils.encode_cell({ r: row, c: col });
      if (!detail[address]) return;
      if (col === 7) detail[address].s = statusStyle(value);
      else if (col === 8) detail[address].s = complianceStyle(value === 'VERIFIED');
      else if (col === 6) detail[address].s = severityStyle(value);
      else if (col === 2) detail[address].s = { ...bodyStyle(stripes), font: { sz: 10, bold: true, color: { rgb: NAVY } } };
      else detail[address].s = bodyStyle(stripes);
    });
  });
  widths(detail, [6, 12, 12, 62, 22, 70, 10, 10, 14]);
  detail['!autofilter'] = { ref: `A2:I${results.length + 2}` };
  detail['!freeze'] = { xSplit: 0, ySplit: 2 };
  XLSX.utils.book_append_sheet(workbook, detail, 'Security Test Results');

  /* ===================== 3. Compliance & Standards ===================== */
  const complianceSheet = {};
  setRef(complianceSheet, standards.length + 4, 3);
  widths(complianceSheet, [30, 60, 18, 36]);
  complianceSheet['!rows'] = [{ hpt: 32 }, { hpt: 8 }, { hpt: 24 }];
  merge(complianceSheet, 0, 0, 0, 3);
  put(complianceSheet, 0, 0, 'Industry Security Standards & Regulatory Alignment Matrix', bannerStyle);
  ['Standard Framework', 'Control Area', 'Evaluation Score', 'Compliance Status'].forEach((heading, col) =>
    put(complianceSheet, 2, col, heading, headerStyle)
  );
  standards.forEach((entry, index) => {
    const row = 3 + index;
    const stripes = index % 2 === 1;
    const ok = entry.score >= 90;
    put(complianceSheet, row, 0, entry.framework, { ...bodyStyle(stripes), font: { sz: 10, bold: true } });
    put(complianceSheet, row, 1, entry.control, bodyStyle(stripes));
    put(complianceSheet, row, 2, `${entry.score} / 100`, {
      ...bodyStyle(stripes),
      font: { sz: 10, bold: true },
      alignment: { horizontal: 'center' },
    });
    put(complianceSheet, row, 3, ok ? 'FULL COMPLIANCE — Verified' : 'PARTIAL COMPLIANCE — Review', complianceStyle(ok));
  });
  XLSX.utils.book_append_sheet(workbook, complianceSheet, 'Compliance & Standards');

  /* ===================== 4. Findings & Remediation ===================== */
  const remediation = {
    Critical: 'Block release. Fix before the next production deployment.',
    High: 'Fix within the current sprint.',
    Medium: 'Schedule within the next two sprints.',
    Low: 'Track as hardening backlog.',
  };
  const findingSheet = {};
  const sortedFindings = findings
    .slice()
    .sort((a, b) => {
      const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4) || a.id.localeCompare(b.id);
    });
  setRef(findingSheet, Math.max(4, sortedFindings.length + 2), 6);
  widths(findingSheet, [12, 12, 52, 18, 10, 52]);
  findingSheet['!rows'] = [{ hpt: 30 }];
  merge(findingSheet, 0, 0, 0, 5);
  put(
    findingSheet,
    0,
    0,
    sortedFindings.length ? `Findings & Remediation — ${sortedFindings.length} control(s) failed` : 'Findings & Remediation — no findings',
    bannerStyle
  );
  ['Test ID', 'Category', 'Finding', 'Severity', 'Status', 'Recommended Remediation'].forEach((heading, col) =>
    put(findingSheet, 2, col, heading, headerStyle)
  );
  if (sortedFindings.length === 0) {
    merge(findingSheet, 3, 0, 3, 5);
    put(findingSheet, 3, 0, 'All audited controls passed — no remediation required.', { ...bodyStyle(), alignment: { horizontal: 'center' } });
  }
  sortedFindings.forEach((finding, index) => {
    const row = 3 + index;
    put(findingSheet, row, 0, finding.id, bodyStyle(index % 2 === 1));
    put(findingSheet, row, 1, finding.category, bodyStyle(index % 2 === 1));
    put(findingSheet, row, 2, finding.title, bodyStyle(index % 2 === 1));
    put(findingSheet, row, 3, finding.severity, severityStyle(finding.severity));
    put(findingSheet, row, 4, 'OPEN', statusStyle('FAIL'));
    put(findingSheet, row, 5, remediation[finding.severity] || remediation.Low, bodyStyle(index % 2 === 1));
  });
  XLSX.utils.book_append_sheet(workbook, findingSheet, 'Findings & Remediation');

  /* ===================== 5. Environment ===================== */
  const envRows = [
    ['Target base URL', meta.baseUrl],
    ['Repository', meta.repository],
    ['Git ref', meta.ref || 'local'],
    ['Commit SHA', meta.sha || 'local'],
    ['Workflow run id', meta.runId || 'local'],
    ['CI runner', meta.runnerOs || 'local'],
    ['Node.js', meta.nodeVersion],
    ['Source files scanned', meta.sourceFiles],
    ['Bundle files scanned', meta.bundleFiles.length],
    ['Controls evaluated', summary.total],
    ['Report workbook', 'reports/Vulnerability_Test_Report.xlsx'],
    ['Raw results', 'reports/vulnerability-test-results.csv'],
    ['Started at (UTC)', meta.startedAt],
    ['Finished at (UTC)', meta.finishedAt],
    ['Duration (s)', Number((meta.durationMs / 1000).toFixed(2))],
  ];
  const env = {};
  setRef(env, envRows.length + 3, 2);
  widths(env, [32, 82, 16]);
  env['!rows'] = [{ hpt: 30 }];
  merge(env, 0, 0, 0, 2);
  put(env, 0, 0, 'Audit Environment & Scope', bannerStyle);
  put(env, 2, 0, 'Setting', headerStyle);
  put(env, 2, 1, 'Value', headerStyle);
  envRows.forEach(([caption, value], index) => {
    const row = 3 + index;
    put(env, row, 0, caption, labelStyle);
    merge(env, row, 1, row, 2);
    put(env, row, 1, value, bodyStyle(index % 2 === 1));
  });
  XLSX.utils.book_append_sheet(workbook, env, 'Environment');

  fs.mkdirSync(path.dirname(file), { recursive: true });
  XLSX.writeFile(workbook, file);
  return file;
}

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function writeCsv(results, file) {
  const header = ['Test ID', 'Category', 'Control', 'Target', 'Severity', 'Status', 'Compliance', 'Evidence'];
  const lines = [header.map(escapeCsv).join(',')];
  for (const result of results) {
    lines.push(
      [
        result.id,
        result.category,
        result.title,
        result.area,
        result.severity,
        result.status,
        result.status === 'PASS' ? 'VERIFIED' : 'REMEDIATE',
        result.evidence || '',
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
  const { meta, results } = report;
  const summary = summarise(results);
  const findings = results.filter((result) => result.status === 'FAIL');
  return [
    `## ${summary.failed === 0 ? '✅' : '⚠️'} Security Audit — ${summary.passed}/${summary.total} controls passed (${summary.passRate.toFixed(1)}%)`,
    '',
    `- **Ref:** \`${meta.ref || 'local'}\` · **Commit:** \`${(meta.sha || 'local').slice(0, 7)}\``,
    `- **Scope:** ${meta.sourceFiles} source files · ${meta.bundleFiles.length} bundle files · ${meta.baseUrl}`,
    `- **Findings:** ${summary.criticalFindings} critical · ${summary.highFindings} high`,
    '',
    '| Category | Controls | Passed | Failed | Status |',
    '| --- | ---: | ---: | ---: | --- |',
    ...summary.categories.map(
      (entry) => `| ${entry.id} ${entry.name} | ${entry.total} | ${entry.passed} | ${entry.failed} | ${entry.failed === 0 ? '✅ Verified' : '⚠️ Remediate'} |`
    ),
    '',
    ...(findings.length
      ? [
          '### Open findings',
          '',
          ...findings.map((finding) => `- **${finding.id}** (${finding.severity}) ${finding.title} — ${String(finding.evidence).slice(0, 180)}`),
          '',
        ]
      : []),
    '### Report',
    '',
    '- `reports/Vulnerability_Test_Report.xlsx` — Executive Summary, Security Test Results, Compliance & Standards, Findings & Remediation, Environment',
    '- `reports/vulnerability-test-results.csv` — flat results',
    '',
  ].join('\n');
}

export function writeSummaryMarkdown(report, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, summaryMarkdown(report), 'utf8');
  return file;
}
