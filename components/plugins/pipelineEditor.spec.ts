import { describe, it, expect } from 'vitest';
import * as yaml from 'js-yaml';
import type { PipelineConfig, EventPipeline, PipelineStep } from '@/utils/pipelineSchema';
import {
  validatePipelineConfig,
  PIPELINE_EVENTS,
  PIPELINE_CONDITIONS,
  DEFAULT_PIPELINE_YAML,
  pipelineJsonSchema,
} from '@/utils/pipelineSchema';

describe('Pipeline Schema', () => {
  describe('PIPELINE_EVENTS', () => {
    it('should have downloadableFile.created event', () => {
      const event = PIPELINE_EVENTS.find((e) => e.value === 'downloadableFile.created');
      expect(event).toBeDefined();
      expect(event?.label).toBe('File Upload');
    });

    it('should have downloadableFile.updated event', () => {
      const event = PIPELINE_EVENTS.find((e) => e.value === 'downloadableFile.updated');
      expect(event).toBeDefined();
      expect(event?.label).toBe('File Updated');
    });
  });

  describe('PIPELINE_CONDITIONS', () => {
    it('should have ALWAYS condition', () => {
      const condition = PIPELINE_CONDITIONS.find((c) => c.value === 'ALWAYS');
      expect(condition).toBeDefined();
      expect(condition?.label).toBe('Always');
    });

    it('should have PREVIOUS_SUCCEEDED condition', () => {
      const condition = PIPELINE_CONDITIONS.find((c) => c.value === 'PREVIOUS_SUCCEEDED');
      expect(condition).toBeDefined();
      expect(condition?.label).toBe('If Previous Succeeded');
    });

    it('should have PREVIOUS_FAILED condition', () => {
      const condition = PIPELINE_CONDITIONS.find((c) => c.value === 'PREVIOUS_FAILED');
      expect(condition).toBeDefined();
      expect(condition?.label).toBe('If Previous Failed');
    });
  });

  describe('pipelineJsonSchema', () => {
    it('should have required pipelines property', () => {
      expect(pipelineJsonSchema.required).toContain('pipelines');
    });

    it('should define pipelines as an array', () => {
      expect(pipelineJsonSchema.properties.pipelines.type).toBe('array');
    });

    it('should require event and steps in pipeline items', () => {
      const pipelineSchema = pipelineJsonSchema.properties.pipelines.items;
      expect(pipelineSchema.required).toContain('event');
      expect(pipelineSchema.required).toContain('steps');
    });
  });

  describe('DEFAULT_PIPELINE_YAML', () => {
    it('should be valid YAML', () => {
      expect(() => yaml.load(DEFAULT_PIPELINE_YAML)).not.toThrow();
    });

    it('should have pipelines array', () => {
      const config = yaml.load(DEFAULT_PIPELINE_YAML) as PipelineConfig;
      expect(config.pipelines).toBeDefined();
      expect(Array.isArray(config.pipelines)).toBe(true);
    });
  });
});

describe('validatePipelineConfig', () => {
  const availablePlugins = ['security-scan', 'auto-labeler', 'thumbnail-gen'];

  describe('Valid configurations', () => {
    it('should validate a simple valid config', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            steps: [{ plugin: 'security-scan' }],
          },
        ],
      };

      const result = validatePipelineConfig(config, availablePlugins);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate config with multiple steps', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            stopOnFirstFailure: true,
            steps: [
              { plugin: 'security-scan', condition: 'ALWAYS' },
              { plugin: 'auto-labeler', condition: 'PREVIOUS_SUCCEEDED', continueOnError: true },
              { plugin: 'thumbnail-gen', condition: 'ALWAYS' },
            ],
          },
        ],
      };

      const result = validatePipelineConfig(config, availablePlugins);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate config with multiple pipelines', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            steps: [{ plugin: 'security-scan' }],
          },
          {
            event: 'downloadableFile.updated',
            steps: [{ plugin: 'auto-labeler' }],
          },
        ],
      };

      const result = validatePipelineConfig(config, availablePlugins);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Invalid configurations', () => {
    it('should reject config without pipelines array', () => {
      const config = {} as PipelineConfig;
      const result = validatePipelineConfig(config, availablePlugins);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Configuration must have a "pipelines" array');
    });

    it('should reject pipeline without event', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: '',
            steps: [{ plugin: 'security-scan' }],
          },
        ],
      };

      const result = validatePipelineConfig(config, availablePlugins);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Missing "event"'))).toBe(true);
    });

    it('should reject pipeline with unknown event', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'unknown.event',
            steps: [{ plugin: 'security-scan' }],
          },
        ],
      };

      const result = validatePipelineConfig(config, availablePlugins);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Unknown event'))).toBe(true);
    });

    it('should reject pipeline without steps', () => {
      const config = {
        pipelines: [
          {
            event: 'downloadableFile.created',
          },
        ],
      } as unknown as PipelineConfig;

      const result = validatePipelineConfig(config, availablePlugins);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Missing "steps"'))).toBe(true);
    });

    it('should reject pipeline with empty steps array', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            steps: [],
          },
        ],
      };

      const result = validatePipelineConfig(config, availablePlugins);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('at least one step'))).toBe(true);
    });

    it('should reject step without plugin', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            steps: [{ plugin: '' }],
          },
        ],
      };

      const result = validatePipelineConfig(config, availablePlugins);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Missing "plugin"'))).toBe(true);
    });

    it('should reject step with unknown plugin', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            steps: [{ plugin: 'unknown-plugin' }],
          },
        ],
      };

      const result = validatePipelineConfig(config, availablePlugins);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Unknown plugin'))).toBe(true);
    });

    it('should reject step with invalid condition', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            steps: [{ plugin: 'security-scan', condition: 'INVALID' as any }],
          },
        ],
      };

      const result = validatePipelineConfig(config, availablePlugins);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid condition'))).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should allow unknown plugins when availablePlugins is empty', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            steps: [{ plugin: 'any-plugin' }],
          },
        ],
      };

      const result = validatePipelineConfig(config, []);
      expect(result.valid).toBe(true);
    });

    it('should handle null pipelines array gracefully', () => {
      const config = { pipelines: null } as unknown as PipelineConfig;
      const result = validatePipelineConfig(config, availablePlugins);
      expect(result.valid).toBe(false);
    });
  });
});

describe('YAML parsing and serialization', () => {
  it('should parse valid YAML to PipelineConfig', () => {
    const yamlContent = `
pipelines:
  - event: downloadableFile.created
    stopOnFirstFailure: true
    steps:
      - plugin: security-scan
        condition: ALWAYS
      - plugin: auto-labeler
        condition: PREVIOUS_SUCCEEDED
`;

    const config = yaml.load(yamlContent) as PipelineConfig;

    expect(config.pipelines).toHaveLength(1);
    expect(config.pipelines[0]?.event).toBe('downloadableFile.created');
    expect(config.pipelines[0]?.stopOnFirstFailure).toBe(true);
    expect(config.pipelines[0]?.steps).toHaveLength(2);
    expect(config.pipelines[0]?.steps[0]?.plugin).toBe('security-scan');
    expect(config.pipelines[0]?.steps[1]?.condition).toBe('PREVIOUS_SUCCEEDED');
  });

  it('should serialize PipelineConfig to valid YAML', () => {
    const config: PipelineConfig = {
      pipelines: [
        {
          event: 'downloadableFile.created',
          stopOnFirstFailure: false,
          steps: [
            { plugin: 'security-scan', condition: 'ALWAYS', continueOnError: false },
          ],
        },
      ],
    };

    const yamlContent = yaml.dump(config);
    const parsed = yaml.load(yamlContent) as PipelineConfig;

    expect(parsed.pipelines[0]?.event).toBe('downloadableFile.created');
    expect(parsed.pipelines[0]?.steps[0]?.plugin).toBe('security-scan');
  });

  it('should handle comments in YAML', () => {
    const yamlContent = `
# This is a comment
pipelines:
  - event: downloadableFile.created
    # Pipeline description
    steps:
      - plugin: security-scan # Scan for viruses
`;

    expect(() => yaml.load(yamlContent)).not.toThrow();
    const config = yaml.load(yamlContent) as PipelineConfig;
    expect(config.pipelines[0]?.steps[0]?.plugin).toBe('security-scan');
  });
});

describe('Visual Editor Logic', () => {
  describe('Step management', () => {
    it('should add a new step to pipeline', () => {
      const pipeline: EventPipeline = {
        event: 'downloadableFile.created',
        steps: [{ plugin: 'existing-plugin' }],
      };

      const newStep: PipelineStep = {
        plugin: '',
        condition: 'ALWAYS',
        continueOnError: false,
      };

      const updatedSteps = [...pipeline.steps, newStep];
      expect(updatedSteps).toHaveLength(2);
      expect(updatedSteps[1]?.plugin).toBe('');
    });

    it('should remove a step from pipeline', () => {
      const pipeline: EventPipeline = {
        event: 'downloadableFile.created',
        steps: [
          { plugin: 'plugin-1' },
          { plugin: 'plugin-2' },
          { plugin: 'plugin-3' },
        ],
      };

      const indexToRemove = 1;
      const updatedSteps = pipeline.steps.filter((_, i) => i !== indexToRemove);

      expect(updatedSteps).toHaveLength(2);
      expect(updatedSteps[0]?.plugin).toBe('plugin-1');
      expect(updatedSteps[1]?.plugin).toBe('plugin-3');
    });

    it('should update a step in pipeline', () => {
      const pipeline: EventPipeline = {
        event: 'downloadableFile.created',
        steps: [{ plugin: 'old-plugin', condition: 'ALWAYS' }],
      };

      const updatedSteps = [...pipeline.steps];
      const currentStep = updatedSteps[0];
      if (currentStep) {
        updatedSteps[0] = { ...currentStep, plugin: 'new-plugin' };
      }

      expect(updatedSteps[0]?.plugin).toBe('new-plugin');
      expect(updatedSteps[0]?.condition).toBe('ALWAYS');
    });

    it('should reorder steps via drag and drop simulation', () => {
      const steps: PipelineStep[] = [
        { plugin: 'first' },
        { plugin: 'second' },
        { plugin: 'third' },
      ];

      // Simulate moving 'third' to position 0
      const [movedItem] = steps.splice(2, 1);
      if (movedItem) {
        steps.splice(0, 0, movedItem);
      }

      expect(steps[0]?.plugin).toBe('third');
      expect(steps[1]?.plugin).toBe('first');
      expect(steps[2]?.plugin).toBe('second');
    });
  });

  describe('Pipeline options', () => {
    it('should toggle stopOnFirstFailure', () => {
      const pipeline: EventPipeline = {
        event: 'downloadableFile.created',
        stopOnFirstFailure: false,
        steps: [{ plugin: 'test' }],
      };

      const updated = { ...pipeline, stopOnFirstFailure: true };
      expect(updated.stopOnFirstFailure).toBe(true);
    });

    it('should toggle step continueOnError', () => {
      const step: PipelineStep = {
        plugin: 'test',
        continueOnError: false,
      };

      const updated = { ...step, continueOnError: true };
      expect(updated.continueOnError).toBe(true);
    });

    it('should change step condition', () => {
      const step: PipelineStep = {
        plugin: 'test',
        condition: 'ALWAYS',
      };

      const updated = { ...step, condition: 'PREVIOUS_SUCCEEDED' as const };
      expect(updated.condition).toBe('PREVIOUS_SUCCEEDED');
    });
  });
});

describe('Mode Switching', () => {
  it('should convert from YAML to config for visual mode', () => {
    const yamlContent = `
pipelines:
  - event: downloadableFile.created
    steps:
      - plugin: security-scan
`;

    const config = yaml.load(yamlContent) as PipelineConfig;
    expect(config.pipelines).toBeDefined();
    expect(config.pipelines[0]?.steps[0]?.plugin).toBe('security-scan');
  });

  it('should convert from config to YAML for yaml mode', () => {
    const config: PipelineConfig = {
      pipelines: [
        {
          event: 'downloadableFile.created',
          steps: [{ plugin: 'security-scan' }],
        },
      ],
    };

    const yamlContent = yaml.dump(config);
    expect(yamlContent).toContain('downloadableFile.created');
    expect(yamlContent).toContain('security-scan');
  });

  it('should preserve data when switching modes', () => {
    const originalConfig: PipelineConfig = {
      pipelines: [
        {
          event: 'downloadableFile.created',
          stopOnFirstFailure: true,
          steps: [
            { plugin: 'security-scan', condition: 'ALWAYS', continueOnError: false },
            { plugin: 'auto-labeler', condition: 'PREVIOUS_SUCCEEDED', continueOnError: true },
          ],
        },
      ],
    };

    // Convert to YAML
    const yamlContent = yaml.dump(originalConfig);

    // Parse back
    const parsedConfig = yaml.load(yamlContent) as PipelineConfig;

    // Verify data preserved
    expect(parsedConfig.pipelines[0]?.event).toBe(originalConfig.pipelines[0]?.event);
    expect(parsedConfig.pipelines[0]?.stopOnFirstFailure).toBe(originalConfig.pipelines[0]?.stopOnFirstFailure);
    expect(parsedConfig.pipelines[0]?.steps).toHaveLength(2);
    expect(parsedConfig.pipelines[0]?.steps[0]?.plugin).toBe('security-scan');
    expect(parsedConfig.pipelines[0]?.steps[1]?.continueOnError).toBe(true);
  });
});
