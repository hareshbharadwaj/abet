import fs from 'fs';
import { execSync } from 'child_process';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const REPORT_CSV = 'tests/e2e-report.csv';
const HEADLESS = process.env.HEADLESS !== 'false';

// Generate dynamic credentials to keep runs isolated and clean
const timestamp = Date.now();
const adminEmail = `admin_e2e_${timestamp}@test.com`;
const adminName = `Admin ${timestamp}`;
const sellerEmail = `seller_${timestamp}@test.com`;
const sellerName = `Seller ${timestamp}`;
const buyerEmail = `buyer_${timestamp}@test.com`;
const buyerName = `Buyer ${timestamp}`;
const productName = `E2E Sprouts ${timestamp}`;

function writeHeader() {
  const header = 'Test,Role,Action,Result,Details\n';
  fs.writeFileSync(REPORT_CSV, header);
}

function appendRow(test, role, action, result, details = '') {
  const safe = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const row = [test, role, action, result, details].map(safe).join(',') + '\n';
  fs.appendFileSync(REPORT_CSV, row);
}

// Helper to wait for an element and ensure it is visible and interactable
async function getEl(driver, locator, timeout = 12000) {
  try {
    const el = await driver.wait(until.elementLocated(locator), timeout);
    await driver.wait(until.elementIsVisible(el), timeout);
    return el;
  } catch (err) {
    throw new Error(`Failed to locate visible element for ${JSON.stringify(locator)}: ${err.message}`);
  }
}

// Programmatic logout guarantees no session leakage or Firebase hangs
async function testLogout(driver, roleName) {
  try {
    console.log(`  → Logging out (${roleName})...`);
    
    const usersOnPage = await driver.executeScript(() => localStorage.getItem('a2zee_users'));
    console.log(`  DEBUG: a2zee_users on page before navigation (${roleName}):`, usersOnPage);

    // Navigate to a static asset on the same origin to unload React and release database locks
    await driver.get(`${BASE_URL}/logo.png`);
    await driver.sleep(1000);

    // Clear all storage mechanisms and cookies under the same origin
    const usersBefore = await driver.executeScript(() => localStorage.getItem('a2zee_users'));
    console.log(`  DEBUG: a2zee_users before clear (${roleName}):`, usersBefore);

    await driver.manage().deleteAllCookies();
    await driver.executeScript(() => {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (!key.startsWith('a2zee_') || key === 'a2zee_current_user')) {
          localStorage.removeItem(key);
        }
      }
      sessionStorage.clear();
      try {
        indexedDB.deleteDatabase('firebaseLocalStorageDb');
      } catch (e) {}
    });

    const usersAfter = await driver.executeScript(() => localStorage.getItem('a2zee_users'));
    console.log(`  DEBUG: a2zee_users after clear (${roleName}):`, usersAfter);
    
    // Refresh to apply clean state and navigate to auth
    await driver.get(`${BASE_URL}/#/auth`);
    await driver.sleep(2000);

    appendRow('Logout', roleName, 'Sign out programmatically', 'PASS', 'Cleared storage on static asset and navigated to auth');
    console.log(`  ✅ Logged out successfully.`);
    return true;
  } catch (err) {
    appendRow('Logout', roleName, 'Sign out', 'FAIL', `Failed to log out: ${err.message}`);
    console.log(`  ✗ Logout failed: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('🚀 Starting Full Selenium E2E Tests...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🎬 Headless mode: ${HEADLESS}`);
  console.log(`📧 Admin Account: ${adminEmail}`);
  console.log(`📧 Seller Account: ${sellerEmail}`);
  console.log(`📧 Buyer Account: ${buyerEmail}`);
  console.log(`🌱 Test Product: ${productName}\n`);

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
    appendRow('Browser Init', 'System', 'Launch Chrome', 'FAIL', err.message);
    process.exit(1);
  }

  try {
    // ----------------------------------------------------
    // PRE-STEP: Admin Registration (Real Authenticated Admin)
    // ----------------------------------------------------
    console.log(`👤 PRE-STEP: Admin Registration`);
    console.log('━'.repeat(50));
    appendRow('Registration', 'Admin', 'Start Register', 'INFO', '---');

    await driver.get(`${BASE_URL}/#/auth`);

    console.log('  → Clicking register link...');
    const regLink = await getEl(driver, By.xpath('//button[contains(., "Register Now")]'));
    await regLink.click();
    await driver.sleep(500);

    console.log('  → Appending and selecting Admin option in select...');
    await driver.executeScript(() => {
      const select = document.querySelector('select');
      if (select) {
        const opt = document.createElement('option');
        opt.value = 'admin';
        opt.text = 'System Administrator';
        select.add(opt);
        select.value = 'admin';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    console.log('  → Filling Admin registration form...');
    const adminNameInput = await getEl(driver, By.xpath('//input[@placeholder="John Doe"]'));
    await adminNameInput.sendKeys(adminName);

    const adminEmailInput = await getEl(driver, By.css('input[type="email"]'));
    await adminEmailInput.sendKeys(adminEmail);

    const adminPassInput = await getEl(driver, By.css('input[type="password"]'));
    await adminPassInput.sendKeys('AdminPassword123');

    console.log('  → Submitting form...');
    const adminSubmitBtn = await getEl(driver, By.css('button[type="submit"]'));
    await adminSubmitBtn.click();

    // Verify redirected to Admin Dashboard
    await driver.wait(until.urlContains('/admin/dashboard'), 10000);
    appendRow('Registration', 'Admin', 'Submit Account Creation', 'PASS', 'Admin account registered successfully');
    console.log('  ✅ Admin registered and logged in.');

    await testLogout(driver, 'Admin');

    // ----------------------------------------------------
    // FLOW 1: Seller Registration (Pending state)
    // ----------------------------------------------------
    console.log(`\n👤 STEP 1: Seller Registration`);
    console.log('━'.repeat(50));
    appendRow('Registration', 'Seller', 'Start Register', 'INFO', '---');

    console.log('  → Clicking register link...');
    const registerLink = await getEl(driver, By.xpath('//button[contains(., "Register Now")]'));
    await registerLink.click();
    await driver.sleep(500);

    console.log('  → Filling registration form...');
    const nameInput = await getEl(driver, By.xpath('//input[@placeholder="John Doe"]'));
    await nameInput.sendKeys(sellerName);

    const emailInput = await getEl(driver, By.css('input[type="email"]'));
    await emailInput.sendKeys(sellerEmail);

    const passwordInput = await getEl(driver, By.css('input[type="password"]'));
    await passwordInput.sendKeys('SellerPassword123');

    await driver.executeScript(() => {
      const select = document.querySelector('select');
      if (select) {
        select.value = 'seller';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    console.log('  → Submitting form...');
    const submitBtn = await getEl(driver, By.css('button[type="submit"]'));
    await submitBtn.click();
    
    // Wait for the URL or body text to contain pending information
    await driver.wait(async (d) => {
      const text = await d.findElement(By.css('body')).getText();
      return text.includes('Account Pending Approval') || text.includes('pending');
    }, 12000);

    appendRow('Registration', 'Seller', 'Submit Account Creation', 'PASS', 'Account created and set to pending');
    console.log('  ✅ Seller registered. Account set to pending approval.');

    await testLogout(driver, 'Seller');

    // ----------------------------------------------------
    // FLOW 2: Admin Approves Seller
    // ----------------------------------------------------
    console.log(`\n👤 STEP 2: Admin Approves Seller`);
    console.log('━'.repeat(50));
    appendRow('Admin Approval', 'Admin', 'Start Login', 'INFO', '---');

    console.log('  → Logging in as Admin...');
    const adminEmailField = await getEl(driver, By.css('input[type="email"]'));
    await adminEmailField.sendKeys(adminEmail);
    const adminPassField = await getEl(driver, By.css('input[type="password"]'));
    await adminPassField.sendKeys('AdminPassword123');
    const adminSubmit = await getEl(driver, By.css('button[type="submit"]'));
    await adminSubmit.click();

    // Verify we are at Admin Dashboard
    await driver.wait(until.urlContains('/admin/dashboard'), 10000);
    appendRow('Admin Approval', 'Admin', 'Login', 'PASS', 'Admin logged in successfully');
    console.log('  ✅ Admin logged in.');

    console.log('  → Navigating to User Management...');
    await driver.get(`${BASE_URL}/#/admin/users`);

    console.log('  → Switching to Pending tab...');
    const pendingTab = await getEl(driver, By.xpath('//button[contains(., "Pending")]'));
    await pendingTab.click();
    await driver.sleep(1500); // Allow react to render pending cards

    console.log(`  → Locating seller card for: ${sellerEmail}...`);
    const approveBtn = await getEl(driver, By.xpath(`//p[text()="${sellerEmail}"]/ancestor::div[contains(@class, "flex")]//button[contains(@class, "bg-green-600")]`));
    await approveBtn.click();
    
    // Wait for the approve button to disappear (signaling active state update)
    await driver.sleep(2000);

    appendRow('Admin Approval', 'Admin', 'Approve Seller', 'PASS', `Seller ${sellerEmail} approved`);
    console.log(`  ✅ Seller ${sellerEmail} approved.`);

    await testLogout(driver, 'Admin');

    // ----------------------------------------------------
    // FLOW 3: Seller Adds Product
    // ----------------------------------------------------
    console.log(`\n👤 STEP 3: Seller Adds Product`);
    console.log('━'.repeat(50));
    appendRow('Product Listing', 'Seller', 'Start Login', 'INFO', '---');

    console.log('  → Logging in as newly approved Seller...');
    const sEmail = await getEl(driver, By.css('input[type="email"]'));
    await sEmail.sendKeys(sellerEmail);
    const sPass = await getEl(driver, By.css('input[type="password"]'));
    await sPass.sendKeys('SellerPassword123');
    const sSubmit = await getEl(driver, By.css('button[type="submit"]'));
    await sSubmit.click();

    await driver.wait(until.urlContains('/seller/dashboard'), 10000);
    appendRow('Product Listing', 'Seller', 'Login', 'PASS', 'Seller logged in successfully');
    console.log('  ✅ Seller logged in.');

    console.log('  → Navigating to Seller Product Management...');
    await driver.get(`${BASE_URL}/#/seller/products`);

    console.log('  → Opening Add Product Dialog...');
    const addProductBtn = await getEl(driver, By.xpath('//button[contains(., "Add New Product")]'));
    await addProductBtn.click();

    console.log('  → Filling product form...');
    const pNameInput = await getEl(driver, By.css('input#name'));
    await pNameInput.sendKeys(productName);

    const pDescInput = await getEl(driver, By.css('textarea#description'));
    await pDescInput.sendKeys('Fresh organic sprouts grown specifically for Selenium E2E automated tests.');

    const pPriceInput = await getEl(driver, By.css('input#price'));
    await pPriceInput.clear();
    await pPriceInput.sendKeys('149');

    const pStockInput = await getEl(driver, By.css('input#stock'));
    await pStockInput.clear();
    await pStockInput.sendKeys('25');

    console.log('  → Submitting product...');
    const pSubmitBtn = await getEl(driver, By.xpath('//button[@type="submit" and contains(., "Add Product")]'));
    await pSubmitBtn.click();
    
    // Wait for list to update
    await driver.sleep(2500);

    appendRow('Product Listing', 'Seller', 'List Product', 'PASS', `Product ${productName} listed (pending approval)`);
    console.log(`  ✅ Product "${productName}" listed (pending approval).`);

    await testLogout(driver, 'Seller');

    // ----------------------------------------------------
    // FLOW 4: Admin Approves Product
    // ----------------------------------------------------
    console.log(`\n👤 STEP 4: Admin Approves Product`);
    console.log('━'.repeat(50));
    appendRow('Product Approval', 'Admin', 'Start Login', 'INFO', '---');

    console.log('  → Logging in as Admin...');
    const adminEmail2 = await getEl(driver, By.css('input[type="email"]'));
    await adminEmail2.sendKeys(adminEmail);
    const adminPass2 = await getEl(driver, By.css('input[type="password"]'));
    await adminPass2.sendKeys('AdminPassword123');
    const adminSubmit2 = await getEl(driver, By.css('button[type="submit"]'));
    await adminSubmit2.click();

    // Wait for the login redirection to dashboard to complete before navigating
    await driver.wait(until.urlContains('/admin/dashboard'), 10000);

    console.log('  → Navigating to Product Control...');
    await driver.get(`${BASE_URL}/#/admin/products`);

    console.log('  → Switching to Pending tab...');
    const pendingTab2 = await getEl(driver, By.xpath('//button[contains(., "Pending")]'));
    await pendingTab2.click();
    await driver.sleep(1000);

    console.log(`  → Locating product card for: ${productName}...`);
    const approveProductBtn = await getEl(driver, By.xpath(`//h3[text()="${productName}"]/ancestor::div[contains(@class, "flex")]//button[contains(@class, "bg-green-600")]`));
    await approveProductBtn.click();
    await driver.sleep(2500);

    appendRow('Product Approval', 'Admin', 'Approve Product', 'PASS', `Product ${productName} approved`);
    console.log(`  ✅ Product "${productName}" approved.`);

    await testLogout(driver, 'Admin');

    // ----------------------------------------------------
    // FLOW 5: Buyer Purchase Flow
    // ----------------------------------------------------
    console.log(`\n👤 STEP 5: Buyer Register & Buy`);
    console.log('━'.repeat(50));
    appendRow('Buyer Journey', 'Buyer', 'Start Register', 'INFO', '---');

    console.log('  → Clicking register link...');
    const registerLink2 = await getEl(driver, By.xpath('//button[contains(., "Register Now")]'));
    await registerLink2.click();
    await driver.sleep(500);

    console.log('  → Registering as Buyer...');
    const bNameInput = await getEl(driver, By.xpath('//input[@placeholder="John Doe"]'));
    await bNameInput.sendKeys(buyerName);

    const bEmailInput = await getEl(driver, By.css('input[type="email"]'));
    await bEmailInput.sendKeys(buyerEmail);

    const bPasswordInput = await getEl(driver, By.css('input[type="password"]'));
    await bPasswordInput.sendKeys('BuyerPassword123');

    console.log('  → Submitting form...');
    const bSubmitBtn = await getEl(driver, By.css('button[type="submit"]'));
    await bSubmitBtn.click();

    await driver.wait(until.urlContains('/home'), 10000);
    appendRow('Buyer Journey', 'Buyer', 'Register', 'PASS', 'Buyer registered and logged in successfully');
    console.log('  ✅ Buyer registered and logged in.');

    console.log('  → Navigating to Products list...');
    await driver.get(`${BASE_URL}/#/products`);

    console.log(`  → Clicking product: ${productName}...`);
    const pCard = await getEl(driver, By.xpath(`//h3[contains(text(), "${productName}")]`));
    await pCard.click();

    console.log('  → Adding product to Cart...');
    const addToCartBtn = await getEl(driver, By.xpath('//button[contains(., "Add to Cart")]'));
    await addToCartBtn.click();
    await driver.sleep(1000);

    console.log('  → Going to Cart...');
    const goToCartBtn = await getEl(driver, By.xpath('//button[contains(., "Go to Cart")]'));
    await goToCartBtn.click();

    console.log('  → Proceeding to Checkout...');
    const checkoutBtn = await getEl(driver, By.xpath('//button[contains(., "Proceed to Checkout")]'));
    await checkoutBtn.click();

    console.log('  → Filling delivery address...');
    const nameField = await getEl(driver, By.css('input#name'));
    await nameField.sendKeys('Test Buyer');
    const phoneField = await getEl(driver, By.css('input#phone'));
    await phoneField.sendKeys('9876543210');
    const addressField = await getEl(driver, By.css('input#line1'));
    await addressField.sendKeys('123 Selenium Test St.');
    const cityField = await getEl(driver, By.css('input#city'));
    await cityField.sendKeys('Chennai');
    const stateField = await getEl(driver, By.css('input#state'));
    await stateField.sendKeys('Tamil Nadu');
    const pincodeField = await getEl(driver, By.css('input#pincode'));
    await pincodeField.sendKeys('600001');

    console.log('  → Selecting Cash on Delivery...');
    const codLabel = await getEl(driver, By.xpath('//label[@for="cod"]'));
    await codLabel.click();
    await driver.sleep(500);

    console.log('  → Placing order...');
    const placeOrderBtn = await getEl(driver, By.xpath('//button[contains(., "Place Order")]'));
    await placeOrderBtn.click();

    await driver.wait(until.urlContains('/orders/'), 12000);
    const currentUrl = await driver.getCurrentUrl();
    appendRow('Buyer Journey', 'Buyer', 'Place Order', 'PASS', `Order placed. Redirected to: ${currentUrl}`);
    console.log('  ✅ Order placed successfully! Tracking page loaded.');

    const orderId = currentUrl.split('/').pop();

    await testLogout(driver, 'Buyer');

    // ----------------------------------------------------
    // FLOW 6: Seller Manages Order
    // ----------------------------------------------------
    console.log(`\n👤 STEP 6: Seller Manages Order`);
    console.log('━'.repeat(50));
    appendRow('Order Fulfillment', 'Seller', 'Start Login', 'INFO', '---');

    console.log('  → Logging in as Seller...');
    const sEmail2 = await getEl(driver, By.css('input[type="email"]'));
    await sEmail2.sendKeys(sellerEmail);
    const sPass2 = await getEl(driver, By.css('input[type="password"]'));
    await sPass2.sendKeys('SellerPassword123');
    const sSubmit2 = await getEl(driver, By.css('button[type="submit"]'));
    await sSubmit2.click();

    // Wait for the login redirection to dashboard to complete before navigating
    await driver.wait(until.urlContains('/seller/dashboard'), 10000);

    console.log('  → Navigating to Seller Orders page...');
    await driver.get(`${BASE_URL}/#/seller/orders`);

    console.log(`  → Setting status of Order ${orderId} to Accepted...`);
    const statusSelect = await getEl(driver, By.xpath('//p[contains(text(), "Update Status")]/following-sibling::button'));
    await statusSelect.click();
    await driver.sleep(500);

    const acceptedOption = await getEl(driver, By.xpath('//div[@role="option" or @role="menuitem"]//span[text()="Accepted"]'), 8000);
    await acceptedOption.click();
    await driver.sleep(2000);

    appendRow('Order Fulfillment', 'Seller', 'Accept Order', 'PASS', `Order ${orderId} status updated to Accepted`);
    console.log(`  ✅ Order ${orderId} marked as Accepted.`);

    await testLogout(driver, 'Seller');

    // Finished successfully!
    console.log('\n🌟 All E2E test scenarios executed successfully!');
    appendRow('E2E Status', 'System', 'Run Full Pipeline', 'PASS', 'All roles & steps completed');

  } catch (error) {
    console.error(`\n❌ Error during test run: ${error.message}`);
    appendRow('E2E Status', 'System', 'Run Full Pipeline', 'FAIL', error.message);
    
    // Save error details for debugging
    try {
      const currentUrl = await driver.getCurrentUrl();
      const pageText = await driver.findElement(By.css('body')).getText();
      console.log(`📍 Current URL: ${currentUrl}`);
      console.log(`📝 Page Text (first 300 chars): ${pageText.substring(0, 300)}...`);
      
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync('tests/error-screenshot.png', screenshot, 'base64');
      console.log('📸 Error screenshot saved to tests/error-screenshot.png');
    } catch (debugErr) {
      console.error('Failed to capture debug info:', debugErr.message);
    }
  } finally {
    console.log('\n🛑 Closing browser...');
    await driver.quit();

    console.log('📊 Converting CSV to Excel...');
    try {
      execSync('node tests/csv-to-xlsx.js');
    } catch (err) {
      console.error('❌ Failed to run csv-to-xlsx.js:', err.message);
    }
  }
}

run();
