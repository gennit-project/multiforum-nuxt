import { describe, it, expect } from 'vitest';
import type { PluginFormSection } from '@/types/pluginForms';
import {
  resolvePluginMetadata,
  resolvePluginReadme,
  canEnablePlugin,
  sortVersionsDescending,
  hasNewerVersions,
  mapInstallErrorMessage,
  validateRequiredSettings,
} from './pluginVersionUtils';

describe('resolvePluginMetadata', () => {
  it('prefers the installed display name', () => {
    expect(
      resolvePluginMetadata({
        installed: { displayName: 'Installed' },
        registry: { displayName: 'Registry' },
        pluginId: 'p1',
      }).displayName
    ).toBe('Installed');
  });

  it('falls back to the plugin id when nothing else is available', () => {
    expect(
      resolvePluginMetadata({ pluginId: 'p1' }).displayName
    ).toBe('p1');
  });

  it('defaults tags to an empty array', () => {
    expect(resolvePluginMetadata({ pluginId: 'p1' }).tags).toEqual([]);
  });
});

describe('resolvePluginReadme', () => {
  const versions = [
    { version: '1.0.0', readmeMarkdown: 'one' },
    { version: '2.0.0', readmeMarkdown: 'two' },
  ];

  it('prefers the installed README', () => {
    expect(
      resolvePluginReadme({
        installedReadme: 'installed',
        detailVersions: versions,
      })
    ).toBe('installed');
  });

  it('uses the selected version README', () => {
    expect(
      resolvePluginReadme({ selectedVersion: '2.0.0', detailVersions: versions })
    ).toBe('two');
  });

  it('falls back to the first version with a README', () => {
    expect(
      resolvePluginReadme({ selectedVersion: '9.0.0', detailVersions: versions })
    ).toBe('one');
  });

  it('returns null when no README exists anywhere', () => {
    expect(resolvePluginReadme({ detailVersions: [] })).toBeNull();
  });
});

describe('canEnablePlugin', () => {
  it('returns false when the plugin is not installed', () => {
    expect(canEnablePlugin({ isInstalled: false, secrets: [] })).toBe(false);
  });

  it('returns true when all secrets are valid or untested', () => {
    expect(
      canEnablePlugin({
        isInstalled: true,
        secrets: [{ status: 'VALID' }, { status: 'SET_UNTESTED' }],
      })
    ).toBe(true);
  });

  it('returns false when any secret is invalid', () => {
    expect(
      canEnablePlugin({ isInstalled: true, secrets: [{ status: 'INVALID' }] })
    ).toBe(false);
  });
});

describe('sortVersionsDescending', () => {
  it('orders versions newest-first', () => {
    expect(
      sortVersionsDescending([
        { version: '1.0.0' },
        { version: '2.1.0' },
        { version: '2.0.0' },
      ]).map((v) => v.version)
    ).toEqual(['2.1.0', '2.0.0', '1.0.0']);
  });
});

describe('hasNewerVersions', () => {
  it('returns true when no version is installed', () => {
    expect(hasNewerVersions(undefined, [{ version: '1.0.0' }])).toBe(true);
  });

  it('returns false when only the installed version is available', () => {
    expect(hasNewerVersions('1.0.0', [{ version: '1.0.0' }])).toBe(false);
  });
});

describe('mapInstallErrorMessage', () => {
  it('maps a registry-not-found error', () => {
    expect(mapInstallErrorMessage('PLUGIN_VERSION_NOT_FOUND')).toContain(
      'not found in registry'
    );
  });

  it('maps an integrity mismatch error', () => {
    expect(mapInstallErrorMessage('SHA-256 mismatch')).toContain(
      'integrity check failed'
    );
  });

  it('falls back to a generic message including the original text', () => {
    expect(mapInstallErrorMessage('boom')).toBe('Installation failed: boom');
  });
});

describe('validateRequiredSettings', () => {
  const sections = [
    {
      title: 'S',
      fields: [
        { key: 'name', label: 'Name', validation: { required: true } },
        { key: 'opt', label: 'Opt' },
      ],
    },
  ] as unknown as PluginFormSection[];

  it('reports an error for an empty required field', () => {
    expect(validateRequiredSettings(sections, {})).toEqual({
      name: 'Name is required',
    });
  });

  it('passes when the required field is provided', () => {
    expect(validateRequiredSettings(sections, { name: 'x' })).toEqual({});
  });
});
