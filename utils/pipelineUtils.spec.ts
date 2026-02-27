import { describe, it, expect } from 'vitest';
import {
  parsePipelinesFromBackend,
  transformPipelinesForMutation,
  getAvailablePluginsFromInstalled,
} from './pipelineUtils';
import type { PipelineConfig } from './pipelineSchema';

describe('pipelineUtils', () => {
  describe('parsePipelinesFromBackend', () => {
    it('returns undefined for null input', () => {
      expect(parsePipelinesFromBackend(null)).toBeUndefined();
    });

    it('returns undefined for undefined input', () => {
      expect(parsePipelinesFromBackend(undefined)).toBeUndefined();
    });

    it('returns undefined for invalid JSON string', () => {
      expect(parsePipelinesFromBackend('not valid json')).toBeUndefined();
    });

    it('returns undefined for non-array JSON', () => {
      expect(parsePipelinesFromBackend('{"foo": "bar"}')).toBeUndefined();
    });

    it('parses JSON string from Neo4j storage', () => {
      const jsonString = JSON.stringify([
        {
          event: 'downloadableFile.created',
          stopOnFirstFailure: true,
          steps: [
            { pluginId: 'virus-scanner', version: '1.0.0', condition: 'ALWAYS', continueOnError: false },
          ],
        },
      ]);

      const result = parsePipelinesFromBackend(jsonString);

      expect(result).toBeDefined();
      expect(result?.pipelines).toHaveLength(1);
      expect(result?.pipelines[0].event).toBe('downloadableFile.created');
      expect(result?.pipelines[0].steps[0].plugin).toBe('virus-scanner');
    });

    it('parses array input directly', () => {
      const pipelines = [
        {
          event: 'comment.created',
          stopOnFirstFailure: false,
          steps: [
            { pluginId: 'spam-filter', condition: 'ALWAYS', continueOnError: true },
          ],
        },
      ];

      const result = parsePipelinesFromBackend(pipelines);

      expect(result).toBeDefined();
      expect(result?.pipelines).toHaveLength(1);
      expect(result?.pipelines[0].event).toBe('comment.created');
    });

    it('transforms pluginId to plugin field name', () => {
      const pipelines = [
        {
          event: 'downloadableFile.created',
          steps: [{ pluginId: 'my-plugin' }],
        },
      ];

      const result = parsePipelinesFromBackend(pipelines);

      expect(result?.pipelines[0].steps[0].plugin).toBe('my-plugin');
    });

    it('handles steps with plugin field instead of pluginId', () => {
      const pipelines = [
        {
          event: 'downloadableFile.created',
          steps: [{ plugin: 'my-plugin' }],
        },
      ];

      const result = parsePipelinesFromBackend(pipelines);

      expect(result?.pipelines[0].steps[0].plugin).toBe('my-plugin');
    });

    it('handles pipelines with empty steps array', () => {
      const pipelines = [
        { event: 'downloadableFile.created', steps: [] },
      ];

      const result = parsePipelinesFromBackend(pipelines);

      expect(result?.pipelines[0].steps).toHaveLength(0);
    });

    it('handles pipelines with missing steps property', () => {
      const pipelines = [
        { event: 'downloadableFile.created' },
      ];

      const result = parsePipelinesFromBackend(pipelines);

      expect(result?.pipelines[0].steps).toHaveLength(0);
    });

    it('preserves all step properties', () => {
      const pipelines = [
        {
          event: 'downloadableFile.created',
          stopOnFirstFailure: true,
          steps: [
            {
              pluginId: 'scanner',
              version: '2.0.0',
              condition: 'PREVIOUS_SUCCEEDED',
              continueOnError: true,
            },
          ],
        },
      ];

      const result = parsePipelinesFromBackend(pipelines);
      const step = result?.pipelines[0].steps[0];

      expect(step?.plugin).toBe('scanner');
      expect(step?.version).toBe('2.0.0');
      expect(step?.condition).toBe('PREVIOUS_SUCCEEDED');
      expect(step?.continueOnError).toBe(true);
    });
  });

  describe('transformPipelinesForMutation', () => {
    it('transforms single pipeline with single step', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            stopOnFirstFailure: true,
            steps: [
              { plugin: 'virus-scanner', version: '1.0.0', condition: 'ALWAYS', continueOnError: false },
            ],
          },
        ],
      };

      const result = transformPipelinesForMutation(config);

      expect(result).toHaveLength(1);
      expect(result[0].event).toBe('downloadableFile.created');
      expect(result[0].stopOnFirstFailure).toBe(true);
      expect(result[0].steps).toHaveLength(1);
      expect(result[0].steps[0].pluginId).toBe('virus-scanner');
    });

    it('transforms plugin field to pluginId', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'comment.created',
            steps: [{ plugin: 'my-plugin' }],
          },
        ],
      };

      const result = transformPipelinesForMutation(config);

      expect(result[0].steps[0].pluginId).toBe('my-plugin');
    });

    it('defaults stopOnFirstFailure to false', () => {
      const config: PipelineConfig = {
        pipelines: [
          { event: 'comment.created', steps: [] },
        ],
      };

      const result = transformPipelinesForMutation(config);

      expect(result[0].stopOnFirstFailure).toBe(false);
    });

    it('defaults condition to ALWAYS', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'comment.created',
            steps: [{ plugin: 'my-plugin' }],
          },
        ],
      };

      const result = transformPipelinesForMutation(config);

      expect(result[0].steps[0].condition).toBe('ALWAYS');
    });

    it('defaults continueOnError to false', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'comment.created',
            steps: [{ plugin: 'my-plugin' }],
          },
        ],
      };

      const result = transformPipelinesForMutation(config);

      expect(result[0].steps[0].continueOnError).toBe(false);
    });

    it('preserves version field', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'comment.created',
            steps: [{ plugin: 'my-plugin', version: '3.2.1' }],
          },
        ],
      };

      const result = transformPipelinesForMutation(config);

      expect(result[0].steps[0].version).toBe('3.2.1');
    });

    it('handles multiple pipelines with multiple steps', () => {
      const config: PipelineConfig = {
        pipelines: [
          {
            event: 'downloadableFile.created',
            stopOnFirstFailure: true,
            steps: [
              { plugin: 'scanner-1', condition: 'ALWAYS' },
              { plugin: 'scanner-2', condition: 'PREVIOUS_SUCCEEDED' },
            ],
          },
          {
            event: 'comment.created',
            steps: [
              { plugin: 'spam-filter', condition: 'ALWAYS' },
            ],
          },
        ],
      };

      const result = transformPipelinesForMutation(config);

      expect(result).toHaveLength(2);
      expect(result[0].steps).toHaveLength(2);
      expect(result[1].steps).toHaveLength(1);
    });

    it('handles empty pipelines array', () => {
      const config: PipelineConfig = { pipelines: [] };

      const result = transformPipelinesForMutation(config);

      expect(result).toHaveLength(0);
    });
  });

  describe('getAvailablePluginsFromInstalled', () => {
    it('returns empty array for empty input', () => {
      expect(getAvailablePluginsFromInstalled([])).toEqual([]);
    });

    it('filters out disabled plugins', () => {
      const installed = [
        { enabled: true, plugin: { name: 'enabled-plugin', displayName: 'Enabled' } },
        { enabled: false, plugin: { name: 'disabled-plugin', displayName: 'Disabled' } },
      ];

      const result = getAvailablePluginsFromInstalled(installed);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('enabled-plugin');
    });

    it('uses plugin.name as id', () => {
      const installed = [
        { enabled: true, plugin: { name: 'my-plugin-slug', displayName: 'My Plugin' } },
      ];

      const result = getAvailablePluginsFromInstalled(installed);

      expect(result[0].id).toBe('my-plugin-slug');
    });

    it('uses displayName for name when available', () => {
      const installed = [
        { enabled: true, plugin: { name: 'plugin-slug', displayName: 'Pretty Display Name' } },
      ];

      const result = getAvailablePluginsFromInstalled(installed);

      expect(result[0].name).toBe('Pretty Display Name');
    });

    it('falls back to plugin.name when displayName is missing', () => {
      const installed = [
        { enabled: true, plugin: { name: 'plugin-slug' } },
      ];

      const result = getAvailablePluginsFromInstalled(installed);

      expect(result[0].name).toBe('plugin-slug');
    });

    it('handles multiple enabled plugins', () => {
      const installed = [
        { enabled: true, plugin: { name: 'plugin-1', displayName: 'Plugin One' } },
        { enabled: true, plugin: { name: 'plugin-2', displayName: 'Plugin Two' } },
        { enabled: true, plugin: { name: 'plugin-3', displayName: 'Plugin Three' } },
      ];

      const result = getAvailablePluginsFromInstalled(installed);

      expect(result).toHaveLength(3);
      expect(result.map(p => p.id)).toEqual(['plugin-1', 'plugin-2', 'plugin-3']);
    });
  });
});
