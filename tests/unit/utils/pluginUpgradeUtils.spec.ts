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
