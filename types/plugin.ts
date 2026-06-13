// Types for backend plugin system

/**
 * Backend pipeline step configuration
 */
export interface BackendPipelineStep {
  pluginId?: string;
  plugin?: string;
  version?: string;
  condition?: string;
  continueOnError?: boolean;
}

/**
 * Backend pipeline configuration
 */
export interface BackendPipeline {
  event: string;
  stopOnFirstFailure?: boolean;
  steps: BackendPipelineStep[];
}

/**
 * Installed plugin from backend API
 */
export interface InstalledPlugin {
  plugin: {
    id: string;
    name: string;
    displayName?: string;
    description?: string;
  };
  version: string;
  scope?: string;
  enabled: boolean;
  settingsJson?: Record<string, unknown>;
  hasUpdate?: boolean;
  latestVersion?: string;
  availableVersions?: string[];
}

/**
 * Plugin settings from JSON storage
 */
export type PluginSettings = Record<string, unknown>;
