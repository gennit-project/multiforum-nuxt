import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import NotificationComponent from '@/components/NotificationComponent.vue';

const mountNotification = (props: Record<string, unknown> = {}) =>
  mount(NotificationComponent, {
    props: {
      show: true,
      title: 'Saved',
      ...props,
    },
    global: {
      stubs: {
        CheckCircleIcon: { template: '<svg class="check-icon" />' },
        XMarkIcon: { template: '<svg class="close-icon" />' },
        transition: { template: '<div><slot /></div>' },
      },
    },
  });

describe('NotificationComponent', () => {
  it('renders the title and live region when visible', () => {
    const wrapper = mountNotification();

    expect({
      text: wrapper.text(),
      live: wrapper.get('[aria-live="assertive"]').exists(),
    }).toEqual({
      text: expect.stringContaining('Saved'),
      live: true,
    });
  });

  it('renders the optional detail text when provided', () => {
    const wrapper = mountNotification({ detail: 'Changes persisted.' });
    expect(wrapper.text()).toContain('Changes persisted.');
  });

  it('hides the notification panel when show is false', () => {
    const wrapper = mountNotification({ show: false });
    expect(wrapper.text()).not.toContain('Saved');
  });

  it('emits closeNotification when the close button is clicked', async () => {
    const wrapper = mountNotification();
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('closeNotification')?.length).toBe(1);
  });
});
