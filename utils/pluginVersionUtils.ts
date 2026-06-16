import { compareVersionStrings } from '@/utils/versionUtils';
import type { PluginFormSection } from '@/types/pluginForms';

/**
 * Pure helpers for the server-scoped plugin detail page
 * (pages/admin/settings/plugins/[pluginId].vue). Extracted from the component
 * so the version/metadata/validation/error logic can be unit-tested directly.
 */

export interface PluginVersionLike {
  version: string;
  repoUrl?: string;
  readmeMarkdown?: string;
}

export interface PluginSecretLike {
  status: 'NOT_SET' | 'SET_UNTESTED' | 'VALID' | 'INVALID';
}

interface PluginMetaSource {
  displayName?: string;
  name?: string;
  description?: string;
  authorName?: string;
  authorUrl?: string;
  homepage?: string;
  license?: string;
  tags?: string[];
}

export interface ResolvedPluginMetadata {
  displayName: string;
  description?: string;
  authorName?: string;
  authorUrl?: string;
  homepage?: string;
  license?: string;
  tags: string[];
}

/**
 * Resolve plugin metadata, preferring the installed plugin's values and
 * falling back to the registry plugin, then the route id for display name.
 */
export function resolvePluginMetadata(params: {
  installed?: PluginMetaSource | null;
  registry?: PluginMetaSource | null;
  pluginId: string;
}): ResolvedPluginMetadata {
  const { installed, registry, pluginId } = params;
  return {
    displayName:
      installed?.displayName ||
      registry?.displayName ||
      registry?.name ||
      pluginId,
    description: installed?.description || registry?.description,
    authorName: installed?.authorName || registry?.authorName,
    authorUrl: installed?.authorUrl || registry?.authorUrl,
    homepage: installed?.homepage || registry?.homepage,
    license: installed?.license || registry?.license,
    tags: installed?.tags || registry?.tags || [],
  };
}

/**
 * Resolve the README to display: the installed plugin's README, else the
 * selected version's README, else the first version that has one, else null.
 */
export function resolvePluginReadme(params: {
  installedReadme?: string | null;
  selectedVersion?: string;
  detailVersions: PluginVersionLike[];
}): string | null {
  const { installedReadme, selectedVersion, detailVersions } = params;
  if (installedReadme) {
    return installedReadme;
  }
  if (selectedVersion && detailVersions.length > 0) {
    const versionDetail = detailVersions.find(
      (v) => v.version === selectedVersion
    );
    if (versionDetail?.readmeMarkdown) {
      return versionDetail.readmeMarkdown;
    }
  }
  for (const v of detailVersions) {
    if (v.readmeMarkdown) {
      return v.readmeMarkdown;
    }
  }
  return null;
}

/** A plugin can be enabled only when installed and all secrets are usable. */
export function canEnablePlugin(params: {
  isInstalled: boolean;
  secrets: PluginSecretLike[];
}): boolean {
  const { isInstalled, secrets } = params;
  if (!isInstalled) return false;
  return secrets.every(
    (s) => s.status === 'VALID' || s.status === 'SET_UNTESTED'
  );
}

/** Sort versions newest-first using semantic version comparison. */
export function sortVersionsDescending<T extends { version: string }>(
  versions: T[]
): T[] {
  return [...versions].sort((a, b) =>
    compareVersionStrings(b.version, a.version)
  );
}

/** Whether any available version differs from the installed one. */
export function hasNewerVersions(
  installedVersion: string | undefined,
  availableVersions: { version: string }[]
): boolean {
  if (!installedVersion) return true;
  return availableVersions.some((v) => v.version !== installedVersion);
}

/**
 * Map a raw install error message to a user-facing explanation. Falls back to a
 * generic message that includes the original text.
 */
export function mapInstallErrorMessage(errorMessage: string): string {
  if (
    errorMessage.includes('PLUGIN_VERSION_NOT_FOUND') ||
    errorMessage.includes('not found in registry')
  ) {
    return 'Plugin version not found in registry. Please check that this version exists in the configured plugin registry.';
  }
  if (
    errorMessage.includes('INTEGRITY_MISMATCH') ||
    errorMessage.includes('SHA-256 mismatch') ||
    errorMessage.includes('integrity verification failed')
  ) {
    return 'Plugin tarball integrity check failed. The SHA-256 hash of the downloaded tarball does not match the hash in the registry. The registry may need to be updated with the correct hash.';
  }
  if (errorMessage.includes('Failed to fetch plugin registry')) {
    return 'Could not connect to the plugin registry. Please check that the registry URL is correct and accessible.';
  }
  if (errorMessage.includes('Failed to download tarball')) {
    return 'Could not download the plugin tarball. Please check that the tarball URL in the registry is correct and accessible.';
  }
  return `Installation failed: ${errorMessage || 'Unknown error'}`;
}

/**
 * Validate required settings fields, returning a map of field key to error
 * message for any required field that is empty.
 */
export function validateRequiredSettings(
  sections: PluginFormSection[],
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.validation?.required) {
        const value = values[field.key];
        if (value === undefined || value === null || value === '') {
          errors[field.key] = `${field.label} is required`;
        }
      }
    }
  }
  return errors;
}
