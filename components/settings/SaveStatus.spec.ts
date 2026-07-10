import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SaveStatus from './SaveStatus.vue';

const mountStatus = (props: Record<string, unknown>) =>
  mount(SaveStatus, { props });

describe('SaveStatus', () => {
  it('renders nothing visible in the idle state', () => {
    expect(mountStatus({ status: 'idle' }).text()).toBe('');
  });

  it('announces saving via a polite live region', () => {
    const wrapper = mountStatus({ status: 'saving' });
    expect(wrapper.get('[aria-live="polite"]').text()).toContain('Saving');
  });

  it('shows the saved confirmation', () => {
    expect(mountStatus({ status: 'saved' }).text()).toContain('Saved');
  });

  it('surfaces a save error with an alert role', () => {
    const wrapper = mountStatus({
      status: 'error',
      errorMessage: 'Server said no',
    });
    expect(wrapper.get('[role="alert"]').text()).toContain('Server said no');
  });

  it('falls back to default error copy when no message is provided', () => {
    const wrapper = mountStatus({ status: 'error' });
    expect(wrapper.get('[role="alert"]').text()).toContain('Could not save');
  });
});
