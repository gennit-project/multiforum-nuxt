import { describe, expect, it } from 'vitest';
import {
  hasRuleGovernance,
  selectGovernanceInstallation,
  selectGovernanceAdminInstallation,
  supportsRuleGovernance,
  initializeGovernanceSettings,
  requiresGovernanceMigration,
  getGovernanceServerSections,
} from './pluginGovernance';

describe('plugin governance configuration', () => {
  it('lets admins configure a newer disabled installation before enabling it', () => {
    expect(
      selectGovernanceAdminInstallation({
        plugins: [
          { version: '0.7.1', enabled: true },
          { version: '0.8.0', enabled: false },
        ],
        selectedVersion: '',
      })?.version
    ).toBe('0.8.0');
  });
  it('lets admins inspect the installed version they selected', () => {
    expect(
      selectGovernanceAdminInstallation({
        plugins: [
          { version: '0.7.1', enabled: true },
          { version: '0.8.0', enabled: false },
        ],
        selectedVersion: '0.7.1',
      })?.version
    ).toBe('0.7.1');
  });

  it.each([
    [
      [
        { version: '0.9.0', enabled: false },
        { version: '0.8.0', enabled: true },
      ],
      '0.8.0',
    ],
    [
      [
        { version: '0.7.1', enabled: false },
        { version: '0.8.0', enabled: true },
      ],
      '0.8.0',
    ],
    [
      [
        { version: '0.8.0', enabled: true },
        { version: '0.9.0', enabled: true },
      ],
      '0.9.0',
    ],
    [
      [
        { version: '0.7.1', enabled: false },
        { version: '0.8.0', enabled: false },
      ],
      '0.8.0',
    ],
  ])('selects the authoritative active version', (plugins, expected) => {
    expect(selectGovernanceInstallation(plugins)?.version).toBe(expected);
  });

  it.each([
    ['0.7.1', false],
    ['0.8.0-beta.1', false],
    ['0.8.0', true],
    ['0.9.0', true],
    ['unknown', false],
  ])('gates version %s', (version, expected) => {
    expect(supportsRuleGovernance(version)).toBe(expected);
  });
  it.each([
    ['llm-moderation', true],
    ['scanner', false],
  ])('recognizes supported plugin %s', (id, expected) => {
    expect(hasRuleGovernance(id)).toBe(expected);
  });
  it('requires an explicit global choice for the legacy server-rule allowlist', () => {
    expect(
      initializeGovernanceSettings({
        serverRuleCheckMode: 'allowlist',
        serverRuleForumAllowlist: ['cats'],
      })
    ).toMatchObject({
      serverRuleEnforcement: '',
      channelRuleEligibility: 'all',
      channelRuleAllowlist: [],
    });
  });
  it.each([
    ['all_forums', 'on'],
    ['off', 'off'],
  ])('preserves legacy global mode %s', (legacy, expected) => {
    expect(
      initializeGovernanceSettings({ serverRuleCheckMode: legacy })
        .serverRuleEnforcement
    ).toBe(expected);
  });
  it('preserves an explicit new policy over legacy fields', () => {
    expect(
      initializeGovernanceSettings({
        serverRuleCheckMode: 'allowlist',
        serverRuleEnforcement: 'off',
        channelRuleEligibility: 'none',
        channelRuleAllowlist: ['cats'],
      })
    ).toMatchObject({
      serverRuleEnforcement: 'off',
      channelRuleEligibility: 'none',
      channelRuleAllowlist: ['cats'],
    });
  });
  it.each([
    [{ serverRuleCheckMode: 'allowlist' }, true],
    [{ serverRuleCheckMode: 'allowlist', serverRuleEnforcement: 'off' }, false],
    [{}, false],
  ])('identifies pending migration %j', (settings, expected) => {
    expect(requiresGovernanceMigration(settings)).toBe(expected);
  });
  it('requires migration for a nested legacy allowlist without reusing it for channel eligibility', () => {
    const settings = {
      server: {
        serverRuleCheckMode: 'allowlist',
        serverRuleForumAllowlist: ['cats'],
      },
      model: 'custom',
    };
    expect({
      required: requiresGovernanceMigration(settings),
      values: initializeGovernanceSettings(settings),
    }).toEqual({
      required: true,
      values: {
        ...settings,
        serverRuleEnforcement: '',
        channelRuleEligibility: 'all',
        channelRuleAllowlist: [],
      },
    });
  });
  it('reads nested explicit policy and gives flat values precedence', () => {
    const settings = {
      server: {
        serverRuleEnforcement: 'on',
        channelRuleEligibility: 'allowlist',
        channelRuleAllowlist: ['cats'],
      },
      serverRuleEnforcement: 'off',
    };
    expect(initializeGovernanceSettings(settings)).toEqual({
      ...settings,
      serverRuleEnforcement: 'off',
      channelRuleEligibility: 'allowlist',
      channelRuleAllowlist: ['cats'],
    });
  });
  it('does not reinterpret explicitly null policy as legacy or permissive defaults', () => {
    const settings = {
      server: {
        serverRuleCheckMode: 'allowlist',
        serverRuleEnforcement: 'on',
        channelRuleEligibility: 'all',
      },
      serverRuleEnforcement: null,
      channelRuleEligibility: null,
    };
    expect({
      required: requiresGovernanceMigration(settings),
      values: initializeGovernanceSettings(settings),
    }).toEqual({
      required: false,
      values: {
        ...settings,
        serverRuleEnforcement: '',
        channelRuleEligibility: '',
        channelRuleAllowlist: [],
      },
    });
  });
  it('reads JSON-encoded nested legacy policy', () => {
    expect(
      initializeGovernanceSettings(
        JSON.stringify({
          server: JSON.stringify({ serverRuleCheckMode: 'all_forums' }),
        })
      ).serverRuleEnforcement
    ).toBe('on');
  });
  it('replaces legacy fields while retaining unrelated server options', () => {
    const manifest = {
      ui: {
        forms: {
          server: [
            {
              title: 'Old',
              fields: [
                { key: 'serverRuleCheckMode', type: 'text', label: 'Old mode' },
                { key: 'model', type: 'text', label: 'Model' },
              ],
            },
          ],
        },
      },
    };
    expect(
      getGovernanceServerSections(manifest).flatMap((section) =>
        section.fields.map((field) => field.key)
      )
    ).toEqual([
      'serverRuleEnforcement',
      'channelRuleEligibility',
      'channelRuleAllowlist',
      'model',
    ]);
  });
  it('allows an empty eligibility allowlist', () => {
    expect(
      getGovernanceServerSections(null)[0]?.fields.find(
        (field) => field.key === 'channelRuleAllowlist'
      )?.required
    ).not.toBe(true);
  });
});
