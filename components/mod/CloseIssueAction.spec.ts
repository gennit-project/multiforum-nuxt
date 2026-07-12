import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import CloseIssueAction from '@/components/mod/CloseIssueAction.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const iconStub = defineComponent({
  name: 'XCircleIcon',
  template: '<div class="x-circle-icon-stub" />',
});

const mountAction = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(CloseIssueAction, {
    props,
    global: {
      stubs: {
        XCircleIcon: iconStub,
      },
    },
  });

describe('CloseIssueAction', () => {
  it('renders the call-to-action copy', () => {
    const wrapper = mountAction();

    expect(wrapper.text()).toContain('Complete the review and close this issue.');
    expect(wrapper.text()).toContain('Close Issue (No Action Needed)');
  });

  it('renders the icon in the button', () => {
    const wrapper = mountAction();

    expect(wrapper.find('.x-circle-icon-stub').exists()).toBe(true);
  });

  it('passes the loading attribute through to the button', () => {
    const wrapper = mountAction({ loading: true });

    expect(wrapper.get('button').attributes('loading')).toBeDefined();
  });

  it('emits close-issue when the button is clicked', async () => {
    const wrapper = mountAction();

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('close-issue')?.length).toBe(1);
  });

  it('renders the explanatory footer copy', () => {
    const wrapper = mountAction();

    expect(wrapper.text()).toContain(
      'This records that moderators reviewed the content and found no violation.'
    );
  });
});
