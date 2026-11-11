import { compareVersionStrings } from './versionUtils';
import type { PluginFormSection, PluginSettings } from '@/types/pluginForms';
import {
  getPluginFormSections,
  parseSettingsJson,
} from './pluginManifestUtils';

/** Governance is a backend capability, not an inference from a plugin's tags. */
export const hasRuleGovernance = (pluginId: string) =>
  pluginId === 'llm-moderation';

export const supportsRuleGovernance = (version: string | null | undefined) =>
  !!version &&
  /^v?\d+\.\d+\.\d+(?:[-+].*)?$/.test(version) &&
  compareVersionStrings(version, '0.8.0') >= 0;

const governanceKeys = new Set([
  'serverRuleEnforcement',
  'channelRuleEligibility',
  'channelRuleAllowlist',
  'serverRuleCheckMode',
  'serverRuleForumAllowlist',
]);

// Match backend policy precedence: a flat property (including null) overrides
// the legacy nested server setting. Preserve the original settings on save.
const effectiveGovernanceSettings = (settings: unknown) => {
  const values = parseSettingsJson(settings);
  return { ...parseSettingsJson(values.server), ...values };
};
const hasOwn = (values: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(values, key);

export function requiresGovernanceMigration(settings: unknown): boolean {
  const values = effectiveGovernanceSettings(settings);
  return (
    !hasOwn(values, 'serverRuleEnforcement') &&
    values.serverRuleCheckMode === 'allowlist'
  );
}

/** Never reinterpret a legacy server-rule allowlist as channel eligibility. */
export function initializeGovernanceSettings(
  settings: unknown
): PluginSettings {
  const values = effectiveGovernanceSettings(settings);
  return {
    ...parseSettingsJson(settings),
    serverRuleEnforcement: hasOwn(values, 'serverRuleEnforcement')
      ? (values.serverRuleEnforcement ?? '')
      : values.serverRuleCheckMode === 'allowlist'
        ? ''
        : values.serverRuleCheckMode === 'all_forums'
          ? 'on'
          : 'off',
    channelRuleEligibility: hasOwn(values, 'channelRuleEligibility')
      ? (values.channelRuleEligibility ?? '')
      : 'all',
    channelRuleAllowlist: values.channelRuleAllowlist ?? [],
  };
}

export function getGovernanceServerSections(
  manifest: unknown
): PluginFormSection[] {
  const otherSections = getPluginFormSections(manifest, 'server')
    .map((section) => ({
      ...section,
      fields: section.fields.filter((field) => !governanceKeys.has(field.key)),
    }))
    .filter((section) => section.fields.length > 0);
  return [
    {
      title: 'Rule enforcement',
      description:
        'Server rules apply globally. Forum owners separately choose whether to enforce their own forum rules.',
      fields: [
        {
          key: 'serverRuleEnforcement',
          type: 'select',
          label: 'Server-rule enforcement',
          description:
            'On checks every forum against server rules. Forum owners cannot opt in or out. The plugin must also be enabled on this server.',
          required: true,
          placeholder: 'Choose global enforcement',
          options: [
            { value: 'off', label: 'Off' },
            { value: 'on', label: 'On, for every forum' },
          ],
        },
        {
          key: 'channelRuleEligibility',
          type: 'select',
          label: 'Channel-rule eligibility',
          required: true,
          options: [
            { value: 'all', label: 'All channels' },
            { value: 'none', label: 'No channels' },
            { value: 'allowlist', label: 'Allowlisted channels' },
          ],
        },
        {
          key: 'channelRuleAllowlist',
          type: 'forum-multiselect',
          label: 'Eligible channels',
          description:
            'Listed forum owners may enable their own rules. An empty list allows no forums. Approval does not enable enforcement for the owner.',
          visibleWhen: { key: 'channelRuleEligibility', equals: 'allowlist' },
        },
      ],
    },
    ...otherSections,
  ];
}

/** Match the backend's active moderation version, regardless of query ordering. */
export function selectGovernanceInstallation<
  T extends { enabled: boolean; version: string },
>(plugins: T[]): T | undefined {
  return [...plugins].sort(
    (a, b) =>
      Number(b.enabled) - Number(a.enabled) ||
      compareVersionStrings(b.version, a.version)
  )[0];
}

/** Admins must be able to configure a newly installed, still-disabled upgrade. */
export function selectGovernanceAdminInstallation<
  T extends { version: string },
>({
  plugins,
  selectedVersion,
}: {
  plugins: T[];
  selectedVersion: string;
}): T | undefined {
  return (
    plugins.find((plugin) => plugin.version === selectedVersion) ||
    [...plugins].sort((a, b) => compareVersionStrings(b.version, a.version))[0]
  );
}
