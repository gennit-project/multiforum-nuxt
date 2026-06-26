import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import IssueBodyEditor from './IssueBodyEditor.vue';

const mountEditor = (props: Record<string, unknown> = {}) =>
  mount(IssueBodyEditor, {
    props: {
      isIssueAuthor: true,
      isLocked: false,
      isEditingIssueBody: false,
      editedIssueBody: '',
      updateIssueBodyLoading: false,
      issueBodyHasChanges: false,
      ...props,
    },
    global: {
      stubs: {
        GenericButton: {
          props: ['text'],
          template: '<button @click="$emit(\'click\')">{{ text }}</button>',
        },
        SaveButton: {
          props: ['label', 'disabled'],
          template:
            '<button class="save" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
        },
        MarkdownPreview: { props: ['text'], template: '<div class="md">{{ text }}</div>' },
        TextEditor: {
          template: '<textarea class="te" @input="$emit(\'update\', \'new body\')" />',
        },
        ErrorBanner: { props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

describe('IssueBodyEditor', () => {
  it('shows the Edit button to the author of an unlocked issue', () => {
    expect(mountEditor().text()).toContain('Edit');
  });

  it('hides edit controls when the issue is locked', () => {
    expect(mountEditor({ isLocked: true }).text()).not.toContain('Edit');
  });

  it('emits startEdit when Edit is clicked', async () => {
    const wrapper = mountEditor();
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('startEdit')).toBeTruthy();
  });

  it('renders the markdown preview when not editing', () => {
    expect(
      mountEditor({ issueBody: 'Hello' }).find('.md').text()
    ).toBe('Hello');
  });

  it('shows the editor and forwards body updates in edit mode', async () => {
    const wrapper = mountEditor({ isEditingIssueBody: true });
    await wrapper.find('.te').trigger('input');
    expect(wrapper.emitted('update:editedIssueBody')?.[0]).toEqual(['new body']);
  });

  it('shows the error banner when there is an update error', () => {
    expect(
      mountEditor({ updateIssueBodyError: { message: 'Failed' } }).find('.err').text()
    ).toBe('Failed');
  });
});
