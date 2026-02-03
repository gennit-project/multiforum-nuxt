// JSON Schema and TypeScript types for plugin pipeline configuration

// TypeScript types matching the backend schema
export type PipelineCondition = 'ALWAYS' | 'PREVIOUS_SUCCEEDED' | 'PREVIOUS_FAILED';

export interface PipelineStep {
  plugin: string;
  version?: string;  // Optional: specific version to use. If not specified, uses latest enabled version.
  condition?: PipelineCondition;
  continueOnError?: boolean;
}

export interface EventPipeline {
  event: string;
  stopOnFirstFailure?: boolean;
  steps: PipelineStep[];
}

export interface PipelineConfig {
  pipelines: EventPipeline[];
}

// Pipeline scope types (lowercase for configuration, distinct from runtime PipelineScope in usePluginPipeline)
export type PipelineConfigScope = 'server' | 'channel';

// Available events that can trigger pipelines
export const PIPELINE_EVENTS = [
  // Server-scoped events (configured by server admin)
  {
    value: 'downloadableFile.created',
    label: 'File Upload',
    description: 'Triggered when a downloadable file is uploaded',
    scope: 'server' as PipelineConfigScope,
  },
  {
    value: 'downloadableFile.updated',
    label: 'File Updated',
    description: 'Triggered when a downloadable file is modified',
    scope: 'server' as PipelineConfigScope,
  },
  {
    value: 'comment.created',
    label: 'Comment Created',
    description: 'Triggered when a comment is created',
    scope: 'server' as PipelineConfigScope,
  },
  {
    value: 'comment.created',
    label: 'Comment Created',
    description: 'Triggered when a comment is created in a channel',
    scope: 'channel' as PipelineConfigScope,
  },
  // Channel-scoped events (configured by channel admin)
  {
    value: 'discussionChannel.created',
    label: 'Content Submitted to Channel',
    description: 'Triggered when a discussion with download is submitted to this channel',
    scope: 'channel' as PipelineConfigScope,
  },
] as const;

// Get events filtered by scope
export const getEventsForScope = (scope: PipelineConfigScope) => {
  return PIPELINE_EVENTS.filter((event) => event.scope === scope);
};

// Server-only events for server pipeline configuration
export const SERVER_PIPELINE_EVENTS = getEventsForScope('server');

// Channel-only events for channel pipeline configuration
export const CHANNEL_PIPELINE_EVENTS = getEventsForScope('channel');

// Pipeline condition options
export const PIPELINE_CONDITIONS: { value: PipelineCondition; label: string; description: string }[] = [
  {
    value: 'ALWAYS',
    label: 'Always',
    description: 'Run regardless of previous step outcome',
  },
  {
    value: 'PREVIOUS_SUCCEEDED',
    label: 'If Previous Succeeded',
    description: 'Run only if the previous step succeeded',
  },
  {
    value: 'PREVIOUS_FAILED',
    label: 'If Previous Failed',
    description: 'Run only if the previous step failed',
  },
];

// Create JSON Schema for YAML validation in Monaco editor
const createPipelineJsonSchema = (scope: PipelineConfigScope) => {
  const events = getEventsForScope(scope);
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: scope === 'server' ? 'Server Plugin Pipeline Configuration' : 'Channel Plugin Pipeline Configuration',
    description: scope === 'server'
      ? 'Configure plugin execution pipelines for server-wide events'
      : 'Configure plugin execution pipelines for channel-specific events',
    type: 'object',
    required: ['pipelines'],
    properties: {
      pipelines: {
        type: 'array',
        description: 'List of event-triggered pipelines',
        items: {
          type: 'object',
          required: ['event', 'steps'],
          properties: {
            event: {
              type: 'string',
              description: 'The event that triggers this pipeline',
              enum: events.map((e) => e.value),
            },
            stopOnFirstFailure: {
              type: 'boolean',
              description: 'Stop pipeline execution if any step fails',
              default: false,
            },
            steps: {
              type: 'array',
              description: 'Ordered list of plugin steps to execute',
              minItems: 1,
              items: {
                type: 'object',
                required: ['plugin'],
                properties: {
                  plugin: {
                    type: 'string',
                    description: 'Plugin ID to execute',
                  },
                  version: {
                    type: 'string',
                    description: 'Specific plugin version to use (e.g., "0.1.3"). If not specified, uses the latest enabled version.',
                  },
                  condition: {
                    type: 'string',
                    description: 'When to execute this step',
                    enum: ['ALWAYS', 'PREVIOUS_SUCCEEDED', 'PREVIOUS_FAILED'],
                    default: 'ALWAYS',
                  },
                  continueOnError: {
                    type: 'boolean',
                    description: 'Continue pipeline even if this step fails',
                    default: false,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};

// JSON Schema for server pipeline configuration (default)
export const pipelineJsonSchema = createPipelineJsonSchema('server');

// JSON Schema for channel pipeline configuration
export const channelPipelineJsonSchema = createPipelineJsonSchema('channel');

// Get schema for a specific scope
export const getPipelineJsonSchema = (scope: PipelineConfigScope) => createPipelineJsonSchema(scope);

// Default pipeline configuration template for server pipelines
export const DEFAULT_PIPELINE_YAML = `# Server Plugin Pipeline Configuration
# Configure which plugins run when files are uploaded

pipelines:
  - event: downloadableFile.created
    stopOnFirstFailure: false
    steps:
      # Add your plugin steps here
      # - plugin: security-attachment-scan
      #   version: "1.0.0"        # Optional: pin to specific version
      #   condition: ALWAYS
      #   continueOnError: false
      #
      # - plugin: auto-labeler
      #   condition: PREVIOUS_SUCCEEDED
      #   continueOnError: true
`;

// Default pipeline configuration template for channel pipelines
export const DEFAULT_CHANNEL_PIPELINE_YAML = `# Channel Plugin Pipeline Configuration
# Configure which plugins run when content is submitted to this channel

pipelines:
  - event: discussionChannel.created
    stopOnFirstFailure: true
    steps:
      # Add your plugin steps here
      # Only plugins enabled at the server level can be used
      # - plugin: auto-labeler
      #   version: "1.0.0"        # Optional: pin to specific version
      #   condition: ALWAYS
      #   continueOnError: false
`;

// Get default YAML for a specific scope
export const getDefaultPipelineYaml = (scope: PipelineConfigScope): string => {
  return scope === 'server' ? DEFAULT_PIPELINE_YAML : DEFAULT_CHANNEL_PIPELINE_YAML;
};

// Convert pipeline config to YAML string
export function pipelineToYaml(_config: PipelineConfig): string {
  // We'll use js-yaml for this, imported where needed
  return '';
}

// Validate pipeline configuration
export function validatePipelineConfig(
  config: PipelineConfig,
  availablePlugins: string[],
  scope: PipelineConfigScope = 'server'
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validEvents = getEventsForScope(scope);

  if (!config.pipelines || !Array.isArray(config.pipelines)) {
    errors.push('Configuration must have a "pipelines" array');
    return { valid: false, errors };
  }

  for (let i = 0; i < config.pipelines.length; i++) {
    const pipeline = config.pipelines[i];
    if (!pipeline) continue;

    const pipelinePrefix = `Pipeline ${i + 1}`;

    // Check event
    if (!pipeline.event) {
      errors.push(`${pipelinePrefix}: Missing "event" field`);
    } else if (!validEvents.some((e) => e.value === pipeline.event)) {
      const validEventNames = validEvents.map((e) => e.value).join(', ');
      errors.push(`${pipelinePrefix}: Invalid event "${pipeline.event}" for ${scope} pipeline. Valid events: ${validEventNames}`);
    }

    // Check steps
    if (!pipeline.steps || !Array.isArray(pipeline.steps)) {
      errors.push(`${pipelinePrefix}: Missing "steps" array`);
    } else if (pipeline.steps.length === 0) {
      errors.push(`${pipelinePrefix}: Pipeline must have at least one step`);
    } else {
      for (let j = 0; j < pipeline.steps.length; j++) {
        const step = pipeline.steps[j];
        if (!step) continue;

        const stepPrefix = `${pipelinePrefix}, Step ${j + 1}`;

        if (!step.plugin) {
          errors.push(`${stepPrefix}: Missing "plugin" field`);
        } else if (availablePlugins.length > 0 && !availablePlugins.includes(step.plugin)) {
          const pluginList = availablePlugins.join(', ') || 'none';
          errors.push(`${stepPrefix}: Unknown plugin "${step.plugin}". Available plugins: ${pluginList}`);
        }

        if (step.condition && !['ALWAYS', 'PREVIOUS_SUCCEEDED', 'PREVIOUS_FAILED'].includes(step.condition)) {
          errors.push(`${stepPrefix}: Invalid condition "${step.condition}"`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
