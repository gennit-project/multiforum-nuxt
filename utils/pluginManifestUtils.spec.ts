import { describe, it, expect } from 'vitest';
import type { PluginFormSection } from '@/types/pluginForms';
import {
  getPluginFormSections,
  getSettingsDefaults,
  parseSettingsJson,
  serializeSettingsJson,
  stringifyManifest,
  isBotPlugin,
  normalizeBotProfiles,
  parseBotProfiles,
  resolveServerBotName,
  resolveServerProfiles,
  filterChannelSectionsForBot,
  buildEnabledPluginsInput,
} from './pluginManifestUtils';

describe('getPluginFormSections', () => {
  it('returns the sections for the requested scope', () => {
    const sections = [{ title: 'S', fields: [] }] as PluginFormSection[];
    expect(
      getPluginFormSections({ ui: { forms: { server: sections } } }, 'server')
    ).toBe(sections);
  });

  it('returns an empty array when the manifest is null', () => {
    expect(getPluginFormSections(null, 'channel')).toEqual([]);
  });
});

describe('getSettingsDefaults', () => {
  it('returns a shallow copy of the scope defaults', () => {
    const defaults = { botName: 'x' };
    const result = getSettingsDefaults(
      { settingsDefaults: { server: defaults } },
      'server'
    );
    expect(result).toEqual(defaults);
  });

  it('returns an empty object when defaults are absent', () => {
    expect(getSettingsDefaults({}, 'server')).toEqual({});
  });
});

describe('parseSettingsJson', () => {
  it('parses a JSON string into an object', () => {
    expect(parseSettingsJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('passes an object through unchanged', () => {
    expect(parseSettingsJson({ a: 1 })).toEqual({ a: 1 });
  });

  it('returns an empty object for invalid JSON', () => {
    expect(parseSettingsJson('not json')).toEqual({});
  });

  it('returns an empty object for nullish input', () => {
    expect(parseSettingsJson(null)).toEqual({});
  });
});

describe('serializeSettingsJson', () => {
  it('passes an existing string through', () => {
    expect(serializeSettingsJson('{"a":1}')).toBe('{"a":1}');
  });

  it('serializes an object', () => {
    expect(serializeSettingsJson({ a: 1 })).toBe('{"a":1}');
  });
});

describe('stringifyManifest', () => {
  it('returns null for no manifest', () => {
    expect(stringifyManifest(null)).toBeNull();
  });

  it('pretty-prints a manifest', () => {
    expect(stringifyManifest({ settingsDefaults: {} })).toContain('\n');
  });
});

describe('isBotPlugin', () => {
  it('detects a bot tag case-insensitively', () => {
    expect(isBotPlugin(['Featured', 'BOT'])).toBe(true);
  });

  it('returns false when there is no bot tag', () => {
    expect(isBotPlugin(['featured'])).toBe(false);
  });

  it('returns false for non-array input', () => {
    expect(isBotPlugin(null)).toBe(false);
  });
});

describe('normalizeBotProfiles', () => {
  it('normalizes raw profiles into id/label/prompt', () => {
    expect(
      normalizeBotProfiles([{ id: 'p1', label: 'L', prompt: 'P' }])
    ).toEqual([{ id: 'p1', label: 'L', prompt: 'P' }]);
  });

  it('falls back to displayName for the label when enabled', () => {
    expect(
      normalizeBotProfiles([{ id: 'p1', displayName: 'Bot' }], {
        displayNameFallback: true,
      })[0].label
    ).toBe('Bot');
  });

  it('returns an empty array for non-array input', () => {
    expect(normalizeBotProfiles(undefined)).toEqual([]);
  });
});

describe('parseBotProfiles', () => {
  it('parses a JSON string of profiles', () => {
    expect(parseBotProfiles('[{"id":"p1"}]')[0].id).toBe('p1');
  });

  it('returns an empty array for nullish input', () => {
    expect(parseBotProfiles(null)).toEqual([]);
  });
});

describe('resolveServerBotName', () => {
  it('prefers the user settings bot name', () => {
    expect(
      resolveServerBotName({ settingsJson: '{"botName":"custom"}' })
    ).toBe('custom');
  });

  it('falls back to the manifest server default', () => {
    expect(
      resolveServerBotName({
        manifest: { settingsDefaults: { server: { botName: 'default' } } },
      })
    ).toBe('default');
  });
});

describe('resolveServerProfiles', () => {
  it('reads profiles from the manifest server defaults', () => {
    expect(
      resolveServerProfiles({
        manifest: {
          settingsDefaults: { server: { profiles: [{ id: 'p1', label: 'L' }] } },
        },
      })[0].id
    ).toBe('p1');
  });

  it('returns an empty array when no profiles exist anywhere', () => {
    expect(resolveServerProfiles({})).toEqual([]);
  });
});

describe('filterChannelSectionsForBot', () => {
  const sections = [
    {
      title: 'S',
      fields: [{ key: 'profilesJson' }, { key: 'other' }],
    },
  ] as unknown as PluginFormSection[];

  it('passes sections through unchanged for non-bot plugins', () => {
    expect(filterChannelSectionsForBot(sections, false)).toBe(sections);
  });

  it('drops the profilesJson field for bot plugins', () => {
    expect(
      filterChannelSectionsForBot(sections, true)[0].fields.map((f) => f.key)
    ).toEqual(['other']);
  });
});

describe('buildEnabledPluginsInput', () => {
  const base = {
    pluginId: 'plug',
    version: '1.0.0',
    settingsJson: '{}',
  };

  it('connects a newly enabled plugin with no existing edge', () => {
    expect(
      buildEnabledPluginsInput({ ...base, enabled: true, hasEdge: false })[0]
    ).toHaveProperty('connect');
  });

  it('updates the edge for an already-connected enabled plugin', () => {
    expect(
      buildEnabledPluginsInput({ ...base, enabled: true, hasEdge: true })[0]
    ).toHaveProperty('update');
  });

  it('disconnects a disabled plugin that has an edge', () => {
    expect(
      buildEnabledPluginsInput({ ...base, enabled: false, hasEdge: true })[0]
    ).toHaveProperty('disconnect');
  });

  it('returns an empty array when disabling a plugin with no edge', () => {
    expect(
      buildEnabledPluginsInput({ ...base, enabled: false, hasEdge: false })
    ).toEqual([]);
  });
});
