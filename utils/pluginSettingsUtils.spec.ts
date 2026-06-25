import { describe, it, expect } from 'vitest';
import type { PluginFormSection } from '@/types/pluginForms';
import {
  extractSecretKeys,
  filterOutSecrets,
  getSecretsToSave,
} from './pluginSettingsUtils';

const sections = [
  {
    title: 'S',
    fields: [
      { key: 'apiKey', type: 'secret' },
      { key: 'name', type: 'text' },
    ],
  },
] as unknown as PluginFormSection[];

describe('extractSecretKeys', () => {
  it('collects the keys of secret fields', () => {
    expect([...extractSecretKeys(sections)]).toEqual(['apiKey']);
  });
});

describe('filterOutSecrets', () => {
  it('drops secret keys from the settings object', () => {
    expect(
      filterOutSecrets({ apiKey: 'x', name: 'bot' }, new Set(['apiKey']))
    ).toEqual({ name: 'bot' });
  });
});

describe('getSecretsToSave', () => {
  it('returns non-empty string secrets as key/value pairs', () => {
    expect(
      getSecretsToSave({ apiKey: 'secret', name: 'bot' }, new Set(['apiKey']))
    ).toEqual([{ key: 'apiKey', value: 'secret' }]);
  });

  it('skips blank secret values', () => {
    expect(
      getSecretsToSave({ apiKey: '   ' }, new Set(['apiKey']))
    ).toEqual([]);
  });
});
