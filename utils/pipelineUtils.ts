import { PipelineCondition as ConditionInput, PipelineApplicability as ApplicabilityInput } from '@/__generated__/graphql';
import type {
  PipelineConfig,
  EventPipeline,
  PipelineCondition,
  PipelineApplicability,
} from './pipelineSchema';
import type { EventPipelineInput as GeneratedEventPipelineInput } from '@/__generated__/graphql';
import type { GetInstalledPluginsQuery } from '@/__generated__/operations';
import { isPluginRecord } from './pluginManifestUtils';
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
export type EventPipelineInput = GeneratedEventPipelineInput;

/**
 * Parse pipelines from backend format to frontend PipelineConfig.
 * Handles JSON string parsing and field name transformation (pluginId → plugin).
 */
export function parsePipelinesFromBackend(pipelines: unknown): PipelineConfig | undefined {
  let parsed: unknown = pipelines;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return undefined; }
  }
  if (!Array.isArray(parsed)) return undefined;
  const condition = (value: unknown): PipelineCondition | undefined =>
    value === 'ALWAYS' || value === 'PREVIOUS_SUCCEEDED' || value === 'PREVIOUS_FAILED' ? value : undefined;
  const applicability = (value: unknown): PipelineApplicability | undefined =>
    value === 'NEW_FILES_ONLY' || value === 'ALL_FILES_GRADUAL' || value === 'ALL_FILES_IMMEDIATE' ? value : undefined;
  return { pipelines: parsed.flatMap((pipeline: unknown) => {
    if (!isPluginRecord(pipeline) || typeof pipeline.event !== 'string') return [];
    return [{
      event: pipeline.event,
      policyId: typeof pipeline.policyId === 'string' ? pipeline.policyId : undefined,
      stopOnFirstFailure: pipeline.stopOnFirstFailure === true,
      effectiveAt: typeof pipeline.effectiveAt === 'string' ? pipeline.effectiveAt : undefined,
      applicability: applicability(pipeline.applicability),
      steps: Array.isArray(pipeline.steps) ? pipeline.steps.flatMap((step: unknown) => {
        if (!isPluginRecord(step)) return [];
        return [{ plugin: typeof step.pluginId === 'string' ? step.pluginId : typeof step.plugin === 'string' ? step.plugin : '', version: typeof step.version === 'string' ? step.version : undefined, condition: condition(step.condition), continueOnError: typeof step.continueOnError === 'boolean' ? step.continueOnError : undefined }];
      }) : [],
    }];
  }) };
}

/**
 * Transform frontend PipelineConfig to backend mutation input format.
 * Converts field names (plugin → pluginId) and ensures defaults.
 */
export function transformPipelinesForMutation(config: PipelineConfig): EventPipelineInput[] {
  return config.pipelines.map((pipeline: EventPipeline) => ({
    event: pipeline.event,
    policyId: pipeline.policyId,
    stopOnFirstFailure: pipeline.stopOnFirstFailure || false,
    effectiveAt: pipeline.effectiveAt,
    applicability: pipeline.applicability === 'ALL_FILES_GRADUAL' ? ApplicabilityInput.AllFilesGradual : pipeline.applicability === 'ALL_FILES_IMMEDIATE' ? ApplicabilityInput.AllFilesImmediate : pipeline.applicability === 'NEW_FILES_ONLY' ? ApplicabilityInput.NewFilesOnly : undefined,
    steps: pipeline.steps.map((step) => ({
      pluginId: step.plugin,
      version: step.version,
      condition: step.condition === 'PREVIOUS_SUCCEEDED' ? ConditionInput.PreviousSucceeded : step.condition === 'PREVIOUS_FAILED' ? ConditionInput.PreviousFailed : ConditionInput.Always,
      continueOnError: step.continueOnError || false,
    })),
  }));
}

/**
 * Extract available plugins from installed plugins list.
 * Filters to only enabled plugins and maps to PluginOption format.
 */
export function getAvailablePluginsFromInstalled(
  installedPlugins: Array<Pick<GetInstalledPluginsQuery['getInstalledPlugins'][number], 'enabled' | 'plugin'>>
): PluginOption[] {
  return installedPlugins
    .filter((p) => p.enabled)
    .map((p) => ({
      id: p.plugin.name,
      name: p.plugin.displayName || p.plugin.name,
    }));
}
