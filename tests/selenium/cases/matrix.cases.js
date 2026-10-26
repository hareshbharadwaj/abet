/**
 * Selenium E2E case matrix.
 *
 * Every case is a real browser check executed by Selenium against the built
 * app. The matrix is intentionally compact and structural: each page is opened
 * with a seeded identity, then a handful of independent checks assert that the
 * route resolved, the SPA rendered, the expected copy is visible and that the
 * page still exposes working controls.
 *
 * Routes are grouped by module. Guard groups assert that role-based routing
 * refuses to render a page the current identity may not see.
 */
import { assert, assertAnyText } from '../lib/assert.js';

/** Safe, copy-agnostic checks used on every page. */
const ERROR_COPY = [
  'Something went wrong',
  'Unexpected application error',
  'Application error',
  'Cannot read properties of undefined',
  'Firebase Setup Required',
];

const pageChecks = (spec) => {
  const cases = [
    {
      title: 'app shell renders for the route',
      run: async (ctx) => {
        const children = await ctx.exec(
          'var r = document.getElementById("root"); return r ? r.children.length : 0;'
        );
        assert(children > 0, 'React root should contain rendered content');
      },
    },
    {
      title: 'route resolves as expected',
      run: async (ctx) => {
        const hash = await ctx.hash();
        if (spec.expectRedirect) {
          assert(
            !hash.includes(spec.path) || hash === '#/',
            `Protected route "${spec.path}" should not stay in the address bar (got "${hash}")`
          );
        } else {
          assert(
            hash.includes(spec.path),
            `Expected the URL to contain "${spec.path}" but got "${hash}"`
          );
        }
      },
    },
    {
      title: 'document title is not empty',
      run: async (ctx) => {
        const title = await ctx.title();
        assert(String(title || '').trim().length > 0, 'Document title should not be empty');
      },
    },
    {
      title: 'page shows visible content',
      run: async (ctx) => {
        const body = (await ctx.text()).trim();
        assert(body.length > 40, `Page body should render text (got ${body.length} chars)`);
      },
    },
    {
      title: 'page exposes interactive controls',
      run: async (ctx) => {
        const controls = await ctx.count('button, a, input, select, textarea');
        assert(controls >= 2, `Expected at least 2 interactive controls, found ${controls}`);
      },
    },
    {
      title: 'page does not show an error screen',
      run: async (ctx) => {
        const body = (await ctx.text()).toLowerCase();
        const broken = ERROR_COPY.find((copy) => body.includes(copy.toLowerCase()));
        assert(!broken, `Page shows an error screen: "${broken}"`);
      },
    },
    {
      title: 'page declares a viewport meta tag',
      run: async (ctx) => {
        const viewport = await ctx.attr('meta[name="viewport"]', 'content');
        assert(viewport && viewport.includes('width'), 'Missing responsive viewport meta tag');
      },
    },
    {
      title: 'page is not stuck on a loading screen',
      run: async (ctx) => {
        const body = (await ctx.text()).trim();
        assert(!/^Loading\.\.\.$/.test(body), 'Page is still showing the loading placeholder');
      },
    },
    {
      title: 'page renders a visible layout',
      run: async (ctx) => {
        const height = await ctx.exec('return document.body.scrollHeight;');
        assert(height > 300, `Page layout height is only ${height}px`);
      },
    },
    {
      title: 'page renders the expected content',
      run: async (ctx) => {
        const body = await ctx.text();
        assertAnyText(body, spec.texts);
      },
    },
  ];

  if (spec.selector) {
    cases.push({
      title: 'page renders the expected element',
      run: async (ctx) => {
        assert(await ctx.exists(spec.selector), `Expected element "${spec.selector}" on the page`);
      },
    });
  }

  return cases;
};

const guardChecks = (spec) => [
  {
    title: 'protected route is not rendered for this identity',
    run: async (ctx) => {
      const hash = await ctx.hash();
      assert(
        !hash.includes(spec.path),
        `"${spec.identity}" should be redirected away from "${spec.path}" (still at "${hash}")`
      );
    },
  },
  {
    title: 'redirect target renders content',
    run: async (ctx) => {
      const body = (await ctx.text()).trim();
      assert(body.length > 40, 'Redirect target should render content');
    },
  },
  {
    title: 'redirect keeps the SPA interactive',
    run: async (ctx) => {
      const controls = await ctx.count('button, a, input, select, textarea');
      assert(controls >= 2, `Expected interactive controls after redirect, found ${controls}`);
    },
  },
  {
    title: 'redirect does not break the application',
    run: async (ctx) => {
      const body = (await ctx.text()).toLowerCase();
      const broken = ERROR_COPY.find((copy) => body.includes(copy.toLowerCase()));
      assert(!broken, `Redirected page shows an error screen: "${broken}"`);
    },
  },
  {
    title: 'no protected content leaks to this identity',
    run: async (ctx) => {
      const body = (await ctx.text()).toLowerCase();
      assert(
        !body.includes(String(spec.secret || 'admin dashboard').toLowerCase()),
        `Page leaked protected content "${spec.secret}"`
      );
    },
  },
];

/* ------------------------------------------------------------------ */
/* Route matrix                                                        */
/* ------------------------------------------------------------------ */

const PAGES = [
  {
    code: 'PUB-LANDING',
    title: 'Public landing page',
    module: 'Public',
    identity: 'guest',
    path: '/',
    texts: ['A2ZEE', 'Catalogue'],
    selector: '#catalogue',
  },
  {
    code: 'PUB-AUTH',
    title: 'Sign in page',
    module: 'Auth',
    identity: 'guest',
    path: '/auth',
    texts: ['Sign In'],
    selector: 'input[type="password"]',
  },
  {
    code: 'PUB-LEARN',
    title: 'Learn More page',
    module: 'Public',
    identity: 'guest',
    path: '/learn-more',
    texts: ['Our Mission', 'Our Vision'],
  },
  {
    code: 'PUB-INVOICE',
    title: 'Public invoice page',
    module: 'Public',
    identity: 'guest',
    path: '/invoice/ORD-E2E-0001',
    texts: ['Invoice'],
  },
  {
    code: 'PUB-PAY',
    title: 'Payment redirect page',
    module: 'Checkout',
    identity: 'guest',
    path: '/pay/ORD-E2E-0001',
    texts: ['Payment', 'Complete'],
  },
  {
    code: 'PUB-FALLBACK',
    title: 'Unknown route fallback',
    module: 'Public',
    identity: 'guest',
    path: '/this-route-does-not-exist',
    expectRedirect: true,
    texts: ['A2ZEE'],
  },
  {
    code: 'BUY-HOME',
    title: 'Buyer home page',
    module: 'Buyer',
    identity: 'buyer',
    path: '/home',
    texts: ['Categories', 'Featured'],
  },
  {
    code: 'BUY-PRODUCTS',
    title: 'Buyer product catalogue',
    module: 'Buyer',
    identity: 'buyer',
    path: '/products',
    texts: ['Our Products'],
    selector: 'input',
  },
  {
    code: 'BUY-PRODUCT-DETAIL',
    title: 'Product detail page',
    module: 'Buyer',
    identity: 'buyer',
    path: '/product/prod-001',
    texts: ['Description', 'Product'],
  },
  {
    code: 'BUY-CART',
    title: 'Buyer cart page',
    module: 'Buyer',
    identity: 'buyer',
    path: '/cart',
    texts: ['Cart'],
  },
  {
    code: 'BUY-ORDERS',
    title: 'Buyer orders page',
    module: 'Buyer',
    identity: 'buyer',
    path: '/orders',
    texts: ['Orders'],
  },
  {
    code: 'BUY-REVIEWS',
    title: 'Buyer reviews page',
    module: 'Buyer',
    identity: 'buyer',
    path: '/reviews',
    texts: ['Reviews'],
  },
  {
    code: 'BUY-PROFILE',
    title: 'Buyer profile page',
    module: 'Buyer',
    identity: 'buyer',
    path: '/profile',
    texts: ['Profile', 'E2E Buyer'],
  },
  {
    code: 'SELL-DASHBOARD',
    title: 'Seller dashboard',
    module: 'Seller',
    identity: 'seller',
    path: '/seller/dashboard',
    texts: ['Seller Dashboard'],
  },
  {
    code: 'SELL-PRODUCTS',
    title: 'Seller product management',
    module: 'Seller',
    identity: 'seller',
    path: '/seller/products',
    texts: ['Product Management'],
    selector: 'button',
  },
  {
    code: 'SELL-ORDERS',
    title: 'Seller order management',
    module: 'Seller',
    identity: 'seller',
    path: '/seller/orders',
    texts: ['Order Management'],
  },
  {
    code: 'ADM-DASHBOARD',
    title: 'Admin dashboard',
    module: 'Admin',
    identity: 'admin',
    path: '/admin/dashboard',
    texts: ['Admin Dashboard'],
  },
  {
    code: 'ADM-USERS',
    title: 'Admin user management',
    module: 'Admin',
    identity: 'admin',
    path: '/admin/users',
    texts: ['User Management'],
  },
  {
    code: 'ADM-PRODUCTS',
    title: 'Admin product control',
    module: 'Admin',
    identity: 'admin',
    path: '/admin/products',
    texts: ['Product Control'],
  },
  {
    code: 'ADM-REVIEWS',
    title: 'Admin review console',
    module: 'Admin',
    identity: 'admin',
    path: '/admin/reviews',
    texts: ['Manage Reviews'],
  },
  {
    code: 'SUP-CONSOLE',
    title: 'Super admin console',
    module: 'SuperAdmin',
    identity: 'superadmin',
    path: '/superadmin',
    texts: ['Orders & Metrics', 'Buy Offline'],
    selector: 'button',
  },
];

const GUARDS = [
  { code: 'GUARD-GUEST-HOME', identity: 'guest', path: '/home', secret: 'Order Summary' },
  { code: 'GUARD-GUEST-PRODUCTS', identity: 'guest', path: '/products', secret: 'Our Products' },
  { code: 'GUARD-GUEST-CART', identity: 'guest', path: '/cart', secret: 'Order Summary' },
  { code: 'GUARD-GUEST-ORDERS', identity: 'guest', path: '/orders', secret: 'My Orders' },
  { code: 'GUARD-GUEST-SELLER', identity: 'guest', path: '/seller/dashboard', secret: 'Seller Dashboard' },
  { code: 'GUARD-GUEST-ADMIN', identity: 'guest', path: '/admin/dashboard', secret: 'Admin Dashboard' },
  { code: 'GUARD-GUEST-SUPERADMIN', identity: 'guest', path: '/superadmin', secret: 'Landing Page Catalogue' },
  { code: 'GUARD-BUYER-SELLER', identity: 'buyer', path: '/seller/dashboard', secret: 'Seller Dashboard' },
  { code: 'GUARD-BUYER-ADMIN', identity: 'buyer', path: '/admin/dashboard', secret: 'Admin Dashboard' },
  { code: 'GUARD-BUYER-SUPERADMIN', identity: 'buyer', path: '/superadmin', secret: 'Landing Page Catalogue' },
  { code: 'GUARD-SELLER-ADMIN', identity: 'seller', path: '/admin/dashboard', secret: 'Admin Dashboard' },
  { code: 'GUARD-SELLER-SUPERADMIN', identity: 'seller', path: '/superadmin', secret: 'Landing Page Catalogue' },
  { code: 'GUARD-ADMIN-SUPERADMIN', identity: 'admin', path: '/superadmin', secret: 'Landing Page Catalogue' },
];

export const routeGroups = PAGES.map((spec) => ({
  code: spec.code,
  title: spec.title,
  module: spec.module,
  identity: spec.identity,
  path: spec.path,
  viewport: 'desktop',
  cases: pageChecks(spec),
}));

export const guardGroups = GUARDS.map((spec) => ({
  code: spec.code,
  title: `Route guard: ${spec.identity} → ${spec.path}`,
  module: 'Guards',
  identity: spec.identity,
  path: spec.path,
  viewport: 'desktop',
  navigationTolerant: true,
  cases: guardChecks(spec),
}));
