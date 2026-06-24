import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PipelineVisualEditor from '@/components/plugins/PipelineVisualEditor.vue';
import type { EventPipeline } from '@/utils/pipelineSchema';

const draggableStub = {
  name: 'draggable',
  props: ['modelValue', 'itemKey'],
  emits: ['update:modelValue'],
  template:
    '<div><template v-for="(element, index) in modelValue" :key="index"><slot name="item" :element="element" :index="index" /></template></div>',
};

const pipeline = (overrides: Partial<EventPipeline> = {}): EventPipeline =>
  ({
    event: 'downloadableFile.created',
    stopOnFirstFailure: false,
    steps: [{ plugin: 'p1', condition: 'ALWAYS', continueOnError: false }],
    ...overrides,
  }) as EventPipeline;

const mountEditor = (props: Record<string, unknown> = {}) =>
  mount(PipelineVisualEditor, {
    props: {
      pipeline: pipeline(),
      availablePlugins: [
        { id: 'p1', name: 'Plugin One' },
        { id: 'p2', name: 'Plugin Two' },
      ],
      ...props,
    },
    global: { stubs: { draggable: draggableStub } },
  });

const lastUpdate = (w: ReturnType<typeof mount>) =>
  w.emitted('update:pipeline')?.at(-1)?.[0] as EventPipeline;

describe('PipelineVisualEditor header', () => {
  it('shows the human-readable event label', () => {
    const wrapper = mountEditor();

    expect(wrapper.text()).toContain('File Upload');
  });

  it('toggling stop-on-first-failure emits the updated pipeline', async () => {
    const wrapper = mountEditor();

    await wrapper.get('input[aria-label="Stop on first failure"]').setValue(true);

    expect(lastUpdate(wrapper).stopOnFirstFailure).toBe(true);
  });
});

describe('PipelineVisualEditor steps', () => {
  it('renders a row per step', () => {
    const wrapper = mountEditor({
      pipeline: pipeline({
        steps: [
          { plugin: 'p1', condition: 'ALWAYS', continueOnError: false },
          { plugin: 'p2', condition: 'ALWAYS', continueOnError: false },
        ],
      }),
    });

    expect(wrapper.findAll('button[title="Remove step"]')).toHaveLength(2);
  });

  it('shows the empty state when there are no steps', () => {
    const wrapper = mountEditor({ pipeline: pipeline({ steps: [] }) });

    expect(wrapper.text()).toContain('No steps configured');
  });

  it('adds a step', async () => {
    const wrapper = mountEditor({ pipeline: pipeline({ steps: [] }) });

    await wrapper.findAll('button').find((b) => b.text().includes('Add Step'))!.trigger('click');

    expect(lastUpdate(wrapper).steps).toHaveLength(1);
  });

  it('removes a step', async () => {
    const wrapper = mountEditor();

    await wrapper.get('button[title="Remove step"]').trigger('click');

    expect(lastUpdate(wrapper).steps).toHaveLength(0);
  });

  it('updates a step plugin', async () => {
    const wrapper = mountEditor();

    await wrapper.findAll('select')[0].setValue('p2');

    expect(lastUpdate(wrapper).steps[0].plugin).toBe('p2');
  });

  it('updates a step condition', async () => {
    const wrapper = mountEditor();

    await wrapper.findAll('select')[1].setValue('PREVIOUS_SUCCEEDED');

    expect(lastUpdate(wrapper).steps[0].condition).toBe('PREVIOUS_SUCCEEDED');
  });

  it('updates continue-on-error', async () => {
    const wrapper = mountEditor();

    await wrapper.get('input[aria-label="Continue on error"]').setValue(true);

    expect(lastUpdate(wrapper).steps[0].continueOnError).toBe(true);
  });
});

describe('PipelineVisualEditor validation', () => {
  it('lists validation errors', () => {
    const wrapper = mountEditor({ errors: ['Missing plugin', 'Bad condition'] });

    expect(wrapper.text()).toContain('Missing plugin');
  });
});
