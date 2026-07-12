import { test, expect } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { expectNoAxeViolations } from '../../helpers/axe';

// Smoke-level axe pass over a few representative pages: a static content page,
// a form page, and the sitewide discussion list. This is a regression guard
// for the name/role/value + structural rules the a11y campaign fixed (see
// ENFORCED_AXE_RULES); it is intentionally a small, fast set rather than a full
// site crawl. Expand the page list / rule set as more areas are audited.
const PAGES = [
  { name: 'about', path: '/about' },
  { name: 'support', path: '/support' },
  { name: 'sitewide discussions', path: '/discussions' },
];

for (const { name, path } of PAGES) {
  test(`${name} page has no axe violations for the enforced rules`, async ({
    page,
    setupMockedPage,
  }) => {
    await setupMockedPage({ handlers: createBaseHandlers() });

    await page.goto(path);
    // Let the app hydrate and the main content render before scanning.
    await expect(page.locator('#main-content')).toBeAttached();

    await expectNoAxeViolations(page);
  });
}
