import type { PluginFormSection, PluginField, PluginConfigValue } from '@/types/pluginForms';
import type {
  ChannelEnabledPluginsUpdateFieldInput,
  PluginVersionWhere,
} from '@/__generated__/graphql';

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

export function isPluginRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const isConfigValue = (value: unknown): value is PluginConfigValue =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ||
  (Array.isArray(value) && value.every((item: unknown) => typeof item === 'string'));

function isPluginField(value: unknown): value is PluginField {
  if (!isPluginRecord(value) || typeof value.key !== 'string' || typeof value.label !== 'string') return false;
  if (!['text', 'number', 'boolean', 'toggle', 'select', 'secret', 'textarea', 'forum-multiselect'].includes(String(value.type))) return false;
  if (['description', 'placeholder'].some((key) => value[key] !== undefined && typeof value[key] !== 'string')) return false;
  if (value.required !== undefined && typeof value.required !== 'boolean') return false;
  if (value.default !== undefined && !isConfigValue(value.default)) return false;
  if (value.options !== undefined && (!Array.isArray(value.options) || !value.options.every((option: unknown) => isPluginRecord(option) && typeof option.label === 'string' && ['string', 'number', 'boolean'].includes(typeof option.value)))) return false;
  if (value.visibleWhen !== undefined && (!isPluginRecord(value.visibleWhen) || typeof value.visibleWhen.key !== 'string' || !['string', 'number', 'boolean'].includes(typeof value.visibleWhen.equals))) return false;
  if (value.validation !== undefined) {
    if (!isPluginRecord(value.validation)) return false;
    const validation = value.validation;
    if (['min', 'max', 'minLength', 'maxLength'].some((key) => validation[key] !== undefined && typeof validation[key] !== 'number')) return false;
    if (validation.pattern !== undefined && typeof validation.pattern !== 'string') return false;
    if (validation.required !== undefined && typeof validation.required !== 'boolean') return false;
  }
  return true;
}

export function getPluginSecretDeclarations(manifest: unknown): Array<{ key: string; scope?: string; required?: boolean }> {
  if (!isPluginRecord(manifest) || !Array.isArray(manifest.secrets)) return [];
  return manifest.secrets.flatMap((secret: unknown) => {
    if (!isPluginRecord(secret) || typeof secret.key !== 'string') return [];
    return [{ key: secret.key, scope: typeof secret.scope === 'string' ? secret.scope : undefined, required: typeof secret.required === 'boolean' ? secret.required : undefined }];
  });
}

/** Return the form sections for a given scope, or `[]` when absent. */
export function getPluginFormSections(
  manifest: unknown,
  scope: PluginFormScope
): PluginFormSection[] {
  if (!isPluginRecord(manifest) || !isPluginRecord(manifest.ui) || !isPluginRecord(manifest.ui.forms)) return [];
  const sections = manifest.ui.forms[scope];
  if (!Array.isArray(sections)) return [];
  const isSection = (section: unknown): section is PluginFormSection =>
    isPluginRecord(section) && typeof section.title === 'string' &&
    (section.description === undefined || typeof section.description === 'string') &&
    Array.isArray(section.fields) && section.fields.every(isPluginField);
  return sections.every(isSection) ? sections : sections.filter(isSection);
}

/** Return a shallow copy of the scope's settings defaults, or `{}`. */
export function getSettingsDefaults(
  manifest: unknown,
  scope: PluginFormScope
): Record<string, unknown> {
  const defaults = isPluginRecord(manifest) && isPluginRecord(manifest.settingsDefaults) ? manifest.settingsDefaults[scope] : undefined;
  if (!isPluginRecord(defaults)) {
    return {};
  }
  return { ...defaults };
}

/** Coerce a settingsJson value (string | object | nullish) into an object. */
export function parseSettingsJson(settingsJson: unknown): Record<string, unknown> {
  if (!settingsJson) {
    return {};
  }
  if (typeof settingsJson === 'string') {
    try {
      const parsed: unknown = JSON.parse(settingsJson);
      return isPluginRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  if (isPluginRecord(settingsJson)) {
    return settingsJson;
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
  manifest: unknown
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
    const profile = isPluginRecord(p) ? p : {};
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
  manifest?: unknown;
}): string {
  const { settingsJson, manifest } = params;
  if (settingsJson) {
    const settings = parseSettingsJson(settingsJson);
    if (typeof settings.botName === 'string' && settings.botName) {
      return settings.botName;
    }
  }
  const serverDefaults = getSettingsDefaults(manifest, 'server');
  const defaultBotName = serverDefaults?.botName;
  return typeof defaultBotName === 'string' ? defaultBotName : '';
}

/**
 * Resolve server-level bot profiles, checking user settings (`profilesJson`
 * then `profiles`) before falling back to the manifest server defaults.
 */
export function resolveServerProfiles(params: {
  settingsJson?: unknown;
  manifest?: unknown;
}): PluginBotProfile[] {
  const { settingsJson, manifest } = params;
  if (settingsJson) {
    const settings = parseSettingsJson(settingsJson);
    if (settings?.profilesJson) {
      try {
        const parsed =
          typeof settings.profilesJson === 'string'
            ? JSON.parse(settings.profilesJson)
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
  const serverDefaults = getSettingsDefaults(manifest, 'server');
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
 * do (disabling a plugin that has no edge). The return type is tied to the
 * generated `ChannelEnabledPluginsUpdateFieldInput`, so the schema validates
 * the produced shape at compile time.
 */
export function buildEnabledPluginsInput(
  params: EnabledPluginsInputParams
): ChannelEnabledPluginsUpdateFieldInput[] {
  const { enabled, hasEdge, pluginId, version, settingsJson } = params;
  const node: PluginVersionWhere = {
    Plugin: { id: { eq: pluginId } },
    version: { eq: version },
  };

  if (enabled) {
    if (hasEdge) {
      return [
        { update: { where: { node }, edge: { settingsJson: { set: settingsJson } } } },
      ];
    }
    return [
      { connect: [{ where: { node }, edge: { enabled: true, settingsJson } }] },
    ];
  }
  if (hasEdge) {
    return [{ disconnect: [{ where: { node } }] }];
  }
  return [];
}
