import { describe, it, expect } from 'vitest';
import {
  extractSecretKeys,
  filterOutSecrets,
  getSecretsToSave,
} from '@/utils/pluginSettingsUtils';
import type { PluginFormSection } from '@/types/pluginForms';

describe('pluginSettingsUtils', () => {
  describe('extractSecretKeys', () => {
    it('identifies secret fields from a single section', () => {
      const sections: PluginFormSection[] = [
        {
          title: 'API Settings',
          fields: [
            { key: 'OPENAI_API_KEY', type: 'secret', label: 'OpenAI API Key' },
            { key: 'model', type: 'select', label: 'Model' },
          ],
        },
      ];

      const secretKeys = extractSecretKeys(sections);

      expect(secretKeys.has('OPENAI_API_KEY')).toBe(true);
    });

    it('does not include non-secret fields', () => {
      const sections: PluginFormSection[] = [
        {
          title: 'API Settings',
          fields: [
            { key: 'OPENAI_API_KEY', type: 'secret', label: 'OpenAI API Key' },
            { key: 'model', type: 'select', label: 'Model' },
          ],
        },
      ];

      const secretKeys = extractSecretKeys(sections);

      expect(secretKeys.has('model')).toBe(false);
    });

    it('handles multiple secret fields across multiple sections', () => {
      const sections: PluginFormSection[] = [
        {
          title: 'API Settings',
          fields: [{ key: 'API_KEY', type: 'secret', label: 'API Key' }],
        },
        {
          title: 'Auth Settings',
          fields: [{ key: 'AUTH_TOKEN', type: 'secret', label: 'Auth Token' }],
        },
      ];

      const secretKeys = extractSecretKeys(sections);

      expect(secretKeys.size).toBe(2);
    });

    it('returns empty set when no secret fields exist', () => {
      const sections: PluginFormSection[] = [
        {
          title: 'General Settings',
          fields: [
            { key: 'name', type: 'text', label: 'Name' },
            { key: 'enabled', type: 'boolean', label: 'Enabled' },
          ],
        },
      ];

      const secretKeys = extractSecretKeys(sections);

      expect(secretKeys.size).toBe(0);
    });

    it('returns empty set when sections array is empty', () => {
      const sections: PluginFormSection[] = [];

      const secretKeys = extractSecretKeys(sections);

      expect(secretKeys.size).toBe(0);
    });

    it('handles sections with empty fields array', () => {
      const sections: PluginFormSection[] = [
        {
          title: 'Empty Section',
          fields: [],
        },
      ];

      const secretKeys = extractSecretKeys(sections);

      expect(secretKeys.size).toBe(0);
    });
  });

  describe('filterOutSecrets', () => {
    it('removes secret keys from settings object', () => {
      const settings = {
        OPENAI_API_KEY: 'sk-123',
        model: 'gpt-4',
        temperature: 0.7,
      };
      const secretKeys = new Set(['OPENAI_API_KEY']);

      const filtered = filterOutSecrets(settings, secretKeys);

      expect(filtered).toEqual({ model: 'gpt-4', temperature: 0.7 });
    });

    it('does not include secret keys in result', () => {
      const settings = {
        OPENAI_API_KEY: 'sk-123',
        model: 'gpt-4',
      };
      const secretKeys = new Set(['OPENAI_API_KEY']);

      const filtered = filterOutSecrets(settings, secretKeys);

      expect('OPENAI_API_KEY' in filtered).toBe(false);
    });

    it('preserves all values when no secrets present', () => {
      const settings = { model: 'gpt-4', temperature: 0.7 };
      const secretKeys = new Set<string>();

      const filtered = filterOutSecrets(settings, secretKeys);

      expect(filtered).toEqual(settings);
    });

    it('handles multiple secret keys', () => {
      const settings = {
        API_KEY: 'key1',
        AUTH_TOKEN: 'token1',
        model: 'gpt-4',
        maxTokens: 1000,
      };
      const secretKeys = new Set(['API_KEY', 'AUTH_TOKEN']);

      const filtered = filterOutSecrets(settings, secretKeys);

      expect(filtered).toEqual({ model: 'gpt-4', maxTokens: 1000 });
    });

    it('returns empty object when all keys are secrets', () => {
      const settings = {
        API_KEY: 'key1',
        AUTH_TOKEN: 'token1',
      };
      const secretKeys = new Set(['API_KEY', 'AUTH_TOKEN']);

      const filtered = filterOutSecrets(settings, secretKeys);

      expect(filtered).toEqual({});
    });

    it('handles empty settings object', () => {
      const settings = {};
      const secretKeys = new Set(['SOME_KEY']);

      const filtered = filterOutSecrets(settings, secretKeys);

      expect(filtered).toEqual({});
    });

    it('does not modify the original settings object', () => {
      const settings = {
        OPENAI_API_KEY: 'sk-123',
        model: 'gpt-4',
      };
      const secretKeys = new Set(['OPENAI_API_KEY']);

      filterOutSecrets(settings, secretKeys);

      expect(settings.OPENAI_API_KEY).toBe('sk-123');
    });
  });

  describe('getSecretsToSave', () => {
    it('returns secrets with non-empty string values', () => {
      const settings = {
        OPENAI_API_KEY: 'sk-123',
        model: 'gpt-4',
      };
      const secretKeys = new Set(['OPENAI_API_KEY']);

      const secretsToSave = getSecretsToSave(settings, secretKeys);

      expect(secretsToSave).toEqual([{ key: 'OPENAI_API_KEY', value: 'sk-123' }]);
    });

    it('excludes empty string secrets', () => {
      const settings = {
        OPENAI_API_KEY: '',
        model: 'gpt-4',
      };
      const secretKeys = new Set(['OPENAI_API_KEY']);

      const secretsToSave = getSecretsToSave(settings, secretKeys);

      expect(secretsToSave).toEqual([]);
    });

    it('excludes whitespace-only secrets', () => {
      const settings = {
        OPENAI_API_KEY: '   ',
        model: 'gpt-4',
      };
      const secretKeys = new Set(['OPENAI_API_KEY']);

      const secretsToSave = getSecretsToSave(settings, secretKeys);

      expect(secretsToSave).toEqual([]);
    });

    it('excludes undefined secrets', () => {
      const settings = {
        model: 'gpt-4',
      };
      const secretKeys = new Set(['OPENAI_API_KEY']);

      const secretsToSave = getSecretsToSave(settings, secretKeys);

      expect(secretsToSave).toEqual([]);
    });

    it('excludes null secrets', () => {
      const settings = {
        OPENAI_API_KEY: null,
        model: 'gpt-4',
      };
      const secretKeys = new Set(['OPENAI_API_KEY']);

      const secretsToSave = getSecretsToSave(settings, secretKeys);

      expect(secretsToSave).toEqual([]);
    });

    it('excludes non-string secrets', () => {
      const settings = {
        OPENAI_API_KEY: 12345,
        model: 'gpt-4',
      };
      const secretKeys = new Set(['OPENAI_API_KEY']);

      const secretsToSave = getSecretsToSave(settings, secretKeys);

      expect(secretsToSave).toEqual([]);
    });

    it('handles multiple secrets with mixed values', () => {
      const settings = {
        API_KEY: 'valid-key',
        AUTH_TOKEN: '',
        SECRET_CODE: 'another-secret',
        EMPTY_SECRET: null,
      };
      const secretKeys = new Set(['API_KEY', 'AUTH_TOKEN', 'SECRET_CODE', 'EMPTY_SECRET']);

      const secretsToSave = getSecretsToSave(settings, secretKeys);

      expect(secretsToSave).toHaveLength(2);
    });

    it('includes secrets with leading/trailing spaces (but not whitespace-only)', () => {
      const settings = {
        OPENAI_API_KEY: '  sk-123  ',
      };
      const secretKeys = new Set(['OPENAI_API_KEY']);

      const secretsToSave = getSecretsToSave(settings, secretKeys);

      expect(secretsToSave).toEqual([{ key: 'OPENAI_API_KEY', value: '  sk-123  ' }]);
    });

    it('returns empty array when no secret keys defined', () => {
      const settings = {
        model: 'gpt-4',
      };
      const secretKeys = new Set<string>();

      const secretsToSave = getSecretsToSave(settings, secretKeys);

      expect(secretsToSave).toEqual([]);
    });
  });
});
