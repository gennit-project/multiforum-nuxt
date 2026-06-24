import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import RulesEditor from '@/components/RulesEditor.vue';

const rules = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ summary: `Rule ${i}`, detail: `Detail ${i}` }));

const textInputStub = {
  name: 'TextInput',
  props: ['value', 'testId', 'placeholder'],
  emits: ['update'],
  template: '<input :data-testid="testId" />',
};

const mountEditor = (ruleList = rules(2)) =>
  mount(RulesEditor, {
    props: { formValues: { rules: ruleList } },
    global: {
      stubs: {
        TextInput: textInputStub,
        TextEditor: { name: 'TextEditor', props: ['initialValue', 'testId'], emits: ['update'], template: '<div />' },
        XmarkIcon: true,
      },
    },
  });

const buttonByText = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text().includes(text));

describe('RulesEditor rendering', () => {
  it('renders a block per rule', () => {
    const wrapper = mountEditor(rules(3));

    expect(wrapper.text()).toContain('Rule 3');
  });

  it('renders nothing extra for an empty rule list', () => {
    const wrapper = mountEditor([]);

    expect(wrapper.findAllComponents(textInputStub)).toHaveLength(0);
  });
});

describe('RulesEditor editing', () => {
  it('emits an updated summary', async () => {
    const wrapper = mountEditor();

    await wrapper.getComponent(textInputStub).vm.$emit('update', 'New summary');

    const emitted = wrapper.emitted('updateFormValues');
    expect(emitted?.at(-1)?.[0]).toEqual({
      rules: [
        { summary: 'New summary', detail: 'Detail 0' },
        { summary: 'Rule 1', detail: 'Detail 1' },
      ],
    });
  });

  it('emits an updated detail from the editor', async () => {
    const wrapper = mountEditor();

    await wrapper.getComponent({ name: 'TextEditor' }).vm.$emit('update', 'New detail');

    expect(wrapper.emitted('updateFormValues')?.at(-1)?.[0]).toEqual({
      rules: [
        { summary: 'Rule 0', detail: 'New detail' },
        { summary: 'Rule 1', detail: 'Detail 1' },
      ],
    });
  });

  it('appends a new blank rule', async () => {
    const wrapper = mountEditor(rules(1));

    await buttonByText(wrapper, 'Add New Rule')!.trigger('click');

    expect(wrapper.emitted('updateFormValues')?.[0]?.[0]).toEqual({
      rules: [{ summary: 'Rule 0', detail: 'Detail 0' }, { summary: '', detail: '' }],
    });
  });

  it('deletes a rule', async () => {
    const wrapper = mountEditor(rules(2));

    await buttonByText(wrapper, 'Delete Rule')!.trigger('click');

    expect(wrapper.emitted('updateFormValues')?.[0]?.[0]).toEqual({
      rules: [{ summary: 'Rule 1', detail: 'Detail 1' }],
    });
  });
});
