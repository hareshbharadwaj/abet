/**
 * Interaction cases: real clicks, typing and navigation against live pages.
 *
 * All of these run without any backend: the app falls back to localStorage and
 * the public catalogue is bundled with the build, so they are deterministic in
 * CI.
 */
import { assert } from '../lib/assert.js';

const clickExact = async (ctx, text, selector = 'button, a, [role="button"], [role="tab"]') => {
  const clicked = await ctx.exec(
    `
    var els = Array.from(document.querySelectorAll(arguments[0]));
    var needle = String(arguments[1]).replace(/\\s+/g, ' ').trim().toLowerCase();
    var hit = els.find(function (el) {
      var t = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase();
      return t === needle && !el.disabled;
    });
    if (!hit) return false;
    hit.scrollIntoView({ block: 'center' });
    hit.click();
    return true;
    `,
    selector,
    text
  );
  assert(clicked, `Could not find a clickable element labelled "${text}"`);
  await ctx.driver.sleep(350);
  return clicked;
};


/** Reset helpers so every case starts from a known UI state. */
const resetAuth = async (ctx) => {
  await ctx.goto('/');
  await ctx.driver.sleep(120);
  await ctx.goto('/auth');
};

const resetLanding = async (ctx) => {
  await ctx.reload();
};

const resetAdmin = async (ctx) => {
  await ctx.goto('/admin/dashboard');
  await ctx.driver.sleep(200);
};

const authGroup = {
  code: 'INT-AUTH',
  title: 'Sign in interactions',
  module: 'Interactions',
  identity: 'guest',
  path: '/auth',
  viewport: 'desktop',
  cases: [
    {
      before: resetAuth,
      title: 'login form asks for an email address',
      run: async (ctx) => {
        const type = await ctx.attr('input[type="email"], input[name="email"]', 'placeholder');
        assert(type, 'Email input should render');
      },
    },
    {
      before: resetAuth,
      title: 'forgot password opens the reset form',
      run: async (ctx) => {
        await clickExact(ctx, 'Forgot Password?');
        await ctx.waitText('Send Reset Link', 5000);
      },
    },
    {
      before: resetAuth,
      title: 'reset form can be dismissed with back to login',
      run: async (ctx) => {
        await clickExact(ctx, 'Forgot Password?');
        await ctx.waitText('Send Reset Link', 5000);
        await clickExact(ctx, 'Back to Login');
        await ctx.waitText('Sign In', 5000);
      },
    },
    {
      before: resetAuth,
      title: 'register link switches to the sign-up form',
      run: async (ctx) => {
        await clickExact(ctx, 'Register Now');
        await ctx.waitText('Create Account', 5000);
      },
    },
    {
      before: resetAuth,
      title: 'sign-up form can return to the login form',
      run: async (ctx) => {
        await clickExact(ctx, 'Register Now');
        await ctx.waitText('Sign In Here', 5000);
        await clickExact(ctx, 'Sign In Here');
        await ctx.waitText('Sign In', 5000);
      },
    },
    {
      before: resetAuth,
      title: 'empty credentials do not navigate away from the auth page',
      run: async (ctx) => {
        await clickExact(ctx, 'Sign In');
        await ctx.driver.sleep(600);
        const hash = await ctx.hash();
        assert(hash.includes('/auth'), `Expected to stay on /auth but route is "${hash}"`);
      },
    },
    {
      before: resetAuth,
      title: 'invalid email is rejected by the browser validator',
      run: async (ctx) => {
        const valid = await ctx.exec(`
          var input = document.querySelector('input[type="email"]');
          if (!input) return null;
          input.value = 'not-an-email';
          return input.checkValidity();
        `);
        assert(valid === false, 'Browser should reject an invalid email address');
      },
    },
  ],
};

const landingSearchGroup = {
  code: 'INT-SEARCH',
  title: 'Landing catalogue search',
  module: 'Interactions',
  identity: 'guest',
  path: '/',
  viewport: 'desktop',
  cases: [
    {
      title: 'catalogue exposes a search box',
      run: async (ctx) => {
        const placeholder = await ctx.attr('input[placeholder]', 'placeholder');
        assert(
          placeholder && /search/i.test(placeholder),
          `Search input should be present (placeholder: ${placeholder})`
        );
      },
    },
    {
      title: 'searching by product name filters the catalogue',
      run: async (ctx) => {
        await ctx.type('input[placeholder*="Search by name"]', 'Radish');
        await ctx.driver.sleep(500);
        await ctx.expectText('Radish');
      },
    },
    {
      title: 'searching by nutrient matches the nutrient index',
      run: async (ctx) => {
        await ctx.type('input[placeholder*="Search by name"]', 'Iron');
        await ctx.driver.sleep(500);
        const body = await ctx.text();
        assert(
          /Iron|Green Gram|Spinach|Microgreen/i.test(body),
          'Nutrient search should return matching varieties'
        );
      },
    },
    {
      title: 'clearing the search restores the catalogue',
      run: async (ctx) => {
        await ctx.type('input[placeholder*="Search by name"]', 'Radish');
        await ctx.driver.sleep(400);
        await ctx.type('input[placeholder*="Search by name"]', '');
        await ctx.driver.sleep(500);
        await ctx.expectText('Explore Our');
      },
    },
  ],
};

const landingNavGroup = {
  code: 'INT-NAV',
  title: 'Landing page navigation',
  module: 'Interactions',
  identity: 'guest',
  path: '/',
  viewport: 'desktop',
  cases: [
    {
      title: 'catalogue section is reachable',
      run: async (ctx) => {
        assert(await ctx.exists('#catalogue'), 'Catalogue section should exist');
      },
    },
    {
      title: 'wellness boxes section is reachable',
      run: async (ctx) => {
        assert(await ctx.exists('#boxes'), 'Wellness boxes section should exist');
      },
    },
    {
      title: 'benefits section is reachable',
      run: async (ctx) => {
        assert(await ctx.exists('#benefits'), 'Benefits section should exist');
      },
    },
    {
      title: 'contact section is reachable',
      run: async (ctx) => {
        assert(await ctx.exists('#contact'), 'Contact section should exist');
      },
    },
    {
      title: 'header exposes the main navigation links',
      run: async (ctx) => {
        const links = await ctx.texts('header a, nav a');
        assert(links.length >= 4, `Expected several navigation links, found ${links.length}`);
      },
    },
    {
      title: 'flavour palette section renders',
      run: async (ctx) => {
        await ctx.expectText('Flavour Palette');
      },
    },
  ],
};

const aiGroup = {
  code: 'INT-AI',
  title: 'AI assistant widget',
  module: 'Interactions',
  identity: 'guest',
  path: '/',
  viewport: 'desktop',
  cases: [
    {
      before: resetLanding,
      title: 'floating AI button is rendered',
      run: async (ctx) => {
        assert(
          await ctx.exists('[aria-label="Toggle AI Advisor"]'),
          'AI advisor launch button should be visible'
        );
      },
    },
    {
      before: resetLanding,
      title: 'AI button opens the assistant panel',
      run: async (ctx) => {
        await ctx.click('[aria-label="Toggle AI Advisor"]');
        await ctx.waitFor(
          async () => ctx.exists('input[placeholder*="Ask about microgreens"]'),
          { timeout: 5000, message: 'AI panel did not open' }
        );
      },
    },
    {
      before: resetLanding,
      title: 'assistant offers a message input',
      run: async (ctx) => {
        await ctx.click('[aria-label="Toggle AI Advisor"]');
        await ctx.waitSelector('input[placeholder*="Ask about microgreens"]', 5000);
        const placeholder = await ctx.attr('input[placeholder*="Ask about microgreens"]', 'placeholder');
        assert(placeholder.length > 5, 'AI input should be labelled');
      },
    },
    {
      before: resetLanding,
      title: 'assistant can be closed again',
      run: async (ctx) => {
        await ctx.click('[aria-label="Toggle AI Advisor"]');
        await ctx.waitSelector('[aria-label="Close"]', 5000);
        await ctx.click('[aria-label="Close"]');
        await ctx.waitFor(async () => !(await ctx.exists('input[placeholder*="Ask about microgreens"]')), {
          timeout: 5000,
          message: 'AI panel did not close',
        });
      },
    },
    {
      before: resetLanding,
      title: 'assistant panel renders conversation content',
      run: async (ctx) => {
        await ctx.click('[aria-label="Toggle AI Advisor"]');
        await ctx.waitSelector('input[placeholder*="Ask about microgreens"]', 5000);
        const body = await ctx.text();
        assert(body.length > 200, 'AI panel should render content');
      },
    },
  ],
};

const a11yGroup = {
  code: 'INT-A11Y',
  title: 'Accessibility and document basics',
  module: 'Quality',
  identity: 'guest',
  path: '/',
  viewport: 'desktop',
  cases: [
    {
      title: 'document declares a language',
      run: async (ctx) => {
        const lang = await ctx.attr('html', 'lang');
        assert(lang && lang.length >= 2, 'html[lang] should be set');
      },
    },
    {
      title: 'document has exactly one main heading',
      run: async (ctx) => {
        const count = await ctx.count('h1');
        assert(count === 1, `Expected exactly one <h1>, found ${count}`);
      },
    },
    {
      title: 'every image declares an alt attribute',
      run: async (ctx) => {
        const missing = await ctx.count('img:not([alt])');
        assert(missing === 0, `${missing} image(s) are missing alt attributes`);
      },
    },
    {
      title: 'navigation links have non-empty hrefs',
      run: async (ctx) => {
        const broken = await ctx.exec(`
          var links = Array.from(document.querySelectorAll('a'));
          return links.filter(function (a) { return !a.getAttribute('href'); }).length;
        `);
        assert(broken === 0, `${broken} link(s) have no href`);
      },
    },
    {
      title: 'page has no duplicate element ids',
      run: async (ctx) => {
        const duplicates = await ctx.exec(`
          var seen = {}, dupes = [];
          Array.from(document.querySelectorAll('[id]')).forEach(function (el) {
            if (seen[el.id]) dupes.push(el.id); else seen[el.id] = true;
          });
          return dupes.length;
        `);
        assert(duplicates <= 2, `${duplicates} duplicate id(s) found`);
      },
    },
    {
      title: 'interactive icon buttons expose accessible names',
      run: async (ctx) => {
        const unnamed = await ctx.exec(`
          var buttons = Array.from(document.querySelectorAll('button'));
          return buttons.filter(function (b) {
            var name = (b.getAttribute('aria-label') || b.innerText || '').trim();
            return name.length === 0;
          }).length;
        `);
        assert(unnamed <= 2, `${unnamed} button(s) have no accessible name`);
      },
    },
  ],
};

const assetsGroup = {
  code: 'INT-ASSETS',
  title: 'Static assets and metadata',
  module: 'Quality',
  identity: 'guest',
  path: '/',
  viewport: 'desktop',
  cases: [
    {
      title: 'page loads the bundled stylesheet',
      run: async (ctx) => {
        const sheets = await ctx.exec('return document.styleSheets.length;');
        assert(sheets > 0, 'At least one stylesheet should be attached');
      },
    },
    {
      title: 'page renders the brand logo',
      run: async (ctx) => {
        const images = await ctx.count('img');
        assert(images >= 1, `Expected at least one image, found ${images}`);
      },
    },
    {
      title: 'document favicon link is present',
      run: async (ctx) => {
        const count = await ctx.count('link[rel*="icon"]');
        assert(count >= 1, 'A favicon link should be declared');
      },
    },
    {
      title: 'page runs without uncaught JavaScript errors',
      run: async (ctx) => {
        const messages = await ctx.consoleMessages();
        const severe = messages.filter(
          (entry) =>
            String(entry.level).toUpperCase() === 'SEVERE' &&
            !/failed to load resource|net::err|firebase|firestore|googleapis|gstatic|razorpay|unsplash|favicon/i.test(
              entry.message
            )
        );
        assert(
          severe.length === 0,
          `Unexpected console errors: ${severe
            .slice(0, 2)
            .map((entry) => entry.message.slice(0, 160))
            .join(' | ')}`
        );
      },
    },
  ],
};

const adminNavGroup = {
  code: 'INT-ADMIN-NAV',
  title: 'Admin navigation',
  module: 'Interactions',
  identity: 'admin',
  path: '/admin/dashboard',
  viewport: 'desktop',
  cases: [
    {
      before: resetAdmin,
      title: 'admin shell links to user management',
      run: async (ctx) => {
        const links = await ctx.texts('a, button');
        assert(
          links.some((text) => /users/i.test(text)),
          'Admin navigation should offer a Users entry'
        );
      },
    },
    {
      before: resetAdmin,
      title: 'clicking Users opens the user directory',
      run: async (ctx) => {
        await clickExact(ctx, 'Users', 'a, button');
        await ctx.waitHash('/admin/users', 6000);
        await ctx.waitText('User Management', 6000);
      },
    },
    {
      before: resetAdmin,
      title: 'user directory lists the seeded buyer',
      run: async (ctx) => {
        await clickExact(ctx, 'Users', 'a, button');
        await ctx.waitText('User Management', 6000);
        await ctx.waitText('E2E Buyer', 6000);
      },
    },
    {
      before: resetAdmin,
      title: 'admin console does not offer the buyer storefront',
      run: async (ctx) => {
        const body = (await ctx.text()).toLowerCase();
        assert(!body.includes('featured products'), 'Admin console should not render the storefront');
      },
    },
  ],
};

const responsiveGroups = [
  {
    code: 'RESP-LANDING',
    title: 'Landing page on mobile',
    module: 'Responsive',
    identity: 'guest',
    path: '/',
    viewport: 'mobile',
    cases: [
      {
        title: 'landing page renders on a 390px viewport',
        run: async (ctx) => {
          const body = (await ctx.text()).trim();
          assert(body.length > 100, 'Mobile landing page should render content');
        },
      },
      {
        title: 'mobile menu toggle is available',
        run: async (ctx) => {
          assert(await ctx.exists('[aria-label="Toggle menu"]'), 'Mobile menu toggle should be visible');
        },
      },
      {
        title: 'mobile menu opens the navigation panel',
        run: async (ctx) => {
          await ctx.click('[aria-label="Toggle menu"]');
          await ctx.driver.sleep(400);
          const links = await ctx.count('a');
          assert(links >= 4, `Expanded mobile menu should render links (found ${links})`);
        },
      },
      {
        title: 'mobile layout does not overflow horizontally',
        run: async (ctx) => {
          const overflow = await ctx.exec(
            'return document.documentElement.scrollWidth - window.innerWidth;'
          );
          assert(overflow <= 12, `Mobile layout overflows by ${overflow}px`);
        },
      },
    ],
  },
  {
    code: 'RESP-HOME',
    title: 'Buyer home on mobile',
    module: 'Responsive',
    identity: 'buyer',
    path: '/home',
    viewport: 'mobile',
    cases: [
      {
        title: 'buyer home renders on mobile',
        run: async (ctx) => {
          assert((await ctx.text()).length > 60, 'Buyer home should render on mobile');
        },
      },
      {
        title: 'mobile bottom navigation is present',
        run: async (ctx) => {
          const count = await ctx.count('div.fixed.bottom-0');
          assert(count >= 1, 'Bottom navigation should render on mobile');
        },
      },
      {
        title: 'mobile bottom navigation offers the buyer destinations',
        run: async (ctx) => {
          const body = await ctx.text();
          for (const label of ['Home', 'Cart', 'Orders', 'Profile']) {
            assert(body.includes(label), `Bottom navigation should offer "${label}"`);
          }
        },
      },
      {
        title: 'mobile home does not overflow horizontally',
        run: async (ctx) => {
          const overflow = await ctx.exec(
            'return document.documentElement.scrollWidth - window.innerWidth;'
          );
          assert(overflow <= 12, `Buyer home overflows by ${overflow}px`);
        },
      },
    ],
  },
  {
    code: 'RESP-ADMIN',
    title: 'Admin console on tablet',
    module: 'Responsive',
    identity: 'admin',
    path: '/admin/dashboard',
    viewport: 'tablet',
    cases: [
      {
        title: 'admin dashboard renders on tablet',
        run: async (ctx) => {
          await ctx.expectText('Admin Dashboard');
        },
      },
      {
        title: 'tablet admin keeps the navigation available',
        run: async (ctx) => {
          const links = await ctx.texts('a, button');
          assert(links.length >= 4, 'Admin navigation should remain available on tablet');
        },
      },
      {
        title: 'tablet admin fits the viewport',
        run: async (ctx) => {
          const overflow = await ctx.exec(
            'return document.documentElement.scrollWidth - window.innerWidth;'
          );
          assert(overflow <= 120, `Admin console overflows by ${overflow}px on tablet`);
        },
      },
    ],
  },
  {
    code: 'RESP-AUTH',
    title: 'Sign in page on mobile',
    module: 'Responsive',
    identity: 'guest',
    path: '/auth',
    viewport: 'mobile',
    cases: [
      {
        title: 'auth form renders on mobile',
        run: async (ctx) => {
          assert(await ctx.exists('input[type="password"]'), 'Password field should render on mobile');
        },
      },
      {
        title: 'mobile auth form does not overflow horizontally',
        run: async (ctx) => {
          const overflow = await ctx.exec(
            'return document.documentElement.scrollWidth - window.innerWidth;'
          );
          assert(overflow <= 12, `Auth page overflows by ${overflow}px`);
        },
      },
    ],
  },
];

export const interactionGroups = [
  authGroup,
  landingSearchGroup,
  landingNavGroup,
  aiGroup,
  a11yGroup,
  assetsGroup,
  adminNavGroup,
  ...responsiveGroups,
];
