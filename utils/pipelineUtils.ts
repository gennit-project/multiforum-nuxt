import type {
  PipelineConfig,
  EventPipeline,
  PipelineCondition,
} from './pipelineSchema';
import type {
  BackendPipeline,
  BackendPipelineStep,
  InstalledPlugin,
} from '@/types/plugin';

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
export function parsePipelinesFromBackend(
  pipelines: string | BackendPipeline[] | null | undefined
): PipelineConfig | undefined {
  let parsedPipelines: BackendPipeline[] | null = null;

  // Handle JSON string from Neo4j storage
  if (typeof pipelines === 'string') {
    try {
      parsedPipelines = JSON.parse(pipelines) as BackendPipeline[];
    } catch {
      return undefined;
    }
  } else if (Array.isArray(pipelines)) {
    parsedPipelines = pipelines;
  }

  if (parsedPipelines && Array.isArray(parsedPipelines)) {
    // Transform from backend format (pluginId) to frontend format (plugin)
    const transformedPipelines: EventPipeline[] = parsedPipelines.map(
      (pipeline: BackendPipeline) => ({
        event: pipeline.event,
        stopOnFirstFailure: pipeline.stopOnFirstFailure ?? false,
        steps: (pipeline.steps || []).map((step: BackendPipelineStep) => ({
          plugin: step.pluginId || step.plugin || '',
          version: step.version,
          condition: step.condition as PipelineCondition | undefined,
          continueOnError: step.continueOnError,
        })),
      })
    );
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
export function getAvailablePluginsFromInstalled(
  installedPlugins: InstalledPlugin[]
): PluginOption[] {
  return installedPlugins
    .filter((p: InstalledPlugin) => p.enabled)
    .map((p: InstalledPlugin) => ({
      id: p.plugin.name,
      name: p.plugin.displayName || p.plugin.name,
    }));
}
