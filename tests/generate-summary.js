import fs from 'fs';

const CSV_PATH = 'tests/e2e-report.csv';

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
      let v = cell.replace(/,$/, '');
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1).replace(/""/g, '"');
      }
      return v;
    });
    // Remove the last empty item matching the end of line regex match
    if (cells.length > 5) cells.pop();
    rows.push(cells);
  }
  return rows;
}

const rows = parseCSV(csv);

let markdown = '# 📊 A2ZEE E2E Test Suite Summary\n\n';
markdown += 'Here is the real-time breakdown of the Selenium automated test run:\n\n';
markdown += '| Test Suite | Actor Role | Action Performed | Result | Details |\n';
markdown += '| :--- | :--- | :--- | :--- | :--- |\n';

// Skip header row
for (let i = 1; i < rows.length; i++) {
  const [test, role, action, result, details] = rows[i];
  if (!test) continue;

  let resultEmoji = result;
  if (result === 'PASS') {
    resultEmoji = '✅ **PASS**';
  } else if (result === 'FAIL') {
    resultEmoji = '❌ **FAIL**';
  } else if (result === 'INFO') {
    resultEmoji = 'ℹ️ *INFO*';
  }

  markdown += `| ${test} | ${role} | ${action} | ${resultEmoji} | ${details || ''} |\n`;
}

markdown += '\n\n*Downloaded Excel sheet contains complete logs and verification details.* 🚀';

console.log(markdown);
fs.writeFileSync('tests/summary.md', markdown);
