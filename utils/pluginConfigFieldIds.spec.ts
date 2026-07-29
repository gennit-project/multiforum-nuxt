import { describe, expect, it } from 'vitest';
import { getPluginConfigFieldId } from './pluginConfigFieldIds';

describe('getPluginConfigFieldId', () => {
  it('creates distinct IDs for setting and secret keys', () => {
    expect([
      getPluginConfigFieldId({ kind: 'SETTING', key: 'apiKey' }),
      getPluginConfigFieldId({ kind: 'SECRET', key: 'apiKey' }),
    ]).toEqual([
      'plugin-config-setting-61-70-69-4b-65-79',
      'plugin-config-secret-61-70-69-4b-65-79',
    ]);
  });

  it('encodes unusual keys into DOM-safe IDs without collisions', () => {
    expect([
      getPluginConfigFieldId({ kind: 'SETTING', key: 'api/key' }),
      getPluginConfigFieldId({ kind: 'SETTING', key: 'api key' }),
      getPluginConfigFieldId({ kind: 'SETTING', key: '🔑' }),
    ]).toEqual([
      'plugin-config-setting-61-70-69-2f-6b-65-79',
      'plugin-config-setting-61-70-69-20-6b-65-79',
      'plugin-config-setting-1f511',
    ]);
  });

  it('suffixes duplicate occurrences while preserving the canonical first ID', () => {
    expect([
      getPluginConfigFieldId({ kind: 'SECRET', key: 'token' }),
      getPluginConfigFieldId({
        kind: 'SECRET',
        key: 'token',
        occurrence: 1,
      }),
    ]).toEqual([
      'plugin-config-secret-74-6f-6b-65-6e',
      'plugin-config-secret-74-6f-6b-65-6e--2',
    ]);
  });
});
