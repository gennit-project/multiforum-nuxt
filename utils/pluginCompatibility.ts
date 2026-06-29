import { compareVersionStrings } from '@/utils/versionUtils';

export const CURRENT_SERVER_VERSION = '1.0.0';
export const SUPPORTED_PLUGIN_API_VERSION = '1';

export type PluginVersionCompatibilityInput = {
  minServerVersion?: string | null;
  apiVersion?: string | null;
};

export type PluginVersionCompatibility =
  | { compatible: true; reason?: undefined }
  | { compatible: false; reason: string };

export function getPluginVersionCompatibility(
  version: PluginVersionCompatibilityInput
): PluginVersionCompatibility {
  if (
    version.minServerVersion &&
    compareVersionStrings(CURRENT_SERVER_VERSION, version.minServerVersion) < 0
  ) {
    return {
      compatible: false,
      reason: `Requires server >= ${version.minServerVersion}`,
    };
  }

  if (
    version.apiVersion &&
    version.apiVersion !== SUPPORTED_PLUGIN_API_VERSION
  ) {
    return {
      compatible: false,
      reason: `Requires plugin API ${version.apiVersion}`,
    };
  }

  return { compatible: true };
}
