import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import IssueLockDialog from './IssueLockDialog.vue';

const mountDialog = (props: Record<string, unknown> = {}) =>
  mount(IssueLockDialog, {
    props: { lockReasonInput: '', lockIssueLoading: false, ...props },
    global: {
      stubs: {
        GenericButton: {
          props: ['text'],
          template: '<button @click="$emit(\'click\')">{{ text }}</button>',
        },
        SaveButton: {
          props: ['label', 'disabled', 'loading'],
          template:
            '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
        },
        ErrorBanner: { props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

describe('IssueLockDialog', () => {
  it('emits update:lockReasonInput when the textarea changes', async () => {
    const wrapper = mountDialog();
    await wrapper.find('textarea').setValue('spam');
    expect(wrapper.emitted('update:lockReasonInput')?.[0]).toEqual(['spam']);
  });

  it('emits close when Cancel is clicked', async () => {
    const wrapper = mountDialog();
    await wrapper.findAll('button')[0].trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits lock when the lock button is clicked', async () => {
    const wrapper = mountDialog({ lockReasonInput: 'spam' });
    await wrapper.findAll('button').at(-1)?.trigger('click');
    expect(wrapper.emitted('lock')).toBeTruthy();
  });

  it('disables the lock button when the reason is blank', () => {
    const wrapper = mountDialog({ lockReasonInput: '   ' });
    expect(
      (wrapper.findAll('button').at(-1)?.element as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it('shows the error banner when there is a lock error', () => {
    const wrapper = mountDialog({
      lockIssueError: { message: 'Boom' } as never,
    });
    expect(wrapper.find('.err').text()).toBe('Boom');
  });
});
