import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import PipelineYamlEditor from '@/components/plugins/PipelineYamlEditor.vue';

const h = vi.hoisted(() => ({
  codemirrorStub: {
    name: 'CodemirrorStub',
    props: ['modelValue', 'extensions'],
    emits: ['update:modelValue', 'ready'],
    template: '<div class="cm" />',
  },
}));

// vue-codemirror renders a real EditorView; replace it so we can drive the
// v-model and assert the parse/update logic without CodeMirror.
vi.mock('vue-codemirror', () => ({ Codemirror: h.codemirrorStub }));
vi.mock('@/stores/uiStore', () => ({ useUIStore: () => ({ theme: ref('light') }) }));
vi.mock('pinia', () => ({ storeToRefs: (s: { theme: unknown }) => ({ theme: s.theme }) }));

const mountEditor = (props: Record<string, unknown> = {}) =>
  mount(PipelineYamlEditor, {
    props: { modelValue: 'name: test', ...props },
    global: { stubs: { ClientOnly: { template: '<div><slot /></div>' } } },
  });

const editor = (w: ReturnType<typeof mount>) => w.getComponent(h.codemirrorStub);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PipelineYamlEditor parsing', () => {
  it('emits a parsed config for valid YAML', async () => {
    const wrapper = mountEditor({ modelValue: '' });

    await editor(wrapper).vm.$emit('update:modelValue', 'name: test');

    expect(wrapper.emitted('parse')?.at(-1)).toEqual([{ name: 'test' }, null]);
  });

  it('emits a parse error for invalid YAML', async () => {
    const wrapper = mountEditor({ modelValue: '' });

    await editor(wrapper).vm.$emit('update:modelValue', 'a:\n  - b\n c');

    expect(wrapper.emitted('parse')?.at(-1)?.[1]).toBeTruthy();
  });

  it('shows the parse error message', async () => {
    const wrapper = mountEditor({ modelValue: '' });

    await editor(wrapper).vm.$emit('update:modelValue', 'a:\n  - b\n c');

    expect(wrapper.text()).toContain('YAML Parse Error');
  });

  it('parses an updated modelValue prop', async () => {
    const wrapper = mountEditor({ modelValue: 'name: a' });

    await wrapper.setProps({ modelValue: 'name: b' });

    expect(wrapper.emitted('parse')?.at(-1)).toEqual([{ name: 'b' }, null]);
  });
});

describe('PipelineYamlEditor editing', () => {
  it('emits update:modelValue when the editor value changes', async () => {
    const wrapper = mountEditor({ modelValue: 'name: a' });

    await editor(wrapper).vm.$emit('update:modelValue', 'name: b');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['name: b']);
  });

  it('re-parses on editor change', async () => {
    const wrapper = mountEditor({ modelValue: 'name: a' });

    await editor(wrapper).vm.$emit('update:modelValue', 'name: b');

    expect(wrapper.emitted('parse')?.at(-1)).toEqual([{ name: 'b' }, null]);
  });
});

describe('PipelineYamlEditor validation errors', () => {
  it('renders the validation errors list', () => {
    const wrapper = mountEditor({ errors: ['Missing field', 'Bad value'] });

    expect(wrapper.text()).toContain('Missing field');
  });

  it('hides the validation list when there are no errors', () => {
    const wrapper = mountEditor();

    expect(wrapper.text()).not.toContain('Validation Errors');
  });
});
