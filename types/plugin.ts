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
  effectiveAt?: string;
  applicability?:
    | 'NEW_FILES_ONLY'
    | 'ALL_FILES_GRADUAL'
    | 'ALL_FILES_IMMEDIATE';
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
