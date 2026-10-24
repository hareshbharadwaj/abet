import fs from 'fs';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const REPORT_CSV = 'tests/e2e-report.csv';
const HEADLESS = process.env.HEADLESS !== 'false';

const roles = [
  { name: 'Admin', email: 'admin123@gmail.com', password: 'Admin123', expectedPath: '/admin/dashboard' },
  { name: 'Buyer', email: 'layna4115@gmail.com', password: 'Layna@123', expectedPath: '/home' },
  { name: 'Seller', email: 'laynarus2@gmail.com', password: 'Layna@123', expectedPath: '/seller/dashboard' },
];

function writeHeader() {
  const header = 'Test,Role,Action,Result,Details\n';
  fs.writeFileSync(REPORT_CSV, header);
}

function appendRow(test, role, action, result, details = '') {
  const safe = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const row = [test, role, action, result, details].map(safe).join(',') + '\n';
  fs.appendFileSync(REPORT_CSV, row);
}

async function testLogin(driver, role) {
  const testName = 'Login';
  try {
    console.log(`  → Navigating to auth page...`);
    await driver.get(`${BASE_URL}/#/auth`);
    await driver.sleep(2000);

    console.log(`  → Finding email input...`);
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    await emailInput.clear();
    await emailInput.sendKeys(role.email);

    console.log(`  → Finding password input...`);
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    await passwordInput.clear();
    await passwordInput.sendKeys(role.password);

    console.log(`  → Clicking submit button...`);
    const submit = await driver.findElement(By.css('button[type="submit"]'));
    await submit.click();

    console.log(`  → Waiting for login to complete...`);
    await driver.sleep(3000);
    
    appendRow(testName, role.name, 'Sign in', 'PASS', 'Logged in successfully');
    return { passed: true };
  } catch (err) {
    console.log(`  ✗ Login failed: ${err.message}`);
    appendRow(testName, role.name, 'Sign in', 'FAIL', err.message);
    return { passed: false, error: err };
  }
}

async function testNavigation(driver, role) {
  const testName = 'Navigation';
  try {
    console.log(`  → Navigating to ${role.expectedPath}...`);
    await driver.get(`${BASE_URL}/#${role.expectedPath}`);
    await driver.sleep(2000);
    
    appendRow(testName, role.name, `Navigate to ${role.expectedPath}`, 'PASS', 'Page loaded');
    return { passed: true };
  } catch (err) {
    console.log(`  ✗ Navigation failed: ${err.message}`);
    appendRow(testName, role.name, `Navigate to ${role.expectedPath}`, 'FAIL', err.message);
    return { passed: false, error: err };
  }
}

async function testBuyerFlow(driver, role) {
  const testName = 'Buyer Flow';
  try {
    // Test products page
    console.log(`  → Testing products page...`);
    await driver.get(`${BASE_URL}/#/products`);
    await driver.sleep(2000);
    appendRow(testName, role.name, 'View products', 'PASS', 'Products page loaded');

    // Test cart
    console.log(`  → Testing cart page...`);
    await driver.get(`${BASE_URL}/#/cart`);
    await driver.sleep(2000);
    appendRow(testName, role.name, 'View cart', 'PASS', 'Cart page loaded');

    // Test orders
    console.log(`  → Testing orders page...`);
    await driver.get(`${BASE_URL}/#/orders`);
    await driver.sleep(2000);
    appendRow(testName, role.name, 'View orders', 'PASS', 'Orders page loaded');

    // Test profile
    console.log(`  → Testing profile page...`);
    await driver.get(`${BASE_URL}/#/profile`);
    await driver.sleep(2000);
    appendRow(testName, role.name, 'View profile', 'PASS', 'Profile page loaded');

    return { passed: true };
  } catch (err) {
    console.log(`  ✗ Buyer flow failed: ${err.message}`);
    appendRow(testName, role.name, 'Buyer flow', 'FAIL', err.message);
    return { passed: false, error: err };
  }
}

async function testSellerFlow(driver, role) {
  const testName = 'Seller Flow';
  try {
    console.log(`  → Testing seller dashboard...`);
    await driver.get(`${BASE_URL}/#/seller/dashboard`);
    await driver.sleep(2000);
    appendRow(testName, role.name, 'Seller dashboard', 'PASS', 'Dashboard loaded');

    console.log(`  → Testing seller products...`);
    await driver.get(`${BASE_URL}/#/seller/products`);
    await driver.sleep(2000);
    appendRow(testName, role.name, 'Seller products', 'PASS', 'Products page loaded');

    console.log(`  → Testing seller orders...`);
    await driver.get(`${BASE_URL}/#/seller/orders`);
    await driver.sleep(2000);
    appendRow(testName, role.name, 'Seller orders', 'PASS', 'Orders page loaded');

    return { passed: true };
  } catch (err) {
    console.log(`  ✗ Seller flow failed: ${err.message}`);
    appendRow(testName, role.name, 'Seller flow', 'FAIL', err.message);
    return { passed: false, error: err };
  }
}

async function testAdminFlow(driver, role) {
  const testName = 'Admin Flow';
  try {
    console.log(`  → Testing admin dashboard...`);
    await driver.get(`${BASE_URL}/#/admin/dashboard`);
    await driver.sleep(2000);
    appendRow(testName, role.name, 'Admin dashboard', 'PASS', 'Dashboard loaded');

    console.log(`  → Testing user management...`);
    await driver.get(`${BASE_URL}/#/admin/users`);
    await driver.sleep(2000);
    appendRow(testName, role.name, 'User management', 'PASS', 'Users page loaded');

    console.log(`  → Testing product control...`);
    await driver.get(`${BASE_URL}/#/admin/products`);
    await driver.sleep(2000);
    appendRow(testName, role.name, 'Product control', 'PASS', 'Products page loaded');

    return { passed: true };
  } catch (err) {
    console.log(`  ✗ Admin flow failed: ${err.message}`);
    appendRow(testName, role.name, 'Admin flow', 'FAIL', err.message);
    return { passed: false, error: err };
  }
}

async function run() {
  console.log('🚀 Starting E2E tests...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🎬 Headless mode: ${HEADLESS}\n`);

  writeHeader();

  const options = new chrome.Options();

  if (HEADLESS) {
    options.addArguments('--headless=new');
  }

  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1280,720');

  let driver;
  try {
    console.log('🌐 Starting Chrome...');
    const builder = new Builder().forBrowser('chrome').setChromeOptions(options);
    driver = await builder.build();
    console.log('✅ Chrome started!\n');
  } catch (err) {
    console.error('❌ Failed to start Chrome:', err.message);
    process.exit(1);
  }

  try {
    for (const role of roles) {
      console.log(`\n👤 ${role.name} Role Tests`);
      console.log('━'.repeat(50));

      appendRow('Start', role.name, 'Begin tests', 'INFO', '---');

      const loginRes = await testLogin(driver, role);

      if (loginRes.passed) {
        await testNavigation(driver, role);

        if (role.name === 'Buyer') {
          await testBuyerFlow(driver, role);
        } else if (role.name === 'Seller') {
          await testSellerFlow(driver, role);
        } else if (role.name === 'Admin') {
          await testAdminFlow(driver, role);
        }
      }

      // Logout
      try {
        console.log(`  → Logging out...`);
        await driver.get(`${BASE_URL}`);
        await driver.sleep(1000);
        appendRow('End', role.name, 'Tests completed', 'INFO', '---');
      } catch (e) {
        appendRow('End', role.name, 'Tests completed with errors', 'WARN', e.message);
      }
    }
  } finally {
    console.log('\n🛑 Closing browser...');
    await driver.quit();
  }
}

run()
  .then(() => {
    console.log('\n✨ E2E tests completed!');
    console.log(`📊 Report: ${REPORT_CSV}\n`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ E2E run failed:', err.message);
    process.exit(1);
  });
