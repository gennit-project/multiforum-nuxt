import { describe, it, expect } from 'vitest';
import {
  resolvePluginMetadata,
  resolvePluginReadme,
  canEnablePlugin,
  sortVersionsDescending,
  hasNewerVersions,
  mapInstallErrorMessage,
  validateRequiredSettings,
} from '@/utils/pluginVersionUtils';
import type { PluginFormSection } from '@/types/pluginForms';

describe('resolvePluginMetadata', () => {
  it('prefers installed values over registry values', () => {
    const meta = resolvePluginMetadata({
      installed: { displayName: 'Installed' },
      registry: { displayName: 'Registry' },
      pluginId: 'p1',
    });
    expect(meta.displayName).toBe('Installed');
  });

  it('falls back to the registry name for the display name', () => {
    const meta = resolvePluginMetadata({
      installed: null,
      registry: { name: 'reg-name' },
      pluginId: 'p1',
    });
    expect(meta.displayName).toBe('reg-name');
  });

  it('falls back to the plugin id when nothing else is present', () => {
    const meta = resolvePluginMetadata({ installed: null, registry: null, pluginId: 'p1' });
    expect(meta.displayName).toBe('p1');
  });

  it('defaults tags to an empty array', () => {
    const meta = resolvePluginMetadata({ installed: null, registry: null, pluginId: 'p1' });
    expect(meta.tags).toEqual([]);
  });
});

describe('resolvePluginReadme', () => {
  it('returns the installed readme first', () => {
    expect(
      resolvePluginReadme({ installedReadme: 'INSTALLED', detailVersions: [] })
    ).toBe('INSTALLED');
  });

  it('returns the selected version readme', () => {
    expect(
      resolvePluginReadme({
        selectedVersion: '2.0.0',
        detailVersions: [
          { version: '1.0.0', readmeMarkdown: 'one' },
          { version: '2.0.0', readmeMarkdown: 'two' },
        ],
      })
    ).toBe('two');
  });

  it('falls back to the first version with a readme', () => {
    expect(
      resolvePluginReadme({
        selectedVersion: '9.9.9',
        detailVersions: [{ version: '1.0.0' }, { version: '2.0.0', readmeMarkdown: 'two' }],
      })
    ).toBe('two');
  });

  it('returns null when no readme is available', () => {
    expect(resolvePluginReadme({ detailVersions: [{ version: '1.0.0' }] })).toBeNull();
  });
});

describe('canEnablePlugin', () => {
  it('returns false when not installed', () => {
    expect(canEnablePlugin({ isInstalled: false, secrets: [] })).toBe(false);
  });

  it('returns true when all secrets are valid or set-untested', () => {
    expect(
      canEnablePlugin({
        isInstalled: true,
        secrets: [{ status: 'VALID' }, { status: 'SET_UNTESTED' }],
      })
    ).toBe(true);
  });

  it('returns false when a secret is not set', () => {
    expect(
      canEnablePlugin({ isInstalled: true, secrets: [{ status: 'NOT_SET' }] })
    ).toBe(false);
  });
});

describe('sortVersionsDescending', () => {
  it('sorts versions newest first', () => {
    const sorted = sortVersionsDescending([
      { version: '1.0.0' },
      { version: '2.1.0' },
      { version: '2.0.0' },
    ]);
    expect(sorted.map((v) => v.version)).toEqual(['2.1.0', '2.0.0', '1.0.0']);
  });

  it('does not mutate the input array', () => {
    const input = [{ version: '1.0.0' }, { version: '2.0.0' }];
    sortVersionsDescending(input);
    expect(input.map((v) => v.version)).toEqual(['1.0.0', '2.0.0']);
  });
});

describe('hasNewerVersions', () => {
  it('returns true when nothing is installed', () => {
    expect(hasNewerVersions(undefined, [{ version: '1.0.0' }])).toBe(true);
  });

  it('returns true when an available version differs from installed', () => {
    expect(hasNewerVersions('1.0.0', [{ version: '1.0.0' }, { version: '2.0.0' }])).toBe(true);
  });

  it('returns false when only the installed version is available', () => {
    expect(hasNewerVersions('1.0.0', [{ version: '1.0.0' }])).toBe(false);
  });
});

describe('mapInstallErrorMessage', () => {
  it('maps a version-not-found error', () => {
    expect(mapInstallErrorMessage('PLUGIN_VERSION_NOT_FOUND')).toContain('not found in registry');
  });

  it('maps an integrity mismatch error', () => {
    expect(mapInstallErrorMessage('SHA-256 mismatch')).toContain('integrity check failed');
  });

  it('maps a registry fetch failure', () => {
    expect(mapInstallErrorMessage('Failed to fetch plugin registry')).toContain('connect to the plugin registry');
  });

  it('maps a tarball download failure', () => {
    expect(mapInstallErrorMessage('Failed to download tarball')).toContain('download the plugin tarball');
  });

  it('falls back to a generic message including the original text', () => {
    expect(mapInstallErrorMessage('weird thing')).toBe('Installation failed: weird thing');
  });

  it('handles an empty message', () => {
    expect(mapInstallErrorMessage('')).toBe('Installation failed: Unknown error');
  });
});

describe('validateRequiredSettings', () => {
  const sections: PluginFormSection[] = [
    {
      title: 'S',
      fields: [
        { key: 'apiKey', type: 'text', label: 'API Key', validation: { required: true } },
        { key: 'optional', type: 'text', label: 'Optional' },
      ],
    },
  ];

  it('flags a missing required field', () => {
    expect(validateRequiredSettings(sections, { apiKey: '' })).toEqual({
      apiKey: 'API Key is required',
    });
  });

  it('returns no errors when required fields are filled', () => {
    expect(validateRequiredSettings(sections, { apiKey: 'set' })).toEqual({});
  });

  it('ignores optional empty fields', () => {
    expect(validateRequiredSettings(sections, { apiKey: 'set', optional: '' })).toEqual({});
  });
});
