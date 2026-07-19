import { describe, expect, it } from 'vitest';
import { buildPluginUpgradePreview } from '@/utils/pluginUpgradeUtils';

const manifest = {
  settingsDefaults: { server: { endpoint: 'default', mode: 'safe', added: true, profiles: [] } },
  ui: {
    forms: {
      server: [{
        title: 'Settings',
        fields: [
          { key: 'endpoint', label: 'Endpoint', type: 'text' as const },
          { key: 'mode', label: 'Mode', type: 'select' as const, options: [{ value: 'safe', label: 'Safe' }] },
          { key: 'added', label: 'Added', type: 'toggle' as const },
        ],
      }],
    },
  },
};

describe('buildPluginUpgradePreview', () => {
  it('reports carried, dropped, reset, and new-default settings', () => {
    const result = buildPluginUpgradePreview({
      oldSettings: { endpoint: 'custom', mode: 'legacy', removed: true, profiles: [{ id: 'custom' }] },
      newManifest: manifest,
    });

    expect(result).toEqual({
      settings: { endpoint: 'custom', mode: 'safe', added: true, profiles: [{ id: 'custom' }] },
      report: {
        carried: ['endpoint', 'profiles'],
        dropped: ['removed'],
        reset: ['mode'],
        newDefaults: ['added'],
      },
    });
  });
});
