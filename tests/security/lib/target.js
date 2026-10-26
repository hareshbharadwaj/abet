/**
 * Target loader for the security suite.
 *
 * The suite audits the *real* artefacts of this repository:
 *   - every source file under src/
 *   - the production bundle emitted into dist/
 *   - index.html, netlify.toml, package.json
 *   - the live preview server (headers + HTML)
 *
 * Nothing is mocked: a check passes only when the actual file, header or bundle
 * satisfies it.
 */
import fs from 'fs';
import path from 'path';

const walk = (dir, files = []) => {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
};

export function createTarget({ root, distDir = 'dist', baseUrl = '' }) {
  const srcDir = path.join(root, 'src');
  const sourceFiles = walk(srcDir).map((full) => ({
    path: path.relative(root, full).split(path.sep).join('/'),
    text: fs.readFileSync(full, 'utf8'),
  }));

  // Repository-level artefacts that controls also need to inspect.
  const REPO_FILES = [
    'index.html', 'netlify.toml', 'package.json', 'package-lock.json',
    'vite.config.ts', '.gitignore', '.env.example', 'README.md',
    'LICENSE', 'LICENSE.md', 'firebase.json', 'CODEOWNERS', '.github/CODEOWNERS',
    '.github/dependabot.yml', '.github/workflows/ci.yml',
    '.github/workflows/selemiumtest.yml', '.github/workflows/loadtest.yml',
    '.github/workflows/vulnerabilitytest.yml',
  ];

  const repoSources = REPO_FILES.map((rel) => {
    const full = path.join(root, rel);
    return fs.existsSync(full) ? { path: rel, text: fs.readFileSync(full, 'utf8') } : null;
  }).filter(Boolean);

  const readOptional = (rel) => {
    const full = path.join(root, rel);
    return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  };

  const distFiles = walk(path.join(root, distDir));
  const bundleFiles = distFiles.filter((file) => file.endsWith('.js'));
  const bundle = bundleFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');

  const allFiles = [...sourceFiles, ...repoSources];

  const pick = (include) => {
    if (!include) return allFiles;
    const patterns = Array.isArray(include) ? include : [include];
    return allFiles.filter((file) =>
      patterns.some((pattern) =>
        typeof pattern === 'string' ? file.path === pattern : pattern.test(file.path)
      )
    );
  };

  const matches = (include, pattern) => {
    const hits = [];
    for (const file of pick(include)) {
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
      let match;
      let count = 0;
      while ((match = re.exec(file.text)) !== null) {
        count += 1;
        if (hits.length < 4) {
          const start = Math.max(0, match.index - 60);
          const context = file.text.slice(start, match.index + match[0].length + 80);
          hits.push({
            file: file.path,
            snippet: String(context).replace(/\s+/g, ' ').slice(0, 200),
          });
        }
        if (count > 25) break;
      }
    }
    return hits;
  };

  /** Evaluate "pattern must be present" / "must be absent" across files. */
  const expect = (include, pattern, shouldExist, note = '') => {
    const hits = matches(include, pattern);
    const found = hits.length > 0;
    const ok = shouldExist ? found : !found;
    const evidence = found
      ? `matched in ${hits.length} place(s): ${hits
          .slice(0, 3)
          .map((hit) => `${hit.file} → ${hit.snippet}`)
          .join(' | ')}`
      : 'no match in the scanned files';
    return { ok, evidence: note ? `${note} · ${evidence}` : evidence };
  };

  /** Routes declared in App.tsx with their protection metadata. */
  const routeTable = () => {
    const app = readOptional('src/app/App.tsx');
    const rows = [];
    const re = /<Route\s+path="([^"]+)"\s+element=\{([\s\S]*?)\}\s*\/>/g;
    let match;
    while ((match = re.exec(app)) !== null) {
      const [, routePath, element] = match;
      const protectedMatch = /ProtectedRoute([\s\S]*?)>/.exec(element);
      const rolesMatch = /allowedRoles=\{\[([^\]]+)\]\}/.exec(element);
      rows.push({
        path: routePath,
        isProtected: Boolean(protectedMatch),
        roles: rolesMatch
          ? rolesMatch[1]
              .split(',')
              .map((role) => role.trim().replace(/['"]/g, ''))
              .filter(Boolean)
          : [],
        element,
      });
    }
    return rows;
  };

  const headers = {};
  let html = '';
  const fetchLive = async (url) => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      html = await response.text();
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
      return response.status;
    } catch {
      html = readOptional(path.join(distDir, 'index.html'));
      return 0;
    }
  };

  return {
    root,
    baseUrl,
    distDir,
    sourceFiles,
    bundle,
    bundleFiles: bundleFiles.map((file) => path.relative(root, file).split(path.sep).join('/')),
    read: readOptional,
    readFile: (rel) => sourceFiles.find((file) => file.path === rel)?.text || '',
    pick,
    matches,
    expect,
    routeTable,
    fetchLive,
    get headers() {
      return headers;
    },
    get html() {
      return html;
    },
    get packageJson() {
      try {
        return JSON.parse(readOptional('package.json'));
      } catch {
        return {};
      }
    },
  };
}
