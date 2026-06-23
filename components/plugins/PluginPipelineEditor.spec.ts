import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PluginPipelineEditor from '@/components/plugins/PluginPipelineEditor.vue';
import type { PipelineConfig } from '@/utils/pipelineSchema';

const plugins = [{ id: 'p1', name: 'Plugin One' }];

const validConfig: PipelineConfig = {
  pipelines: [
    { event: 'downloadableFile.created', steps: [{ plugin: 'p1' }] },
  ],
};

const editorStub = {
  name: 'PipelineYamlEditor',
  props: ['modelValue', 'errors'],
  emits: ['parse', 'update:modelValue'],
  template: '<div />',
};

const mountEditor = (props: Record<string, unknown> = {}) =>
  mount(PluginPipelineEditor, {
    props: { availablePlugins: plugins, ...props },
    global: { stubs: { PipelineYamlEditor: editorStub } },
  });

const emitParse = (
  wrapper: ReturnType<typeof mount>,
  config: PipelineConfig | null,
  error: string | null = null
) => wrapper.getComponent({ name: 'PipelineYamlEditor' }).vm.$emit('parse', config, error);

const saveButton = (wrapper: ReturnType<typeof mount>) => wrapper.get('button');

describe('PluginPipelineEditor reference panels', () => {
  it('lists the available plugins', () => {
    const wrapper = mountEditor();

    expect(wrapper.text()).toContain('Plugin One');
  });

  it('shows an empty-state message when no plugins are installed', () => {
    const wrapper = mountEditor({ availablePlugins: [] });

    expect(wrapper.text()).toContain('No plugins installed');
  });

  it('lists server events for the server scope', () => {
    const wrapper = mountEditor({ scope: 'server' });

    expect(wrapper.text()).toContain('downloadableFile.created');
  });

  it('lists channel events for the channel scope', () => {
    const wrapper = mountEditor({ scope: 'channel' });

    expect(wrapper.text()).toContain('discussionChannel.created');
  });
});

describe('PluginPipelineEditor parsing and validation', () => {
  it('marks unsaved changes after a successful parse', async () => {
    const wrapper = mountEditor();

    await emitParse(wrapper, validConfig);

    expect(wrapper.text()).toContain('Unsaved changes');
  });

  it('enables saving when the parsed config is valid', async () => {
    const wrapper = mountEditor();

    await emitParse(wrapper, validConfig);

    expect(saveButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('disables saving when a step references an unknown plugin', async () => {
    const wrapper = mountEditor();

    await emitParse(wrapper, {
      pipelines: [
        { event: 'downloadableFile.created', steps: [{ plugin: 'ghost' }] },
      ],
    });

    expect(saveButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('disables saving when the YAML fails to parse', async () => {
    const wrapper = mountEditor();

    await emitParse(wrapper, null, 'bad yaml');

    expect(saveButton(wrapper).attributes('disabled')).toBeDefined();
  });
});

describe('PluginPipelineEditor save', () => {
  it('emits save with the parsed config', async () => {
    const wrapper = mountEditor();
    await emitParse(wrapper, validConfig);

    await saveButton(wrapper).trigger('click');

    expect(wrapper.emitted('save')?.[0]?.[0]).toEqual(validConfig);
  });

  it('clears the unsaved indicator after saving', async () => {
    const wrapper = mountEditor();
    await emitParse(wrapper, validConfig);

    await saveButton(wrapper).trigger('click');

    expect(wrapper.text()).not.toContain('Unsaved changes');
  });
});

describe('PluginPipelineEditor initialConfig', () => {
  it('loads an initial config without marking it unsaved', () => {
    const wrapper = mountEditor({ initialConfig: validConfig });

    expect(wrapper.text()).not.toContain('Unsaved changes');
  });

  it('enables saving immediately for a valid initial config', () => {
    const wrapper = mountEditor({ initialConfig: validConfig });

    expect(saveButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('disables saving while a save is in progress', () => {
    const wrapper = mountEditor({ initialConfig: validConfig, saving: true });

    expect(saveButton(wrapper).attributes('disabled')).toBeDefined();
  });
});
