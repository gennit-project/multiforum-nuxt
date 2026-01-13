import { describe, it, expect } from 'vitest';
import {
  PIPELINE_EVENTS,
  PIPELINE_CONDITIONS,
  SERVER_PIPELINE_EVENTS,
  CHANNEL_PIPELINE_EVENTS,
  getEventsForScope,
  getPipelineJsonSchema,
  getDefaultPipelineYaml,
  validatePipelineConfig,
  DEFAULT_PIPELINE_YAML,
  DEFAULT_CHANNEL_PIPELINE_YAML,
  type PipelineConfig,
} from './pipelineSchema';

describe('pipelineSchema utilities', () => {
  describe('PIPELINE_EVENTS', () => {
    it('should have both server and channel scoped events', () => {
      const serverEvents = PIPELINE_EVENTS.filter((e) => e.scope === 'server');
      const channelEvents = PIPELINE_EVENTS.filter((e) => e.scope === 'channel');

      expect(serverEvents.length).toBeGreaterThan(0);
      expect(channelEvents.length).toBeGreaterThan(0);
    });

    it('should include downloadableFile.created as server event', () => {
      const event = PIPELINE_EVENTS.find((e) => e.value === 'downloadableFile.created');
      expect(event).toBeDefined();
      expect(event?.scope).toBe('server');
      expect(event?.label).toBe('File Upload');
    });

    it('should include downloadableFile.updated as server event', () => {
      const event = PIPELINE_EVENTS.find((e) => e.value === 'downloadableFile.updated');
      expect(event).toBeDefined();
      expect(event?.scope).toBe('server');
      expect(event?.label).toBe('File Updated');
    });

    it('should include discussionChannel.created as channel event', () => {
      const event = PIPELINE_EVENTS.find((e) => e.value === 'discussionChannel.created');
      expect(event).toBeDefined();
      expect(event?.scope).toBe('channel');
      expect(event?.label).toBe('Content Submitted to Channel');
    });

    it('should have description for all events', () => {
      for (const event of PIPELINE_EVENTS) {
        expect(event.description).toBeTruthy();
      }
    });
  });

  describe('getEventsForScope', () => {
    it('should return only server events when scope is server', () => {
      const events = getEventsForScope('server');
      expect(events.length).toBe(2);
      expect(events.every((e) => e.scope === 'server')).toBe(true);
      expect(events.some((e) => e.value === 'downloadableFile.created')).toBe(true);
      expect(events.some((e) => e.value === 'downloadableFile.updated')).toBe(true);
    });

    it('should return only channel events when scope is channel', () => {
      const events = getEventsForScope('channel');
      expect(events.length).toBe(1);
      expect(events.every((e) => e.scope === 'channel')).toBe(true);
      expect(events[0]?.value).toBe('discussionChannel.created');
    });

    it('should not return server events for channel scope', () => {
      const events = getEventsForScope('channel');
      expect(events.some((e) => e.value === 'downloadableFile.created')).toBe(false);
    });

    it('should not return channel events for server scope', () => {
      const events = getEventsForScope('server');
      expect(events.some((e) => e.value === 'discussionChannel.created')).toBe(false);
    });
  });

  describe('SERVER_PIPELINE_EVENTS and CHANNEL_PIPELINE_EVENTS', () => {
    it('SERVER_PIPELINE_EVENTS should match getEventsForScope(server)', () => {
      const fromHelper = getEventsForScope('server');
      expect(SERVER_PIPELINE_EVENTS).toEqual(fromHelper);
    });

    it('CHANNEL_PIPELINE_EVENTS should match getEventsForScope(channel)', () => {
      const fromHelper = getEventsForScope('channel');
      expect(CHANNEL_PIPELINE_EVENTS).toEqual(fromHelper);
    });
  });

  describe('PIPELINE_CONDITIONS', () => {
    it('should have all three conditions', () => {
      expect(PIPELINE_CONDITIONS.length).toBe(3);
      const values = PIPELINE_CONDITIONS.map((c) => c.value);
      expect(values).toContain('ALWAYS');
      expect(values).toContain('PREVIOUS_SUCCEEDED');
      expect(values).toContain('PREVIOUS_FAILED');
    });

    it('should have labels and descriptions for all conditions', () => {
      for (const condition of PIPELINE_CONDITIONS) {
        expect(condition.label).toBeTruthy();
        expect(condition.description).toBeTruthy();
      }
    });
  });

  describe('getPipelineJsonSchema', () => {
    it('should return schema with server events for server scope', () => {
      const schema = getPipelineJsonSchema('server');
      expect(schema.title).toContain('Server');

      const pipelineSchema = schema.properties?.pipelines;
      const eventEnum = pipelineSchema?.items?.properties?.event?.enum;
      expect(eventEnum).toContain('downloadableFile.created');
      expect(eventEnum).toContain('downloadableFile.updated');
      expect(eventEnum).not.toContain('discussionChannel.created');
    });

    it('should return schema with channel events for channel scope', () => {
      const schema = getPipelineJsonSchema('channel');
      expect(schema.title).toContain('Channel');

      const pipelineSchema = schema.properties?.pipelines;
      const eventEnum = pipelineSchema?.items?.properties?.event?.enum;
      expect(eventEnum).toContain('discussionChannel.created');
      expect(eventEnum).not.toContain('downloadableFile.created');
    });

    it('should have required pipelines array', () => {
      const schema = getPipelineJsonSchema('server');
      expect(schema.required).toContain('pipelines');
      expect(schema.properties?.pipelines?.type).toBe('array');
    });

    it('should include step schema with condition enum', () => {
      const schema = getPipelineJsonSchema('server');
      const stepSchema = schema.properties?.pipelines?.items?.properties?.steps?.items;
      expect(stepSchema?.properties?.condition?.enum).toEqual([
        'ALWAYS',
        'PREVIOUS_SUCCEEDED',
        'PREVIOUS_FAILED',
      ]);
    });
  });

  describe('getDefaultPipelineYaml', () => {
    it('should return server template for server scope', () => {
      const yaml = getDefaultPipelineYaml('server');
      expect(yaml).toBe(DEFAULT_PIPELINE_YAML);
      expect(yaml).toContain('downloadableFile.created');
      expect(yaml).toContain('Server Plugin Pipeline');
    });

    it('should return channel template for channel scope', () => {
      const yaml = getDefaultPipelineYaml('channel');
      expect(yaml).toBe(DEFAULT_CHANNEL_PIPELINE_YAML);
      expect(yaml).toContain('discussionChannel.created');
      expect(yaml).toContain('Channel Plugin Pipeline');
    });

    it('should mention server-enabled plugins in channel template', () => {
      const yaml = getDefaultPipelineYaml('channel');
      expect(yaml).toContain('plugins enabled at the server level');
    });
  });

  describe('validatePipelineConfig', () => {
    const availablePlugins = ['security-scan', 'auto-labeler', 'thumbnail-gen'];

    describe('basic validation', () => {
      it('should reject config without pipelines array', () => {
        const config = {} as PipelineConfig;
        const result = validatePipelineConfig(config, availablePlugins);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Configuration must have a "pipelines" array');
      });

      it('should accept valid server pipeline config', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'downloadableFile.created',
              steps: [{ plugin: 'security-scan' }],
            },
          ],
        };
        const result = validatePipelineConfig(config, availablePlugins, 'server');
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      });

      it('should accept valid channel pipeline config', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'discussionChannel.created',
              steps: [{ plugin: 'auto-labeler' }],
            },
          ],
        };
        const result = validatePipelineConfig(config, availablePlugins, 'channel');
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      });
    });

    describe('event validation by scope', () => {
      it('should reject channel event in server pipeline', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'discussionChannel.created',
              steps: [{ plugin: 'auto-labeler' }],
            },
          ],
        };
        const result = validatePipelineConfig(config, availablePlugins, 'server');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid event');
        expect(result.errors[0]).toContain('discussionChannel.created');
        expect(result.errors[0]).toContain('server pipeline');
      });

      it('should reject server event in channel pipeline', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'downloadableFile.created',
              steps: [{ plugin: 'security-scan' }],
            },
          ],
        };
        const result = validatePipelineConfig(config, availablePlugins, 'channel');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid event');
        expect(result.errors[0]).toContain('downloadableFile.created');
        expect(result.errors[0]).toContain('channel pipeline');
      });

      it('should list valid events in error message', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'invalid.event',
              steps: [{ plugin: 'security-scan' }],
            },
          ],
        };
        const result = validatePipelineConfig(config, availablePlugins, 'channel');
        expect(result.errors[0]).toContain('discussionChannel.created');
      });
    });

    describe('step validation', () => {
      it('should reject pipeline without steps', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'downloadableFile.created',
              steps: [],
            },
          ],
        };
        const result = validatePipelineConfig(config, availablePlugins, 'server');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Pipeline 1: Pipeline must have at least one step');
      });

      it('should reject step without plugin field', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'downloadableFile.created',
              steps: [{ plugin: '' }],
            },
          ],
        };
        const result = validatePipelineConfig(config, availablePlugins, 'server');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Missing "plugin" field');
      });

      it('should reject unknown plugin', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'downloadableFile.created',
              steps: [{ plugin: 'unknown-plugin' }],
            },
          ],
        };
        const result = validatePipelineConfig(config, availablePlugins, 'server');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Unknown plugin "unknown-plugin"');
      });

      it('should reject invalid condition', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'downloadableFile.created',
              steps: [{ plugin: 'security-scan', condition: 'INVALID' as any }],
            },
          ],
        };
        const result = validatePipelineConfig(config, availablePlugins, 'server');
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid condition');
      });

      it('should accept all valid conditions', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'downloadableFile.created',
              steps: [
                { plugin: 'security-scan', condition: 'ALWAYS' },
                { plugin: 'auto-labeler', condition: 'PREVIOUS_SUCCEEDED' },
                { plugin: 'thumbnail-gen', condition: 'PREVIOUS_FAILED' },
              ],
            },
          ],
        };
        const result = validatePipelineConfig(config, availablePlugins, 'server');
        expect(result.valid).toBe(true);
      });
    });

    describe('multiple pipelines', () => {
      it('should validate multiple pipelines independently', () => {
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
        const result = validatePipelineConfig(config, availablePlugins, 'server');
        expect(result.valid).toBe(true);
      });

      it('should report errors from multiple pipelines', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'downloadableFile.created',
              steps: [{ plugin: 'unknown1' }],
            },
            {
              event: 'downloadableFile.updated',
              steps: [{ plugin: 'unknown2' }],
            },
          ],
        };
        const result = validatePipelineConfig(config, availablePlugins, 'server');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBe(2);
        expect(result.errors[0]).toContain('Pipeline 1');
        expect(result.errors[1]).toContain('Pipeline 2');
      });
    });

    describe('empty available plugins', () => {
      it('should skip plugin existence check when availablePlugins is empty', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'downloadableFile.created',
              steps: [{ plugin: 'any-plugin' }],
            },
          ],
        };
        const result = validatePipelineConfig(config, [], 'server');
        expect(result.valid).toBe(true);
      });
    });

    describe('default scope behavior', () => {
      it('should default to server scope when not specified', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'downloadableFile.created',
              steps: [{ plugin: 'security-scan' }],
            },
          ],
        };
        // Call without scope parameter
        const result = validatePipelineConfig(config, availablePlugins);
        expect(result.valid).toBe(true);
      });

      it('should reject channel events when scope defaults to server', () => {
        const config: PipelineConfig = {
          pipelines: [
            {
              event: 'discussionChannel.created',
              steps: [{ plugin: 'auto-labeler' }],
            },
          ],
        };
        // Call without scope parameter - should default to server
        const result = validatePipelineConfig(config, availablePlugins);
        expect(result.valid).toBe(false);
      });
    });
  });
});
