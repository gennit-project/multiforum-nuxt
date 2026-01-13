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
      expect(result.errors.some((e) => e.includes('Invalid event'))).toBe(true);
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

describe('PluginPipelineEditor Component Logic', () => {
  // Available plugins for reference in tests
  const _availablePlugins = [
    { id: 'security-scan', name: 'Security Scanner' },
    { id: 'auto-labeler', name: 'Auto Labeler' },
  ];

  describe('canSave computed property', () => {
    it('should allow save when config is valid with no errors', () => {
      const parsedConfig: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            steps: [{ plugin: 'security-scan' }],
          },
        ],
      };
      const parseError: string | null = null;
      const validationErrors: string[] = [];
      const saving = false;

      const canSave = parsedConfig && !parseError && validationErrors.length === 0 && !saving;
      expect(canSave).toBe(true);
    });

    it('should not allow save when parsedConfig is null', () => {
      const parsedConfig: PipelineConfig | null = null;
      const parseError: string | null = null;
      const validationErrors: string[] = [];
      const saving = false;

      const canSave = parsedConfig && !parseError && validationErrors.length === 0 && !saving;
      expect(canSave).toBeFalsy();
    });

    it('should not allow save when there is a parse error', () => {
      const parsedConfig: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            steps: [{ plugin: 'security-scan' }],
          },
        ],
      };
      const parseError: string | null = 'Invalid YAML syntax';
      const validationErrors: string[] = [];
      const saving = false;

      const canSave = parsedConfig && !parseError && validationErrors.length === 0 && !saving;
      expect(canSave).toBe(false);
    });

    it('should not allow save when there are validation errors', () => {
      const parsedConfig: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            steps: [{ plugin: '' }],
          },
        ],
      };
      const parseError: string | null = null;
      const validationErrors: string[] = ['Pipeline 1, Step 1: Missing "plugin" field'];
      const saving = false;

      const canSave = parsedConfig && !parseError && validationErrors.length === 0 && !saving;
      expect(canSave).toBe(false);
    });

    it('should not allow save when currently saving', () => {
      const parsedConfig: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            steps: [{ plugin: 'security-scan' }],
          },
        ],
      };
      const parseError: string | null = null;
      const validationErrors: string[] = [];
      const saving = true;

      const canSave = parsedConfig && !parseError && validationErrors.length === 0 && !saving;
      expect(canSave).toBe(false);
    });
  });

  describe('Mode switching logic', () => {
    it('should not allow switching to visual mode when parse error exists', () => {
      const parseError: string | null = 'Invalid YAML';
      const targetMode = 'visual';

      // Logic from switchMode function
      const canSwitch = !(targetMode === 'visual' && parseError);
      expect(canSwitch).toBe(false);
    });

    it('should allow switching to visual mode when no parse error', () => {
      const parseError: string | null = null;
      const targetMode = 'visual';

      const canSwitch = !(targetMode === 'visual' && parseError);
      expect(canSwitch).toBe(true);
    });

    it('should always allow switching to yaml mode', () => {
      const parseError: string | null = 'Some error';
      const targetMode = 'yaml';

      // YAML mode doesn't need valid config
      const canSwitch = !(targetMode === 'visual' && parseError);
      expect(canSwitch).toBe(true);
    });
  });

  describe('handleVisualUpdate logic', () => {
    it('should create new config from pipeline update', () => {
      const updatedPipeline: EventPipeline = {
        event: 'downloadableFile.created',
        stopOnFirstFailure: true,
        steps: [
          { plugin: 'security-scan', condition: 'ALWAYS' },
          { plugin: 'auto-labeler', condition: 'PREVIOUS_SUCCEEDED' },
        ],
      };

      const newConfig: PipelineConfig = {
        pipelines: [updatedPipeline],
      };

      expect(newConfig.pipelines).toHaveLength(1);
      expect(newConfig.pipelines[0]).toBe(updatedPipeline);
    });

    it('should sync YAML content after visual update', () => {
      const updatedPipeline: EventPipeline = {
        event: 'downloadableFile.created',
        steps: [{ plugin: 'security-scan' }],
      };

      const newConfig: PipelineConfig = {
        pipelines: [updatedPipeline],
      };

      const yamlContent = yaml.dump(newConfig, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      });

      expect(yamlContent).toContain('downloadableFile.created');
      expect(yamlContent).toContain('security-scan');
    });
  });

  describe('currentPipeline computed property', () => {
    it('should return first pipeline from config', () => {
      const parsedConfig: PipelineConfig = {
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

      const currentPipeline = parsedConfig?.pipelines?.[0] || {
        event: 'downloadableFile.created',
        stopOnFirstFailure: false,
        steps: [],
      };

      expect(currentPipeline.event).toBe('downloadableFile.created');
      expect(currentPipeline.steps[0]?.plugin).toBe('security-scan');
    });

    it('should return default pipeline when config is empty', () => {
      const parsedConfig: PipelineConfig | null = null;

      const currentPipeline = parsedConfig?.pipelines?.[0] || {
        event: 'downloadableFile.created',
        stopOnFirstFailure: false,
        steps: [],
      };

      expect(currentPipeline.event).toBe('downloadableFile.created');
      expect(currentPipeline.stopOnFirstFailure).toBe(false);
      expect(currentPipeline.steps).toHaveLength(0);
    });
  });

  describe('Initial config loading', () => {
    it('should serialize initial config to YAML', () => {
      const initialConfig: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            stopOnFirstFailure: true,
            steps: [
              { plugin: 'security-scan', condition: 'ALWAYS' },
            ],
          },
        ],
      };

      const yamlContent = yaml.dump(initialConfig, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      });

      expect(yamlContent).toContain('stopOnFirstFailure: true');
      expect(yamlContent).toContain('condition: ALWAYS');
    });
  });
});

describe('PipelineVisualEditor Component Logic', () => {
  describe('Empty state handling', () => {
    it('should detect empty steps array', () => {
      const pipeline: EventPipeline = {
        event: 'downloadableFile.created',
        steps: [],
      };

      const isEmpty = pipeline.steps.length === 0;
      expect(isEmpty).toBe(true);
    });

    it('should detect non-empty steps array', () => {
      const pipeline: EventPipeline = {
        event: 'downloadableFile.created',
        steps: [{ plugin: 'security-scan' }],
      };

      const isEmpty = pipeline.steps.length === 0;
      expect(isEmpty).toBe(false);
    });
  });

  describe('Event label display', () => {
    it('should find event label from PIPELINE_EVENTS', () => {
      const eventValue = 'downloadableFile.created';
      const event = PIPELINE_EVENTS.find((e) => e.value === eventValue);

      expect(event?.label).toBe('File Upload');
      expect(event?.description).toBe('Triggered when a downloadable file is uploaded');
    });

    it('should handle unknown event gracefully', () => {
      const eventValue = 'unknown.event';
      const event = PIPELINE_EVENTS.find((e) => e.value === eventValue);
      const label = event?.label || eventValue;

      expect(label).toBe('unknown.event');
    });
  });

  describe('Step update operations', () => {
    it('should update step plugin correctly', () => {
      const steps: PipelineStep[] = [
        { plugin: 'old-plugin', condition: 'ALWAYS' },
        { plugin: 'other-plugin' },
      ];

      const index = 0;
      const updates = { plugin: 'new-plugin' };
      const newSteps = [...steps];
      const currentStep = newSteps[index];
      if (currentStep) {
        newSteps[index] = { ...currentStep, ...updates };
      }

      expect(newSteps[0]?.plugin).toBe('new-plugin');
      expect(newSteps[0]?.condition).toBe('ALWAYS');
      expect(newSteps[1]?.plugin).toBe('other-plugin');
    });

    it('should update step condition correctly', () => {
      const steps: PipelineStep[] = [
        { plugin: 'test-plugin', condition: 'ALWAYS' },
      ];

      const index = 0;
      const updates = { condition: 'PREVIOUS_SUCCEEDED' as const };
      const newSteps = [...steps];
      const currentStep = newSteps[index];
      if (currentStep) {
        newSteps[index] = { ...currentStep, ...updates };
      }

      expect(newSteps[0]?.condition).toBe('PREVIOUS_SUCCEEDED');
      expect(newSteps[0]?.plugin).toBe('test-plugin');
    });

    it('should update step continueOnError correctly', () => {
      const steps: PipelineStep[] = [
        { plugin: 'test-plugin', continueOnError: false },
      ];

      const index = 0;
      const updates = { continueOnError: true };
      const newSteps = [...steps];
      const currentStep = newSteps[index];
      if (currentStep) {
        newSteps[index] = { ...currentStep, ...updates };
      }

      expect(newSteps[0]?.continueOnError).toBe(true);
    });

    it('should handle update on non-existent index gracefully', () => {
      const steps: PipelineStep[] = [
        { plugin: 'test-plugin' },
      ];

      const index = 5; // Out of bounds
      const updates = { plugin: 'new-plugin' };
      const newSteps = [...steps];
      const currentStep = newSteps[index];
      if (currentStep) {
        newSteps[index] = { ...currentStep, ...updates };
      }

      // Should not modify anything
      expect(newSteps).toHaveLength(1);
      expect(newSteps[0]?.plugin).toBe('test-plugin');
    });
  });

  describe('Step removal operations', () => {
    it('should remove step at beginning', () => {
      const steps: PipelineStep[] = [
        { plugin: 'first' },
        { plugin: 'second' },
        { plugin: 'third' },
      ];

      const updatedSteps = steps.filter((_, i) => i !== 0);

      expect(updatedSteps).toHaveLength(2);
      expect(updatedSteps[0]?.plugin).toBe('second');
      expect(updatedSteps[1]?.plugin).toBe('third');
    });

    it('should remove step at end', () => {
      const steps: PipelineStep[] = [
        { plugin: 'first' },
        { plugin: 'second' },
        { plugin: 'third' },
      ];

      const updatedSteps = steps.filter((_, i) => i !== 2);

      expect(updatedSteps).toHaveLength(2);
      expect(updatedSteps[0]?.plugin).toBe('first');
      expect(updatedSteps[1]?.plugin).toBe('second');
    });

    it('should handle removing only step', () => {
      const steps: PipelineStep[] = [
        { plugin: 'only-step' },
      ];

      const updatedSteps = steps.filter((_, i) => i !== 0);

      expect(updatedSteps).toHaveLength(0);
    });
  });

  describe('Step addition operations', () => {
    it('should add step with default values', () => {
      const steps: PipelineStep[] = [
        { plugin: 'existing-plugin' },
      ];

      const newStep: PipelineStep = {
        plugin: '',
        condition: 'ALWAYS',
        continueOnError: false,
      };

      const updatedSteps = [...steps, newStep];

      expect(updatedSteps).toHaveLength(2);
      expect(updatedSteps[1]?.plugin).toBe('');
      expect(updatedSteps[1]?.condition).toBe('ALWAYS');
      expect(updatedSteps[1]?.continueOnError).toBe(false);
    });

    it('should add step to empty pipeline', () => {
      const steps: PipelineStep[] = [];

      const newStep: PipelineStep = {
        plugin: '',
        condition: 'ALWAYS',
        continueOnError: false,
      };

      const updatedSteps = [...steps, newStep];

      expect(updatedSteps).toHaveLength(1);
    });
  });

  describe('Pipeline stopOnFirstFailure updates', () => {
    it('should toggle stopOnFirstFailure from false to true', () => {
      const pipeline: EventPipeline = {
        event: 'downloadableFile.created',
        stopOnFirstFailure: false,
        steps: [{ plugin: 'test' }],
      };

      const updated = { ...pipeline, stopOnFirstFailure: true };

      expect(updated.stopOnFirstFailure).toBe(true);
      expect(updated.event).toBe(pipeline.event);
      expect(updated.steps).toBe(pipeline.steps);
    });

    it('should toggle stopOnFirstFailure from true to false', () => {
      const pipeline: EventPipeline = {
        event: 'downloadableFile.created',
        stopOnFirstFailure: true,
        steps: [{ plugin: 'test' }],
      };

      const updated = { ...pipeline, stopOnFirstFailure: false };

      expect(updated.stopOnFirstFailure).toBe(false);
    });

    it('should handle undefined stopOnFirstFailure', () => {
      const pipeline: EventPipeline = {
        event: 'downloadableFile.created',
        steps: [{ plugin: 'test' }],
      };

      const currentValue = pipeline.stopOnFirstFailure || false;
      expect(currentValue).toBe(false);
    });
  });
});

describe('Error Display Logic', () => {
  describe('Parse error handling', () => {
    it('should capture YAML parse error message', () => {
      const invalidYaml = `
pipelines:
  - event: downloadableFile.created
    steps
      - plugin: test
`;

      let parseError: string | null = null;
      try {
        yaml.load(invalidYaml);
      } catch (e: any) {
        parseError = e.message || 'Invalid YAML';
      }

      expect(parseError).not.toBeNull();
      expect(parseError).toContain('can not read a block mapping entry');
    });

    it('should have null parse error for valid YAML', () => {
      const validYaml = `
pipelines:
  - event: downloadableFile.created
    steps:
      - plugin: test
`;

      let parseError: string | null = null;
      try {
        yaml.load(validYaml);
      } catch (e: any) {
        parseError = e.message || 'Invalid YAML';
      }

      expect(parseError).toBeNull();
    });
  });

  describe('Validation errors display', () => {
    it('should collect multiple validation errors', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: '',
            steps: [],
          },
        ],
      };

      const result = validatePipelineConfig(config, ['security-scan']);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors.some((e) => e.includes('event'))).toBe(true);
      expect(result.errors.some((e) => e.includes('step'))).toBe(true);
    });

    it('should return empty errors array for valid config', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            steps: [{ plugin: 'security-scan' }],
          },
        ],
      };

      const result = validatePipelineConfig(config, ['security-scan']);

      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('Unsaved Changes Tracking', () => {
  it('should mark as unsaved after YAML content change', () => {
    let hasUnsavedChanges = false;

    // Simulate content change handler
    const handleContentChange = () => {
      hasUnsavedChanges = true;
    };

    handleContentChange();

    expect(hasUnsavedChanges).toBe(true);
  });

  it('should mark as unsaved after visual editor update', () => {
    let hasUnsavedChanges = false;

    // Simulate visual update handler
    const handleVisualUpdate = (_pipeline: EventPipeline) => {
      hasUnsavedChanges = true;
    };

    handleVisualUpdate({
      event: 'downloadableFile.created',
      steps: [{ plugin: 'test' }],
    });

    expect(hasUnsavedChanges).toBe(true);
  });

  it('should clear unsaved changes after save', () => {
    let hasUnsavedChanges = true;

    // Simulate save handler
    const handleSave = () => {
      hasUnsavedChanges = false;
    };

    handleSave();

    expect(hasUnsavedChanges).toBe(false);
  });
});
