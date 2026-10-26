/**
 * Tiny assertion helpers with human-readable failure messages.
 * Every helper throws AssertionError, which the runner records as a FAIL.
 */

export class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
}

/** Collapse whitespace / non-breaking spaces so UI copy matches reliably. */
export const norm = (value) =>
  String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

export const lower = (value) => norm(value).toLowerCase();

export function assert(condition, message) {
  if (!condition) throw new AssertionError(message);
}

export function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new AssertionError(`${label}: expected "${expected}" but got "${actual}"`);
  }
}

export function assertNotEqual(actual, expected, label) {
  if (actual === expected) {
    throw new AssertionError(`${label}: expected a value different from "${expected}"`);
  }
}

export function assertText(haystack, needle, label = 'Text') {
  const hay = lower(haystack);
  const pin = lower(needle);
  if (!hay.includes(pin)) {
    throw new AssertionError(
      `${label}: expected text "${needle}" on the page, but it was not found`
    );
  }
}

export function assertAnyText(haystack, needles, label = 'Text') {
  const hay = lower(haystack);
  const found = needles.some((needle) => hay.includes(lower(needle)));
  if (!found) {
    throw new AssertionError(
      `${label}: expected one of ${needles.map((n) => `"${n}"`).join(', ')} on the page`
    );
  }
}

export function assertNoText(haystack, needle, label = 'Text') {
  if (lower(haystack).includes(lower(needle))) {
    throw new AssertionError(`${label}: text "${needle}" should NOT be on the page`);
  }
}

export function assertRegex(value, pattern, label = 'Value') {
  if (!pattern.test(String(value ?? ''))) {
    throw new AssertionError(
      `${label}: "${String(value).slice(0, 120)}" does not match ${pattern}`
    );
  }
}

export function assertMin(value, min, label = 'Value') {
  if (!(Number(value) >= min)) {
    throw new AssertionError(`${label}: expected at least ${min} but got ${value}`);
  }
}

export function assertMax(value, max, label = 'Value') {
  if (!(Number(value) <= max)) {
    throw new AssertionError(`${label}: expected at most ${max} but got ${value}`);
  }
}

/** Shorten a page snapshot for failure details. */
export function snippet(text, size = 320) {
  const clean = norm(text);
  return clean.length > size ? `${clean.slice(0, size)}…` : clean;
}
