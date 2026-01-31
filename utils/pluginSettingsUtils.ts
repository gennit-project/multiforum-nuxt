import type { PluginFormSection } from '@/types/pluginForms';

/**
 * Extracts the keys of all secret fields from plugin form sections.
 * Secret fields have type === 'secret' and should be saved via setServerPluginSecret
 * instead of being included in the regular settingsJson.
 */
export function extractSecretKeys(sections: PluginFormSection[]): Set<string> {
  const secretKeys = new Set<string>();
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.type === 'secret') {
        secretKeys.add(field.key);
      }
    }
  }
  return secretKeys;
}

/**
 * Filters out secret keys from a settings object.
 * Returns a new object containing only non-secret settings.
 */
export function filterOutSecrets(
  settingsValues: Record<string, any>,
  secretKeys: Set<string>
): Record<string, any> {
  const nonSecretSettings: Record<string, any> = {};
  for (const [key, value] of Object.entries(settingsValues)) {
    if (!secretKeys.has(key)) {
      nonSecretSettings[key] = value;
    }
  }
  return nonSecretSettings;
}

/**
 * Gets secret values that should be saved (non-empty string values).
 * Returns an array of { key, value } pairs for secrets that need to be saved.
 */
export function getSecretsToSave(
  settingsValues: Record<string, any>,
  secretKeys: Set<string>
): Array<{ key: string; value: string }> {
  const secretsToSave: Array<{ key: string; value: string }> = [];
  for (const key of secretKeys) {
    const value = settingsValues[key];
    if (value && typeof value === 'string' && value.trim()) {
      secretsToSave.push({ key, value });
    }
  }
  return secretsToSave;
}
