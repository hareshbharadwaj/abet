import fs from 'fs';
import XLSX from 'xlsx-js-style';

const CSV_PATH = 'tests/e2e-report.csv';
const XLSX_PATH = 'tests/e2e-report.xlsx';

if (!fs.existsSync(CSV_PATH)) {
  console.error('CSV report not found at', CSV_PATH);
  process.exit(1);
}

const csv = fs.readFileSync(CSV_PATH, 'utf8');

function parseCSV(str) {
  const lines = str.split(/\r?\n/).filter(Boolean);
  const rows = [];
  for (const line of lines) {
    const matches = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g);
    const cells = matches.map((cell) => {
      const v = cell.replace(/,$/, '');
      if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replace(/""/g, '"');
      return v;
    });
    if (cells.length > 5) cells.length = 5;
    rows.push(cells);
  }
  return rows;
}

const rawRows = parseCSV(csv);
const header = rawRows[0];
const dataRows = rawRows.slice(1);

// Filter out INFO rows and Logout actions to keep it brief and professional
const filteredData = dataRows.filter(row => {
  const test = row[0] || '';
  const result = row[3] || '';
  if (result === 'INFO') return false;
  if (test === 'Logout') return false;
  return true;
});

// Build styled worksheet
const ws = {};

// Column widths
const colWidths = [
  { wch: 18 }, // Test
  { wch: 12 }, // Role
  { wch: 28 }, // Action
  { wch: 12 }, // Result
  { wch: 60 }  // Details
];
ws['!cols'] = colWidths;

// Header Style (A2ZEE Theme Green)
const headerStyle = {
  fill: { patternType: 'solid', fgColor: { rgb: '2D6A2E' } },
  font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: '1F4D20' } },
    bottom: { style: 'medium', color: { rgb: '1F4D20' } },
    left: { style: 'thin', color: { rgb: '1F4D20' } },
    right: { style: 'thin', color: { rgb: '1F4D20' } }
  }
};

const getRowStyle = (rowIndex, result) => {
  const isAlt = rowIndex % 2 === 1;
  const bgColor = isAlt ? 'F9FAFB' : 'FFFFFF';
  
  let resultColor = '374151'; // Dark gray
  let resultBg = bgColor;
  let resultBold = false;

  if (result === 'PASS') {
    resultColor = '15803D'; // Dark Green text
    resultBg = 'DCFCE7';    // Light Green bg
    resultBold = true;
  } else if (result === 'FAIL') {
    resultColor = 'B91C1C'; // Dark Red text
    resultBg = 'FEE2E2';    // Light Red bg
    resultBold = true;
  }

  const border = {
    top: { style: 'thin', color: { rgb: 'E5E7EB' } },
    bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
    left: { style: 'thin', color: { rgb: 'E5E7EB' } },
    right: { style: 'thin', color: { rgb: 'E5E7EB' } }
  };

  return {
    test: {
      fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
      font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '1F2937' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border
    },
    role: {
      fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
      font: { name: 'Segoe UI', sz: 10, color: { rgb: '4B5563' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border
    },
    action: {
      fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
      font: { name: 'Segoe UI', sz: 10, color: { rgb: '1F2937' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border
    },
    result: {
      fill: { patternType: 'solid', fgColor: { rgb: resultBg } },
      font: { name: 'Segoe UI', sz: 10, bold: resultBold, color: { rgb: resultColor } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border
    },
    details: {
      fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
      font: { name: 'Segoe UI', sz: 9, italic: true, color: { rgb: '4B5563' } },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border
    }
  };
};

// Write Header
header.forEach((val, colIdx) => {
  const ref = XLSX.utils.encode_cell({ r: 0, c: colIdx });
  ws[ref] = { v: val, t: 's', s: headerStyle };
});

// Write Data
filteredData.forEach((row, rowIdx) => {
  const rIdx = rowIdx + 1;
  const result = row[3] || '';
  const styles = getRowStyle(rowIdx, result);

  const cells = [
    { v: row[0] || '', t: 's', s: styles.test },
    { v: row[1] || '', t: 's', s: styles.role },
    { v: row[2] || '', t: 's', s: styles.action },
    { v: row[3] || '', t: 's', s: styles.result },
    { v: row[4] || '', t: 's', s: styles.details }
  ];

  cells.forEach((cell, colIdx) => {
    const ref = XLSX.utils.encode_cell({ r: rIdx, c: colIdx });
    ws[ref] = cell;
  });
});

// Define worksheet range
const maxRow = filteredData.length;
ws['!ref'] = `A1:E${maxRow + 1}`;

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'E2E Executive Report');

try {
  XLSX.writeFile(wb, XLSX_PATH);
  console.log('Wrote colorized brief Excel report to', XLSX_PATH);
} catch (err) {
  if (err.code === 'EBUSY') {
    const fallbackPath = `tests/e2e-report-${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fallbackPath);
    console.warn(`⚠️ Warning: Excel report is open/locked. Wrote copy to ${fallbackPath}`);
  } else {
    throw err;
  }
}
