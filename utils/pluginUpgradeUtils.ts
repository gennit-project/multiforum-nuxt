import type { PluginField, PluginFormSection } from '@/types/pluginForms';

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

interface UpgradeManifest {
  settingsDefaults?: Record<string, unknown>;
  ui?: { forms?: { server?: PluginFormSection[] } };
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const isCompatibleValue = (field: PluginField, value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (field.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) return false;
  if ((field.type === 'boolean' || field.type === 'toggle') && typeof value !== 'boolean') return false;
  if ((field.type === 'text' || field.type === 'textarea') && typeof value !== 'string') return false;
  if (field.type === 'select' && !field.options?.some((option) => Object.is(option.value, value))) return false;

  const validation = field.validation || {};
  if (typeof value === 'number') {
    if (typeof validation.min === 'number' && value < validation.min) return false;
    if (typeof validation.max === 'number' && value > validation.max) return false;
  }
  if (typeof value === 'string') {
    if (typeof validation.minLength === 'number' && value.length < validation.minLength) return false;
    if (typeof validation.maxLength === 'number' && value.length > validation.maxLength) return false;
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
  newManifest?: UpgradeManifest | null;
}): PluginUpgradePreview {
  const { oldSettings, newManifest } = params;
  const defaults = asRecord(newManifest?.settingsDefaults?.server);
  const fields = (newManifest?.ui?.forms?.server || [])
    .flatMap((section) => section.fields)
    .filter((field) => field.type !== 'secret');
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

  return { settings, report };
}
