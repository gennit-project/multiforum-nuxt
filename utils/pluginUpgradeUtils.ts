import {
  getPluginFormSections,
  getSettingsDefaults,
  parseSettingsJson,
} from './pluginManifestUtils';
import type { PluginField } from '@/types/pluginForms';

export interface PluginUpgradeReport {
  carried: string[];
  dropped: string[];
  reset: string[];
  newDefaults: string[];
}

export interface PluginUpgradePreview {
  settings: Record<string, unknown>;
  report: PluginUpgradeReport;
}

const isCompatibleValue = (field: PluginField, value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (
    field.type === 'number' &&
    (typeof value !== 'number' || !Number.isFinite(value))
  )
    return false;
  if (
    (field.type === 'boolean' || field.type === 'toggle') &&
    typeof value !== 'boolean'
  )
    return false;
  if (
    (field.type === 'text' || field.type === 'textarea') &&
    typeof value !== 'string'
  )
    return false;
  if (
    field.type === 'select' &&
    !field.options?.some((option) => Object.is(option.value, value))
  )
    return false;
  if (
    field.type === 'forum-multiselect' &&
    (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))
  )
    return false;

  const validation = field.validation || {};
  if (typeof value === 'number') {
    if (typeof validation.min === 'number' && value < validation.min)
      return false;
    if (typeof validation.max === 'number' && value > validation.max)
      return false;
  }
  if (typeof value === 'string') {
    if (
      typeof validation.minLength === 'number' &&
      value.length < validation.minLength
    )
      return false;
    if (
      typeof validation.maxLength === 'number' &&
      value.length > validation.maxLength
    )
      return false;
    if (validation.pattern) {
      try {
        if (!new RegExp(validation.pattern).test(value)) return false;
      } catch {
        return false;
      }
    }
  }
  return true;
};

export function buildPluginUpgradePreview(params: {
  oldSettings: Record<string, unknown>;
  newManifest?: unknown;
}): PluginUpgradePreview {
  const { newManifest } = params;
  const oldSettings = { ...params.oldSettings };
  const defaults = getSettingsDefaults(newManifest, 'server');
  const fields = getPluginFormSections(newManifest, 'server')
    .flatMap((section) => section.fields)
    .filter((field) => field.type !== 'secret');
  // The backend normalizes only governance keys from the legacy nested scope.
  // Do not mutate the installed settings or lift unrelated nested settings.
  if (fields.some((field) => field.key === 'serverRuleEnforcement')) {
    const nested = parseSettingsJson(oldSettings.server);
    for (const key of [
      'serverRuleCheckMode',
      'serverRuleForumAllowlist',
      'serverRuleEnforcement',
      'channelRuleEligibility',
      'channelRuleAllowlist',
    ]) {
      if (
        !Object.prototype.hasOwnProperty.call(oldSettings, key) &&
        Object.prototype.hasOwnProperty.call(nested, key)
      ) {
        oldSettings[key] = nested[key];
      }
    }
  }
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const settings = { ...defaults };
  const report: PluginUpgradeReport = {
    carried: [],
    dropped: [],
    reset: [],
    newDefaults: Object.keys(defaults).filter(
      (key) => !Object.prototype.hasOwnProperty.call(oldSettings, key)
    ),
  };

  for (const [key, value] of Object.entries(oldSettings)) {
    const field = fieldsByKey.get(key);
    const hasDefault = Object.prototype.hasOwnProperty.call(defaults, key);
    if (!field && !hasDefault) {
      report.dropped.push(key);
    } else if (
      field
        ? !isCompatibleValue(field, value)
        : defaults[key] !== null &&
          (Array.isArray(defaults[key])
            ? !Array.isArray(value)
            : typeof defaults[key] !== typeof value)
    ) {
      report.reset.push(key);
    } else {
      settings[key] = value;
      report.carried.push(key);
    }
  }

  // Keep upgrade review aligned with backend reconcileSettings: an upgrade
  // alone must not turn a legacy server-rule trial into global enforcement.
  if (
    fields.some((field) => field.key === 'serverRuleEnforcement') &&
    Object.prototype.hasOwnProperty.call(oldSettings, 'serverRuleCheckMode') &&
    !Object.prototype.hasOwnProperty.call(oldSettings, 'serverRuleEnforcement')
  ) {
    delete settings.serverRuleEnforcement;
    report.newDefaults = report.newDefaults.filter(
      (key) => key !== 'serverRuleEnforcement'
    );
    for (const key of ['serverRuleCheckMode', 'serverRuleForumAllowlist']) {
      if (!Object.prototype.hasOwnProperty.call(oldSettings, key)) continue;
      settings[key] = oldSettings[key];
      report.dropped = report.dropped.filter((dropped) => dropped !== key);
      if (!report.carried.includes(key)) report.carried.push(key);
    }
  }

  return { settings, report };
}
