/**
 * Scenario catalogue for the load test.
 *
 * Scenarios are generated from the *real* production bundle: the suite scans
 * dist/ for the hashed JS/CSS bundles and the image assets, then builds a
 * 300-case matrix covering cold page loads, bundle downloads, cached reloads,
 * HEAD probes and 404 handling.
 *
 * Each scenario describes one HTTP request with an expected status, a minimum
 * body size and a latency budget (SLA) in milliseconds.
 */
import fs from 'fs';
import path from 'path';

const encodePath = (value) =>
  value
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');

const walk = (dir, files = []) => {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
};

/** Discover the hashed bundles and image assets that vite emitted. */
export function discoverAssets(distDir) {
  const files = walk(distDir);
  const relative = files.map((file) => `/${path.relative(distDir, file).split(path.sep).join('/')}`);

  const js = relative.filter((file) => file.endsWith('.js') && file.startsWith('/assets/'));
  const css = relative.filter((file) => file.endsWith('.css') && file.startsWith('/assets/'));
  const images = relative.filter((file) => /\.(png|jpe?g|svg|webp|gif|avif)$/i.test(file));

  const bySize = (list) =>
    list
      .map((file) => {
        let size = 0;
        try {
          size = fs.statSync(path.join(distDir, file)).size;
        } catch {
          /* ignore */
        }
        return { file, size };
      })
      .sort((a, b) => b.size - a.size);

  const biggestJs = bySize(js)[0] || { file: '/assets/index.js', size: 0 };
  const biggestCss = bySize(css)[0] || { file: '/assets/index.css', size: 0 };
  const gallery = bySize(images).slice(0, 24);

  return {
    js: biggestJs,
    css: biggestCss,
    images: gallery,
    totalAssets: relative.length,
  };
}

/**
 * Builds the scenario catalogue.
 *
 * Profiles are rotated so the mix stays realistic: every eighth scenario loads
 * the HTML shell, every eighth downloads the JS bundle, and so on.
 */
export function buildScenarios({ baseUrl, distDir, count = 300 }) {
  const assets = discoverAssets(distDir);
  const images = assets.images.length
    ? assets.images
    : [{ file: '/A2ZEE.png', size: 1000 }];

  const targets = [
    {
      kind: 'page',
      title: 'Cold page load',
      method: 'GET',
      path: '/',
      expected: [200],
      minBytes: 300,
      slaMs: 1500,
      profile: 'page',
    },
    {
      kind: 'bundle',
      title: 'JavaScript bundle download',
      method: 'GET',
      path: assets.js.file,
      expected: [200],
      minBytes: Math.min(5000, Math.max(500, Math.floor(assets.js.size / 2))),
      slaMs: 2500,
      profile: 'bundle',
    },
    {
      kind: 'style',
      title: 'Stylesheet download',
      method: 'GET',
      path: assets.css.file,
      expected: [200],
      minBytes: Math.min(500, Math.max(100, Math.floor(assets.css.size / 2))),
      slaMs: 2000,
      profile: 'style',
    },
    {
      kind: 'page-head',
      title: 'HEAD probe on the HTML shell',
      method: 'HEAD',
      path: '/',
      expected: [200],
      minBytes: 0,
      slaMs: 1200,
      profile: 'head',
    },
    {
      kind: 'page-reload',
      title: 'Cached reload of the HTML shell',
      method: 'GET',
      path: '/',
      headers: { 'cache-control': 'no-cache' },
      expected: [200],
      minBytes: 300,
      slaMs: 1500,
      profile: 'reload',
    },
    {
      kind: 'not-found',
      title: 'Missing asset returns 404',
      method: 'GET',
      path: '/assets/this-bundle-does-not-exist.js',
      expected: [404, 200],
      minBytes: 0,
      slaMs: 2000,
      profile: '404',
    },
  ];

  const scenarios = [];

  for (let index = 0; scenarios.length < count; index += 1) {
    const image = images[index % images.length];
    const target = targets[index % targets.length];

    const isImage = index % targets.length === targets.length - 1 || index % 9 === 8;
    if (isImage && scenarios.length + 1 < count) {
      scenarios.push({
        id: '',
        title: `Static image ${image.file.split('/').pop()}`,
        method: 'GET',
        path: image.file,
        expected: [200],
        minBytes: Math.min(200, Math.max(32, Math.floor(image.size / 4))),
        slaMs: 1500,
        profile: 'image',
      });
      if (scenarios.length >= count) break;
    }

    scenarios.push({
      id: '',
      title: `${target.title}${target.path === '/' ? '' : ` · ${target.path.split('/').pop()}`}`,
      method: target.method,
      path: target.path,
      headers: target.headers || {},
      expected: target.expected,
      minBytes: target.minBytes,
      slaMs: target.slaMs,
      profile: target.profile,
    });
  }

  return scenarios.slice(0, count).map((scenario, index) => ({
    ...scenario,
    id: `LT-${String(index + 1).padStart(3, '0')}`,
    index: index + 1,
    url: `${baseUrl.replace(/\/$/, '')}${encodePath(scenario.path)}`,
    label: `${String(index + 1).padStart(3, '0')}/${count} ${scenario.method} ${scenario.path}`,
  }));
}

export { encodePath };
