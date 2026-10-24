import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PluginForumMultiSelectField from './PluginForumMultiSelectField.vue';

const field = (overrides: Record<string, unknown> = {}) => ({
  key: 'forums',
  label: 'Forums checked against server rules',
  type: 'forum-multiselect' as const,
  description: 'Choose forums for server-rule evaluation.',
  ...overrides,
});

const mountField = (props: Record<string, unknown> = {}) =>
  mount(PluginForumMultiSelectField, {
    props: {
      field: field(),
      modelValue: [],
      inputId: 'plugin-forums',
      ...props,
    },
    global: {
      stubs: {
        ForumPicker: {
          name: 'ForumPicker',
          props: [
            'selectedChannels',
            'description',
            'error',
            'inputId',
            'testId',
            'placeholder',
          ],
          emits: ['set-selected-channels'],
          template: '<div data-testid="forum-picker" />',
        },
      },
    },
  });

describe('PluginForumMultiSelectField', () => {
  it('associates its visible label with the picker control', () => {
    const wrapper = mountField();

    expect(wrapper.get('label').attributes('for')).toBe('plugin-forums');
  });

  it('passes selected forums and descriptive context to the picker', () => {
    const wrapper = mountField({ modelValue: ['cats', 'dogs'] });

    expect(wrapper.getComponent({ name: 'ForumPicker' }).props()).toMatchObject(
      {
        selectedChannels: ['cats', 'dogs'],
        description: 'Choose forums for server-rule evaluation.',
        inputId: 'plugin-forums',
      }
    );
  });

  it('emits selected forum arrays from the picker', async () => {
    const wrapper = mountField();

    await wrapper
      .getComponent({ name: 'ForumPicker' })
      .vm.$emit('set-selected-channels', ['cats']);

    expect(wrapper.emitted('update:modelValue')).toEqual([[['cats']]]);
  });

  it('shows a required error after clearing the picker', async () => {
    const wrapper = mountField({
      field: field({ required: true }),
      modelValue: ['cats'],
    });

    await wrapper
      .getComponent({ name: 'ForumPicker' })
      .vm.$emit('set-selected-channels', []);

    expect(wrapper.getComponent({ name: 'ForumPicker' }).props('error')).toBe(
      'Forums checked against server rules is required'
    );
  });
});
