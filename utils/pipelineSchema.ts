// JSON Schema and TypeScript types for plugin pipeline configuration

// TypeScript types matching the backend schema
export type PipelineCondition = 'ALWAYS' | 'PREVIOUS_SUCCEEDED' | 'PREVIOUS_FAILED';

export interface PipelineStep {
  plugin: string;
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

// Available events that can trigger pipelines
export const PIPELINE_EVENTS = [
  {
    value: 'downloadableFile.created',
    label: 'File Upload',
    description: 'Triggered when a downloadable file is uploaded',
  },
  {
    value: 'downloadableFile.updated',
    label: 'File Updated',
    description: 'Triggered when a downloadable file is modified',
  },
] as const;

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

// JSON Schema for YAML validation in Monaco editor
export const pipelineJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Plugin Pipeline Configuration',
  description: 'Configure plugin execution pipelines for different events',
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
            enum: PIPELINE_EVENTS.map((e) => e.value),
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

// Default pipeline configuration template
export const DEFAULT_PIPELINE_YAML = `# Plugin Pipeline Configuration
# Configure which plugins run when files are uploaded

pipelines:
  - event: downloadableFile.created
    stopOnFirstFailure: false
    steps:
      # Add your plugin steps here
      # - plugin: security-attachment-scan
      #   condition: ALWAYS
      #   continueOnError: false
      #
      # - plugin: auto-labeler
      #   condition: PREVIOUS_SUCCEEDED
      #   continueOnError: true
`;

// Convert pipeline config to YAML string
export function pipelineToYaml(_config: PipelineConfig): string {
  // We'll use js-yaml for this, imported where needed
  return '';
}

// Validate pipeline configuration
export function validatePipelineConfig(
  config: PipelineConfig,
  availablePlugins: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

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
    } else if (!PIPELINE_EVENTS.some((e) => e.value === pipeline.event)) {
      errors.push(`${pipelinePrefix}: Unknown event "${pipeline.event}"`);
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
          errors.push(`${stepPrefix}: Unknown plugin "${step.plugin}"`);
        }

        if (step.condition && !['ALWAYS', 'PREVIOUS_SUCCEEDED', 'PREVIOUS_FAILED'].includes(step.condition)) {
          errors.push(`${stepPrefix}: Invalid condition "${step.condition}"`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
