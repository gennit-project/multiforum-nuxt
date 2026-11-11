import { describe, expect, it } from 'vitest';
import { buildPluginUpgradePreview } from '@/utils/pluginUpgradeUtils';

const manifest = {
  settingsDefaults: {
    server: {
      endpoint: 'default',
      mode: 'safe',
      added: true,
      profiles: [],
      forums: [],
    },
  },
  ui: {
    forms: {
      server: [
        {
          title: 'Settings',
          fields: [
            { key: 'endpoint', label: 'Endpoint', type: 'text' as const },
            {
              key: 'mode',
              label: 'Mode',
              type: 'select' as const,
              options: [{ value: 'safe', label: 'Safe' }],
            },
            { key: 'added', label: 'Added', type: 'toggle' as const },
            {
              key: 'forums',
              label: 'Forums',
              type: 'forum-multiselect' as const,
            },
          ],
        },
      ],
    },
  },
};

describe('buildPluginUpgradePreview', () => {
  it('reports carried, dropped, reset, and new-default settings', () => {
    const result = buildPluginUpgradePreview({
      oldSettings: {
        endpoint: 'custom',
        mode: 'legacy',
        removed: true,
        profiles: [{ id: 'custom' }],
        forums: ['cats'],
      },
      newManifest: manifest,
    });

    expect(result).toEqual({
      settings: {
        endpoint: 'custom',
        mode: 'safe',
        added: true,
        profiles: [{ id: 'custom' }],
        forums: ['cats'],
      },
      report: {
        carried: ['endpoint', 'profiles', 'forums'],
        dropped: ['removed'],
        reset: ['mode'],
        newDefaults: ['added'],
      },
    });
  });

  it('resets a forum multi-select containing non-string values', () => {
    const result = buildPluginUpgradePreview({
      oldSettings: { forums: ['cats', 42] },
      newManifest: manifest,
    });

    expect(result).toMatchObject({
      settings: { forums: [] },
      report: { reset: ['forums'] },
    });
  });
});

const governanceManifest = {
  settingsDefaults: { server: { serverRuleEnforcement: 'off', channelRuleEligibility: 'all' } },
  ui: { forms: { server: [{ title: 'Rules', fields: [{ key: 'serverRuleEnforcement', label: 'Server rules', type: 'select', options: [{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }] }] }] } },
};

describe('governance upgrade preview', () => {
  it.each(['allowlist', 'all_forums', 'off'])('preserves legacy %s scope until an explicit admin migration', (mode) => {
    expect(buildPluginUpgradePreview({ oldSettings: { serverRuleCheckMode: mode, serverRuleForumAllowlist: ['trial'] }, newManifest: governanceManifest })).toEqual({
      settings: { channelRuleEligibility: 'all', serverRuleCheckMode: mode, serverRuleForumAllowlist: ['trial'] },
      report: { carried: ['serverRuleCheckMode', 'serverRuleForumAllowlist'], dropped: [], reset: [], newDefaults: ['channelRuleEligibility'] },
    });
  });
  it('preserves explicit policy rather than returning to the legacy scope', () => {
    expect(buildPluginUpgradePreview({ oldSettings: { serverRuleEnforcement: 'on', serverRuleCheckMode: 'allowlist' }, newManifest: governanceManifest })).toEqual({
      settings: { serverRuleEnforcement: 'on', channelRuleEligibility: 'all' },
      report: { carried: ['serverRuleEnforcement'], dropped: ['serverRuleCheckMode'], reset: [], newDefaults: ['channelRuleEligibility'] },
    });
  });
  it.each([
    { serverRuleCheckMode: 'allowlist', serverRuleForumAllowlist: ['trial'] },
    JSON.stringify({ serverRuleCheckMode: 'allowlist', serverRuleForumAllowlist: ['trial'] }),
  ])('normalizes nested legacy governance before generating the preview', (server) => {
    expect(buildPluginUpgradePreview({ oldSettings: { server }, newManifest: governanceManifest })).toEqual({
      settings: { channelRuleEligibility: 'all', serverRuleCheckMode: 'allowlist', serverRuleForumAllowlist: ['trial'] },
      report: { carried: ['serverRuleCheckMode', 'serverRuleForumAllowlist'], dropped: ['server'], reset: [], newDefaults: ['channelRuleEligibility'] },
    });
  });
  it('normalizes nested explicit policy and preserves top-level precedence', () => {
    expect(buildPluginUpgradePreview({ oldSettings: { server: { serverRuleEnforcement: 'on', channelRuleEligibility: 'none' }, serverRuleEnforcement: 'off' }, newManifest: governanceManifest })).toEqual({
      settings: { serverRuleEnforcement: 'off', channelRuleEligibility: 'none' },
      report: { carried: ['serverRuleEnforcement', 'channelRuleEligibility'], dropped: ['server'], reset: [], newDefaults: [] },
    });
  });
  it('does not mutate the original nested settings during preview', () => {
    const oldSettings = { server: { serverRuleCheckMode: 'allowlist' } };
    buildPluginUpgradePreview({ oldSettings, newManifest: governanceManifest });
    expect(oldSettings).toEqual({ server: { serverRuleCheckMode: 'allowlist' } });
  });
  it('does not retain removed legacy keys for a target without governance', () => {
    expect(buildPluginUpgradePreview({ oldSettings: { serverRuleCheckMode: 'allowlist' }, newManifest: {} })).toEqual({
      settings: {}, report: { carried: [], dropped: ['serverRuleCheckMode'], reset: [], newDefaults: [] },
    });
  });
});
