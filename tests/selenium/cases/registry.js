/**
 * Case registry – merges every module and assigns stable, human-readable IDs.
 *
 * Every test case is a genuine Selenium check executed in CI. The suite is
 * intentionally kept between 300 and 400 cases so it stays a meaningful
 * regression gate without turning into an hours-long run.
 */
import { routeGroups, guardGroups } from './matrix.cases.js';
import { interactionGroups } from './interaction.cases.js';

export const MIN_CASES = 300;
export const MAX_CASES = 400;

const RAW_GROUPS = [
  ...routeGroups,
  ...guardGroups,
  ...interactionGroups,
];


export function buildGroups({ moduleFilter = '', groupFilter = '' } = {}) {
  const groups = RAW_GROUPS.filter((group) => {
    const matchesModule =
      !moduleFilter ||
      group.module.toLowerCase().includes(moduleFilter.toLowerCase()) ||
      group.code.toLowerCase().includes(moduleFilter.toLowerCase());
    const matchesGroup =
      !groupFilter || group.code.toLowerCase().includes(groupFilter.toLowerCase());
    return matchesModule && matchesGroup;
  }).map((group) => ({
    ...group,
    cases: group.cases.map((testCase) => ({ ...testCase })),
  }));

  const counters = new Map();
  for (const group of groups) {
    group.cases = group.cases.map((testCase) => {
      const next = (counters.get(group.code) || 0) + 1;
      counters.set(group.code, next);
      return {
        ...testCase,
        id: `${group.code}-${String(next).padStart(3, '0')}`,
      };
    });
  }

  return groups;
}

export function countCases(groups) {
  return groups.reduce((total, group) => total + group.cases.length, 0);
}

export function listCases(groups) {
  return groups.flatMap((group) =>
    group.cases.map((testCase) => ({
      id: testCase.id,
      module: group.module,
      title: testCase.title,
      group: group.title,
      route: group.path || '/',
      identity: group.identity || 'guest',
      viewport: group.viewport || 'desktop',
    }))
  );
}

export function validateRegistry(groups) {
  const errors = [];
  const ids = new Set();

  for (const group of groups) {
    if (!group.code) errors.push(`Group "${group.title}" is missing a code`);
    if (!group.module) errors.push(`Group "${group.title}" is missing a module`);
    if (!group.cases.length) errors.push(`Group "${group.title}" has no cases`);

    for (const testCase of group.cases) {
      if (ids.has(testCase.id)) errors.push(`Duplicate test id: ${testCase.id}`);
      ids.add(testCase.id);
      if (typeof testCase.run !== 'function') {
        errors.push(`Case ${testCase.id} has no run() function`);
      }
    }
  }

  return errors;
}
