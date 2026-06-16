import type { PluginFormSection } from '@/types/pluginForms';

/**
 * Pure helpers shared by the server- and channel-scoped plugin configuration
 * pages. These were previously inlined in
 * pages/admin/settings/plugins/[pluginId].vue and
 * pages/forums/[forumId]/edit/plugins/[pluginId].vue; extracting them keeps the
 * behavior identical while making the logic unit-testable.
 */

/** Loose manifest shape — the GraphQL type is `JSON`, so fields are optional. */
export interface PluginManifestLike {
  ui?: {
    forms?: {
      server?: PluginFormSection[];
      channel?: PluginFormSection[];
    };
  };
  settingsDefaults?: Record<string, unknown>;
}

export type PluginFormScope = 'server' | 'channel';

export interface PluginBotProfile {
  id: string;
  label: string;
  prompt: string;
}

/** Return the form sections for a given scope, or `[]` when absent. */
export function getPluginFormSections(
  manifest: PluginManifestLike | null | undefined,
  scope: PluginFormScope
): PluginFormSection[] {
  const sections = manifest?.ui?.forms?.[scope];
  return Array.isArray(sections) ? sections : [];
}

/** Return a shallow copy of the scope's settings defaults, or `{}`. */
export function getSettingsDefaults(
  manifest: PluginManifestLike | null | undefined,
  scope: PluginFormScope
): Record<string, unknown> {
  const defaults = manifest?.settingsDefaults?.[scope];
  if (!defaults || typeof defaults !== 'object') {
    return {};
  }
  return { ...(defaults as Record<string, unknown>) };
}

/** Coerce a settingsJson value (string | object | nullish) into an object. */
export function parseSettingsJson(settingsJson: unknown): Record<string, unknown> {
  if (!settingsJson) {
    return {};
  }
  if (typeof settingsJson === 'string') {
    try {
      const parsed = JSON.parse(settingsJson);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof settingsJson === 'object') {
    return settingsJson as Record<string, unknown>;
  }
  return {};
}

/** Serialize settings to a JSON string, passing through existing strings. */
export function serializeSettingsJson(settings: unknown): string {
  if (typeof settings === 'string') {
    return settings;
  }
  return JSON.stringify(settings ?? {});
}

/** Pretty-print a manifest for display, or `null` when there is none. */
export function stringifyManifest(
  manifest: PluginManifestLike | null | undefined
): string | null {
  if (!manifest) return null;
  return JSON.stringify(manifest, null, 2);
}

const BOT_TAGS = ['bot', 'bots'];

/** Whether a plugin's tag list marks it as a bot plugin. */
export function isBotPlugin(tags: string[] | null | undefined): boolean {
  if (!Array.isArray(tags)) return false;
  return tags.some((tag) => BOT_TAGS.includes(String(tag).toLowerCase()));
}

/** Normalize raw profile objects into `{ id, label, prompt }` shape. */
export function normalizeBotProfiles(
  rawProfiles: unknown,
  opts: { displayNameFallback?: boolean } = {}
): PluginBotProfile[] {
  if (!Array.isArray(rawProfiles)) return [];
  return rawProfiles.map((p) => {
    const profile = (p ?? {}) as Record<string, unknown>;
    const label =
      (profile.label as string) ||
      (opts.displayNameFallback ? (profile.displayName as string) : '') ||
      '';
    return {
      id: (profile.id as string) || '',
      label,
      prompt: (profile.prompt as string) || '',
    };
  });
}

/** Parse channel-level profiles from a settings `profilesJson` value. */
export function parseBotProfiles(profilesJson: unknown): PluginBotProfile[] {
  if (!profilesJson) return [];
  try {
    const parsed =
      typeof profilesJson === 'string' ? JSON.parse(profilesJson) : profilesJson;
    return normalizeBotProfiles(parsed);
  } catch {
    return [];
  }
}

/**
 * Resolve the server-level bot name from user settings, falling back to the
 * manifest's server defaults.
 */
export function resolveServerBotName(params: {
  settingsJson?: unknown;
  manifest?: PluginManifestLike | null;
}): string {
  const { settingsJson, manifest } = params;
  if (settingsJson) {
    const settings = parseSettingsJson(settingsJson);
    if (settings?.botName) {
      return settings.botName as string;
    }
  }
  const serverDefaults = manifest?.settingsDefaults?.server as
    | Record<string, unknown>
    | undefined;
  const defaultBotName = serverDefaults?.botName;
  return typeof defaultBotName === 'string' ? defaultBotName : '';
}

/**
 * Resolve server-level bot profiles, checking user settings (`profilesJson`
 * then `profiles`) before falling back to the manifest server defaults.
 */
export function resolveServerProfiles(params: {
  settingsJson?: unknown;
  manifest?: PluginManifestLike | null;
}): PluginBotProfile[] {
  const { settingsJson, manifest } = params;
  if (settingsJson) {
    const settings = parseSettingsJson(settingsJson);
    if (settings?.profilesJson) {
      try {
        const parsed =
          typeof settings.profilesJson === 'string'
            ? JSON.parse(settings.profilesJson as string)
            : settings.profilesJson;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeBotProfiles(parsed, { displayNameFallback: true });
        }
      } catch {
        // Fall through to other sources
      }
    }
    if (Array.isArray(settings?.profiles) && settings.profiles.length > 0) {
      return normalizeBotProfiles(settings.profiles, {
        displayNameFallback: true,
      });
    }
  }
  const serverDefaults = manifest?.settingsDefaults?.server as
    | Record<string, unknown>
    | undefined;
  const profiles = serverDefaults?.profiles;
  if (Array.isArray(profiles) && profiles.length > 0) {
    return normalizeBotProfiles(profiles, { displayNameFallback: true });
  }
  return [];
}

/**
 * For bot plugins, drop the `profilesJson` field (handled by a custom editor)
 * and any sections left empty. Non-bot plugins pass through unchanged.
 */
export function filterChannelSectionsForBot(
  sections: PluginFormSection[],
  isBot: boolean
): PluginFormSection[] {
  if (!isBot) return sections;
  return sections
    .map((section) => ({
      ...section,
      fields: section.fields.filter((field) => field.key !== 'profilesJson'),
    }))
    .filter((section) => section.fields.length > 0);
}

export interface EnabledPluginsInputParams {
  enabled: boolean;
  /** Whether an existing enabled-plugin edge is present. */
  hasEdge: boolean;
  pluginId: string;
  version: string;
  settingsJson: string;
}

/**
 * Build the `enabledPlugins` mutation input for connecting, updating, or
 * disconnecting a plugin on a channel. Returns `[]` when there is nothing to
 * do (disabling a plugin that has no edge).
 */
export function buildEnabledPluginsInput(
  params: EnabledPluginsInputParams
): unknown[] {
  const { enabled, hasEdge, pluginId, version, settingsJson } = params;
  const node = { Plugin: { id: pluginId }, version };

  if (enabled) {
    if (hasEdge) {
      return [{ where: { node }, update: { edge: { settingsJson } } }];
    }
    return [{ connect: [{ where: { node }, edge: { enabled: true, settingsJson } }] }];
  }
  if (hasEdge) {
    return [{ disconnect: [{ where: { node } }] }];
  }
  return [];
}
