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

      expect({
        hasServerEvents: serverEvents.length > 0,
        hasChannelEvents: channelEvents.length > 0,
      }).toEqual({
        hasServerEvents: true,
        hasChannelEvents: true,
      });
    });

    it('should include downloadableFile.created as server event', () => {
      const event = PIPELINE_EVENTS.find((e) => e.value === 'downloadableFile.created');
      expect(event).toEqual(
        expect.objectContaining({
          value: 'downloadableFile.created',
          scope: 'server',
          label: 'File Upload',
        })
      );
    });

    it('should include downloadableFile.updated as server event', () => {
      const event = PIPELINE_EVENTS.find((e) => e.value === 'downloadableFile.updated');
      expect(event).toEqual(
        expect.objectContaining({
          value: 'downloadableFile.updated',
          scope: 'server',
          label: 'File Updated',
        })
      );
    });

    it('should include comment.created as server event', () => {
      const event = PIPELINE_EVENTS.find((e) => e.value === 'comment.created');
      expect(event).toEqual(
        expect.objectContaining({
          value: 'comment.created',
          scope: 'server',
          label: 'Comment Created',
        })
      );
    });

    it('should include discussionChannel.created as channel event', () => {
      const event = PIPELINE_EVENTS.find((e) => e.value === 'discussionChannel.created');
      expect(event).toEqual(
        expect.objectContaining({
          value: 'discussionChannel.created',
          scope: 'channel',
          label: 'Content Submitted to Channel',
        })
      );
    });

    it('should have description for all events', () => {
      expect(PIPELINE_EVENTS.every((event) => Boolean(event.description))).toBe(true);
    });
  });

  describe('getEventsForScope', () => {
    it('should return only server events when scope is server', () => {
      const events = getEventsForScope('server');
      expect({
        count: events.length,
        allServer: events.every((e) => e.scope === 'server'),
        hasCreated: events.some((e) => e.value === 'downloadableFile.created'),
        hasUpdated: events.some((e) => e.value === 'downloadableFile.updated'),
        hasComment: events.some((e) => e.value === 'comment.created'),
      }).toEqual({
        count: 3,
        allServer: true,
        hasCreated: true,
        hasUpdated: true,
        hasComment: true,
      });
    });

    it('should return only channel events when scope is channel', () => {
      const events = getEventsForScope('channel');
      expect({
        count: events.length,
        allChannel: events.every((e) => e.scope === 'channel'),
        firstValue: events[0]?.value,
      }).toEqual({
        count: 1,
        allChannel: true,
        firstValue: 'discussionChannel.created',
      });
    });

    it('should not return server events for channel scope', () => {
      const events = getEventsForScope('channel');
      expect(
        events.some((e) => e.value === 'downloadableFile.created' || e.value === 'comment.created')
      ).toBe(false);
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
      const values = PIPELINE_CONDITIONS.map((c) => c.value);
      expect({
        length: PIPELINE_CONDITIONS.length,
        values,
      }).toEqual({
        length: 3,
        values: expect.arrayContaining(['ALWAYS', 'PREVIOUS_SUCCEEDED', 'PREVIOUS_FAILED']),
      });
    });

    it('should have labels and descriptions for all conditions', () => {
      expect(PIPELINE_CONDITIONS.every((condition) => Boolean(condition.label && condition.description))).toBe(true);
    });
  });

  describe('getPipelineJsonSchema', () => {
    it('should return schema with server events for server scope', () => {
      const schema = getPipelineJsonSchema('server');
      const pipelineSchema = schema.properties?.pipelines;
      const eventEnum = pipelineSchema?.items?.properties?.event?.enum;
      expect({
        titleIncludesServer: schema.title.includes('Server'),
        hasCreated: eventEnum?.includes('downloadableFile.created'),
        hasUpdated: eventEnum?.includes('downloadableFile.updated'),
        hasComment: eventEnum?.includes('comment.created'),
        hasChannel: eventEnum?.includes('discussionChannel.created'),
      }).toEqual({
        titleIncludesServer: true,
        hasCreated: true,
        hasUpdated: true,
        hasComment: true,
        hasChannel: false,
      });
    });

    it('should return schema with channel events for channel scope', () => {
      const schema = getPipelineJsonSchema('channel');
      const pipelineSchema = schema.properties?.pipelines;
      const eventEnum = pipelineSchema?.items?.properties?.event?.enum;
      expect({
        titleIncludesChannel: schema.title.includes('Channel'),
        hasChannel: eventEnum?.includes('discussionChannel.created'),
        hasCreated: eventEnum?.includes('downloadableFile.created'),
        hasComment: eventEnum?.includes('comment.created'),
      }).toEqual({
        titleIncludesChannel: true,
        hasChannel: true,
        hasCreated: false,
        hasComment: false,
      });
    });

    it('should have required pipelines array', () => {
      const schema = getPipelineJsonSchema('server');
      expect({
        hasPipelinesRequired: schema.required?.includes('pipelines'),
        pipelinesType: schema.properties?.pipelines?.type,
      }).toEqual({
        hasPipelinesRequired: true,
        pipelinesType: 'array',
      });
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
      expect({
        sameTemplate: yaml === DEFAULT_PIPELINE_YAML,
        hasEvent: yaml.includes('downloadableFile.created'),
        hasTitle: yaml.includes('Server Plugin Pipeline'),
      }).toEqual({
        sameTemplate: true,
        hasEvent: true,
        hasTitle: true,
      });
    });

    it('should return channel template for channel scope', () => {
      const yaml = getDefaultPipelineYaml('channel');
      expect({
        sameTemplate: yaml === DEFAULT_CHANNEL_PIPELINE_YAML,
        hasEvent: yaml.includes('discussionChannel.created'),
        hasTitle: yaml.includes('Channel Plugin Pipeline'),
      }).toEqual({
        sameTemplate: true,
        hasEvent: true,
        hasTitle: true,
      });
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
        expect({
          valid: result.valid,
          hasError: result.errors.includes('Configuration must have a "pipelines" array'),
        }).toEqual({
          valid: false,
          hasError: true,
        });
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
        expect({ valid: result.valid, errors: result.errors.length }).toEqual({ valid: true, errors: 0 });
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
        expect({ valid: result.valid, errors: result.errors.length }).toEqual({ valid: true, errors: 0 });
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
        expect({
          valid: result.valid,
          message: result.errors[0],
        }).toEqual({
          valid: false,
          message: expect.stringContaining('discussionChannel.created'),
        });
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
        expect({
          valid: result.valid,
          message: result.errors[0],
        }).toEqual({
          valid: false,
          message: expect.stringContaining('downloadableFile.created'),
        });
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
        expect(result.errors[0]).toEqual(expect.stringContaining('discussionChannel.created'));
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
        expect({
          valid: result.valid,
          hasError: result.errors.includes('Pipeline 1: Pipeline must have at least one step'),
        }).toEqual({
          valid: false,
          hasError: true,
        });
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
        expect({
          valid: result.valid,
          message: result.errors[0],
        }).toEqual({
          valid: false,
          message: expect.stringContaining('Missing "plugin" field'),
        });
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
        expect({
          valid: result.valid,
          message: result.errors[0],
        }).toEqual({
          valid: false,
          message: expect.stringContaining('Unknown plugin "unknown-plugin"'),
        });
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
        expect({
          valid: result.valid,
          message: result.errors[0],
        }).toEqual({
          valid: false,
          message: expect.stringContaining('Invalid condition'),
        });
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
        expect({
          valid: result.valid,
          errorCount: result.errors.length,
        }).toEqual({
          valid: false,
          errorCount: 2,
        });
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
