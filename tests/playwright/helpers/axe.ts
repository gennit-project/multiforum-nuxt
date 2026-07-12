import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

// The rules we actively enforce as a regression guard. These map to the
// name/role/value and structural issues the accessibility remediation
// campaign fixed, and they rarely false-positive on well-formed markup.
//
// Deliberately NOT enforced yet (noisier / not fully audited across the app):
// `color-contrast`, `region`/landmark rules. Add them here once those areas
// have been swept so the guard can only ever get stricter.
export const ENFORCED_AXE_RULES = [
  'button-name',
  'link-name',
  'image-alt',
  'input-image-alt',
  'label',
  'select-name',
  'aria-allowed-attr',
  'aria-command-name',
  'aria-required-attr',
  'aria-required-children',
  'aria-required-parent',
  'aria-roles',
  'aria-toggle-field-name',
  'aria-tooltip-name',
  'aria-valid-attr',
  'aria-valid-attr-value',
  'document-title',
  'html-has-lang',
  'list',
  'listitem',
  'definition-list',
  'dlitem',
  'duplicate-id-aria',
  'tabindex',
] as const;

// Run axe against the current page for the enforced rule set and assert there
// are no violations. On failure the assertion message lists each violated rule
// and the offending selectors so the report is actionable.
export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withRules([...ENFORCED_AXE_RULES])
    .analyze();

  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => n.target.join(' ')),
  }));

  expect(
    summary,
    `axe found accessibility violations:\n${JSON.stringify(summary, null, 2)}`
  ).toEqual([]);
}
