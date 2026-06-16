import { describe, it, expect } from 'vitest';
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
} from '@/utils/pluginManifestUtils';
import type { PluginFormSection } from '@/types/pluginForms';

const section = (key: string, extra: Partial<PluginFormSection> = {}): PluginFormSection => ({
  title: 'Section',
  fields: [{ key, type: 'text', label: key }],
  ...extra,
});

describe('getPluginFormSections', () => {
  it('returns the server sections when present', () => {
    const manifest = { ui: { forms: { server: [section('a')] } } };
    expect(getPluginFormSections(manifest, 'server')).toHaveLength(1);
  });

  it('returns the channel sections when present', () => {
    const manifest = { ui: { forms: { channel: [section('a'), section('b')] } } };
    expect(getPluginFormSections(manifest, 'channel')).toHaveLength(2);
  });

  it('returns an empty array when the scope is missing', () => {
    expect(getPluginFormSections({ ui: { forms: {} } }, 'server')).toEqual([]);
  });

  it('returns an empty array for a null manifest', () => {
    expect(getPluginFormSections(null, 'channel')).toEqual([]);
  });
});

describe('getSettingsDefaults', () => {
  it('returns a copy of the scope defaults', () => {
    const manifest = { settingsDefaults: { channel: { a: 1 } } };
    expect(getSettingsDefaults(manifest, 'channel')).toEqual({ a: 1 });
  });

  it('does not return the same reference', () => {
    const defaults = { a: 1 };
    const manifest = { settingsDefaults: { channel: defaults } };
    expect(getSettingsDefaults(manifest, 'channel')).not.toBe(defaults);
  });

  it('returns an empty object when defaults are absent', () => {
    expect(getSettingsDefaults({}, 'server')).toEqual({});
  });
});

describe('parseSettingsJson', () => {
  it('returns an empty object for nullish input', () => {
    expect(parseSettingsJson(null)).toEqual({});
  });

  it('parses a JSON string', () => {
    expect(parseSettingsJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('returns an empty object for invalid JSON', () => {
    expect(parseSettingsJson('{bad')).toEqual({});
  });

  it('returns an empty object when JSON parses to a non-object', () => {
    expect(parseSettingsJson('5')).toEqual({});
  });

  it('passes through an object', () => {
    expect(parseSettingsJson({ a: 1 })).toEqual({ a: 1 });
  });
});

describe('serializeSettingsJson', () => {
  it('passes through a string', () => {
    expect(serializeSettingsJson('{"a":1}')).toBe('{"a":1}');
  });

  it('stringifies an object', () => {
    expect(serializeSettingsJson({ a: 1 })).toBe('{"a":1}');
  });

  it('serializes nullish to an empty object', () => {
    expect(serializeSettingsJson(null)).toBe('{}');
  });
});

describe('stringifyManifest', () => {
  it('returns null for a missing manifest', () => {
    expect(stringifyManifest(null)).toBeNull();
  });

  it('pretty-prints the manifest', () => {
    expect(stringifyManifest({ settingsDefaults: { a: 1 } })).toBe(
      '{\n  "settingsDefaults": {\n    "a": 1\n  }\n}'
    );
  });
});

describe('isBotPlugin', () => {
  it('detects a bot tag case-insensitively', () => {
    expect(isBotPlugin(['AI', 'Bot'])).toBe(true);
  });

  it('returns false without a bot tag', () => {
    expect(isBotPlugin(['ai', 'tool'])).toBe(false);
  });

  it('returns false for a non-array', () => {
    expect(isBotPlugin(undefined)).toBe(false);
  });
});

describe('normalizeBotProfiles', () => {
  it('maps id, label, and prompt with defaults', () => {
    expect(normalizeBotProfiles([{ id: '1', prompt: 'hi' }])).toEqual([
      { id: '1', label: '', prompt: 'hi' },
    ]);
  });

  it('falls back to displayName for the label when enabled', () => {
    expect(
      normalizeBotProfiles([{ displayName: 'Bot' }], { displayNameFallback: true })
    ).toEqual([{ id: '', label: 'Bot', prompt: '' }]);
  });

  it('ignores displayName when the fallback is off', () => {
    expect(normalizeBotProfiles([{ displayName: 'Bot' }])).toEqual([
      { id: '', label: '', prompt: '' },
    ]);
  });

  it('returns an empty array for a non-array', () => {
    expect(normalizeBotProfiles('nope')).toEqual([]);
  });
});

describe('parseBotProfiles', () => {
  it('parses a JSON string of profiles', () => {
    expect(parseBotProfiles('[{"id":"1","label":"A"}]')).toEqual([
      { id: '1', label: 'A', prompt: '' },
    ]);
  });

  it('accepts an already-parsed array', () => {
    expect(parseBotProfiles([{ id: '2' }])).toEqual([{ id: '2', label: '', prompt: '' }]);
  });

  it('returns an empty array for invalid JSON', () => {
    expect(parseBotProfiles('[bad')).toEqual([]);
  });

  it('returns an empty array for nullish', () => {
    expect(parseBotProfiles(null)).toEqual([]);
  });
});

describe('resolveServerBotName', () => {
  it('prefers the user-set bot name', () => {
    expect(
      resolveServerBotName({ settingsJson: { botName: 'Custom' }, manifest: {} })
    ).toBe('Custom');
  });

  it('falls back to the manifest default', () => {
    expect(
      resolveServerBotName({
        settingsJson: {},
        manifest: { settingsDefaults: { server: { botName: 'Default' } } },
      })
    ).toBe('Default');
  });

  it('returns an empty string when neither is set', () => {
    expect(resolveServerBotName({ settingsJson: {}, manifest: {} })).toBe('');
  });
});

describe('resolveServerProfiles', () => {
  it('reads profilesJson from settings', () => {
    expect(
      resolveServerProfiles({
        settingsJson: { profilesJson: '[{"id":"1","displayName":"A"}]' },
        manifest: {},
      })
    ).toEqual([{ id: '1', label: 'A', prompt: '' }]);
  });

  it('falls back to a settings profiles array', () => {
    expect(
      resolveServerProfiles({
        settingsJson: { profiles: [{ id: '2', label: 'B' }] },
        manifest: {},
      })
    ).toEqual([{ id: '2', label: 'B', prompt: '' }]);
  });

  it('falls back to manifest server defaults', () => {
    expect(
      resolveServerProfiles({
        settingsJson: {},
        manifest: { settingsDefaults: { server: { profiles: [{ id: '3' }] } } },
      })
    ).toEqual([{ id: '3', label: '', prompt: '' }]);
  });

  it('returns an empty array when no profiles exist', () => {
    expect(resolveServerProfiles({ settingsJson: {}, manifest: {} })).toEqual([]);
  });
});

describe('filterChannelSectionsForBot', () => {
  it('passes sections through unchanged for non-bot plugins', () => {
    const sections = [section('profilesJson')];
    expect(filterChannelSectionsForBot(sections, false)).toBe(sections);
  });

  it('removes the profilesJson field for bot plugins', () => {
    const sections: PluginFormSection[] = [
      { title: 'S', fields: [{ key: 'profilesJson', type: 'text', label: 'p' }, { key: 'other', type: 'text', label: 'o' }] },
    ];
    expect(filterChannelSectionsForBot(sections, true)[0]!.fields.map((f) => f.key)).toEqual(['other']);
  });

  it('drops sections that become empty after filtering', () => {
    const sections: PluginFormSection[] = [
      { title: 'S', fields: [{ key: 'profilesJson', type: 'text', label: 'p' }] },
    ];
    expect(filterChannelSectionsForBot(sections, true)).toEqual([]);
  });
});

describe('buildEnabledPluginsInput', () => {
  const base = { pluginId: 'p1', version: '1.0.0', settingsJson: '{}' };

  it('builds an update entry when enabling an existing edge', () => {
    const [entry] = buildEnabledPluginsInput({ ...base, enabled: true, hasEdge: true }) as Record<string, unknown>[];
    expect(entry).toHaveProperty('update');
  });

  it('builds a connect entry when enabling without an edge', () => {
    const [entry] = buildEnabledPluginsInput({ ...base, enabled: true, hasEdge: false }) as Record<string, unknown>[];
    expect(entry).toHaveProperty('connect');
  });

  it('builds a disconnect entry when disabling an existing edge', () => {
    const [entry] = buildEnabledPluginsInput({ ...base, enabled: false, hasEdge: true }) as Record<string, unknown>[];
    expect(entry).toHaveProperty('disconnect');
  });

  it('returns an empty array when disabling without an edge', () => {
    expect(buildEnabledPluginsInput({ ...base, enabled: false, hasEdge: false })).toEqual([]);
  });
});
