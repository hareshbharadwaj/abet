/**
 * PageContext – the friendly API every test case uses.
 */
import { By } from 'selenium-webdriver';
import {
  assert,
  assertAnyText,
  assertText,
  snippet,
} from './assert.js';
import {
  browserConsoleMessages,
  readBodyText,
  readHash,
  setHash,
  waitForSettled,
} from './driver.js';

const CLICKABLE = 'button, a, [role="button"], [role="tab"], [role="radio"], label';

export class PageContext {
  constructor({ driver, baseUrl, identity, viewport, log }) {
    this.driver = driver;
    this.baseUrl = baseUrl;
    this.identity = identity;
    this.viewport = viewport;
    this.log = log || (() => {});
  }

  /* ------------------------------------------------------------------ */
  /* Reading the page                                                    */
  /* ------------------------------------------------------------------ */

  text() {
    return readBodyText(this.driver);
  }

  title() {
    return this.driver.getTitle();
  }

  url() {
    return this.driver.getCurrentUrl();
  }

  hash() {
    return readHash(this.driver);
  }

  exec(script, ...args) {
    return this.driver.executeScript(script, ...args);
  }

  async count(css) {
    return this.exec('return document.querySelectorAll(arguments[0]).length;', css);
  }

  async exists(css) {
    return (await this.count(css)) > 0;
  }

  async attr(css, name) {
    return this.exec(
      'var el = document.querySelector(arguments[0]); return el ? el.getAttribute(arguments[1]) : null;',
      css,
      name
    );
  }

  async texts(css) {
    return this.exec(
      'return Array.from(document.querySelectorAll(arguments[0])).map(function (el) { return (el.innerText || el.textContent || "").trim(); });',
      css
    );
  }

  async consoleMessages() {
    return browserConsoleMessages(this.driver);
  }

  /* ------------------------------------------------------------------ */
  /* Waiting                                                             */
  /* ------------------------------------------------------------------ */

  async waitFor(predicate, { timeout = 10000, interval = 150, message } = {}) {
    const deadline = Date.now() + timeout;
    let lastError;
    while (Date.now() < deadline) {
      try {
        if (await predicate()) return true;
      } catch (error) {
        lastError = error;
      }
      await this.driver.sleep(interval);
    }
    throw new Error(
      `${message || 'Condition not met'} within ${timeout}ms${lastError ? ` (${lastError.message})` : ''}`
    );
  }

  async waitText(needle, timeout = 10000) {
    return this.waitFor(async () => (await this.text()).toLowerCase().includes(String(needle).toLowerCase()), {
      timeout,
      message: `Text "${needle}" never appeared`,
    });
  }

  async waitGone(needle, timeout = 10000) {
    return this.waitFor(
      async () => !(await this.text()).toLowerCase().includes(String(needle).toLowerCase()),
      { timeout, message: `Text "${needle}" never disappeared` }
    );
  }

  async waitSelector(css, timeout = 10000) {
    return this.waitFor(async () => this.exists(css), {
      timeout,
      message: `Selector "${css}" never appeared`,
    });
  }

  async waitHash(fragment, timeout = 10000) {
    return this.waitFor(async () => (await this.hash()).includes(fragment), {
      timeout,
      message: `Route never became "${fragment}"`,
    });
  }

  /* ------------------------------------------------------------------ */
  /* Assertions                                                          */
  /* ------------------------------------------------------------------ */

  async expectText(needle, label) {
    assertText(await this.text(), needle, label || `Page should show "${needle}"`);
    return true;
  }

  async expectAnyText(needles, label) {
    assertAnyText(await this.text(), needles, label);
    return true;
  }

  async expectNoText(needle, label) {
    const body = await this.text();
    assert(
      !body.toLowerCase().includes(String(needle).toLowerCase()),
      `${label || `Page should not show "${needle}"`} — page text: ${snippet(body)}`
    );
    return true;
  }

  async expectSelector(css, label) {
    assert(await this.exists(css), `${label || `Expected element "${css}" to exist`}`);
    return true;
  }

  async expectNoSelector(css, label) {
    assert(!(await this.exists(css)), `${label || `Expected element "${css}" to be absent`}`);
    return true;
  }

  async expectMinCount(css, min, label) {
    const total = await this.count(css);
    assert(
      total >= min,
      `${label || `Expected at least ${min} element(s) for "${css}"`} but found ${total}`
    );
    return total;
  }

  async expectMaxCount(css, max, label) {
    const total = await this.count(css);
    assert(
      total <= max,
      `${label || `Expected at most ${max} element(s) for "${css}"`} but found ${total}`
    );
    return total;
  }

  async expectHash(fragment, label) {
    const current = await this.hash();
    assert(
      current.includes(fragment),
      `${label || `Expected route "${fragment}"`} but current route is "${current}"`
    );
    return true;
  }

  async expectTitleContains(needle) {
    assertText(await this.title(), needle, 'Document title');
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* Interaction                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Finds the first element matching `selector` whose text contains `text`
   * and tags it so Selenium can interact with it.
   */
  async markByText(text, selector = CLICKABLE) {
    return this.exec(
      `
      var els = Array.from(document.querySelectorAll(arguments[0]));
      var needle = String(arguments[1]).replace(/\\s+/g, ' ').trim().toLowerCase();
      var hit = els.find(function (el) {
        var t = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase();
        return t.includes(needle) && !el.disabled;
      });
      document.querySelectorAll('[data-e2e-hit="1"]').forEach(function (n) { n.removeAttribute('data-e2e-hit'); });
      if (!hit) return false;
      hit.setAttribute('data-e2e-hit', '1');
      return true;
      `,
      selector,
      text
    );
  }

  async hasText(text, selector = CLICKABLE) {
    return this.markByText(text, selector);
  }

  async clickText(text, selector = CLICKABLE) {
    const found = await this.markByText(text, selector);
    assert(found, `Could not find a clickable element containing "${text}"`);
    const element = await this.driver.findElement(By.css('[data-e2e-hit="1"]'));
    await this.exec(
      'arguments[0].scrollIntoView({ block: "center" }); arguments[0].click();',
      element
    );
    await this.driver.sleep(200);
    return element;
  }

  async click(css) {
    const element = await this.driver.findElement(By.css(css));
    await this.exec(
      'arguments[0].scrollIntoView({ block: "center" }); arguments[0].click();',
      element
    );
    await this.driver.sleep(200);
    return element;
  }

  /**
   * Clicks the button wrapping a lucide icon (e.g. "plus", "minus", "trash-2").
   * Icon-only controls have no text, so the icon class is the stable hook.
   */
  async clickIcon(name, index = 0) {
    const clicked = await this.exec(
      `
      var icons = document.querySelectorAll('svg.lucide-' + arguments[0]);
      var icon = icons[arguments[1]];
      if (!icon) return false;
      var button = icon.closest('button, a, [role="button"], [role="radio"]');
      if (!button) return false;
      button.scrollIntoView({ block: 'center' });
      button.click();
      return true;
      `,
      name,
      index
    );
    assert(clicked, `Could not find a clickable "${name}" icon`);
    await this.driver.sleep(250);
    return clicked;
  }

  /** Clicks the Nth button inside the card/container that contains `cardText`. */
  async clickButtonInCard(cardText, buttonIndex = 0) {
    const clicked = await this.exec(
      `
      var needle = String(arguments[0]).replace(/\s+/g, ' ').trim().toLowerCase();
      var nodes = Array.from(document.querySelectorAll('h3, h2, p, span, div'));
      var host = nodes.find(function (el) {
        var text = (el.innerText || '').replace(/\s+/g, ' ').trim().toLowerCase();
        return text.includes(needle);
      });
      if (!host) return false;
      var container = host;
      for (var i = 0; i < 6 && container.parentElement; i += 1) {
        container = container.parentElement;
        var buttons = container.querySelectorAll('button');
        if (buttons.length > arguments[1]) {
          buttons[arguments[1]].scrollIntoView({ block: 'center' });
          buttons[arguments[1]].click();
          return true;
        }
      }
      return false;
      `,
      cardText,
      buttonIndex
    );
    assert(clicked, `Could not click button ${buttonIndex} inside card "${cardText}"`);
    await this.driver.sleep(250);
    return clicked;
  }

  async type(css, value) {
    const element = await this.driver.findElement(By.css(css));
    await element.clear();
    await element.sendKeys(String(value));
    return element;
  }

  async typeInPlaceholder(placeholder, value) {
    return this.type(`input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]`, value);
  }

  async selectOption(css, visibleText) {
    return this.clickText(visibleText, `${css} [role="option"], ${css} option, ${css} button`);
  }

  /** Navigate inside the SPA (hash router) without a full reload. */
  async goto(route, { settle = true } = {}) {
    await setHash(this.driver, route);
    await this.driver.sleep(120);
    if (settle) await waitForSettled(this.driver, 8000);
    return this;
  }

  /** Full page reload – used when a test needs a clean provider mount. */
  async reload() {
    await this.driver.navigate().refresh();
    await waitForSettled(this.driver, 12000);
    return this;
  }

  async scrollTo(css) {
    await this.exec(
      'var el = document.querySelector(arguments[0]); if (el) el.scrollIntoView({ block: "center" });',
      css
    );
    await this.driver.sleep(150);
    return this;
  }

  async scrollToBottom() {
    await this.exec('window.scrollTo(0, document.body.scrollHeight);');
    await this.driver.sleep(250);
    return this;
  }

  async localStorage(key) {
    return this.exec(
      'var raw = window.localStorage.getItem(arguments[0]); if (raw === null) return null; try { return JSON.parse(raw); } catch (e) { return raw; }',
      key
    );
  }

  async setLocalStorage(key, value) {
    return this.exec(
      'window.localStorage.setItem(arguments[0], JSON.stringify(arguments[1]));',
      key,
      value
    );
  }

  async viewportSize() {
    return this.exec('return { width: window.innerWidth, height: window.innerHeight };');
  }

  async pageMetrics() {
    return this.exec(
      `return {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body ? document.body.scrollWidth : 0,
        scrollHeight: document.documentElement.scrollHeight
      };`
    );
  }
}
