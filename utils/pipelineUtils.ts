import type { PipelineConfig, EventPipeline } from './pipelineSchema';

/**
 * Plugin option for pipeline editor
 */
export interface PluginOption {
  id: string;
  name: string;
}

/**
 * Input format for pipeline mutation (backend format)
 */
export interface EventPipelineInput {
  event: string;
  stopOnFirstFailure: boolean;
  steps: Array<{
    pluginId: string;
    version?: string;
    condition: string;
    continueOnError: boolean;
  }>;
}

/**
 * Parse pipelines from backend format to frontend PipelineConfig.
 * Handles JSON string parsing and field name transformation (pluginId → plugin).
 */
export function parsePipelinesFromBackend(pipelines: any): PipelineConfig | undefined {
  // Handle JSON string from Neo4j storage
  if (typeof pipelines === 'string') {
    try {
      pipelines = JSON.parse(pipelines);
    } catch {
      return undefined;
    }
  }

  if (pipelines && Array.isArray(pipelines)) {
    // Transform from backend format (pluginId) to frontend format (plugin)
    const transformedPipelines = pipelines.map((pipeline: any) => ({
      event: pipeline.event,
      stopOnFirstFailure: pipeline.stopOnFirstFailure,
      steps: (pipeline.steps || []).map((step: any) => ({
        plugin: step.pluginId || step.plugin,
        version: step.version,
        condition: step.condition,
        continueOnError: step.continueOnError,
      })),
    }));
    return { pipelines: transformedPipelines };
  }

  return undefined;
}

/**
 * Transform frontend PipelineConfig to backend mutation input format.
 * Converts field names (plugin → pluginId) and ensures defaults.
 */
export function transformPipelinesForMutation(config: PipelineConfig): EventPipelineInput[] {
  return config.pipelines.map((pipeline: EventPipeline) => ({
    event: pipeline.event,
    stopOnFirstFailure: pipeline.stopOnFirstFailure || false,
    steps: pipeline.steps.map((step) => ({
      pluginId: step.plugin,
      version: step.version,
      condition: step.condition || 'ALWAYS',
      continueOnError: step.continueOnError || false,
    })),
  }));
}

/**
 * Extract available plugins from installed plugins list.
 * Filters to only enabled plugins and maps to PluginOption format.
 */
export function getAvailablePluginsFromInstalled(installedPlugins: any[]): PluginOption[] {
  return installedPlugins
    .filter((p: any) => p.enabled)
    .map((p: any) => ({
      id: p.plugin.name,
      name: p.plugin.displayName || p.plugin.name,
    }));
}
