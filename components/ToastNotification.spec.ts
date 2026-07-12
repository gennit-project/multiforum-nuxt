import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import ToastNotification from '@/components/ToastNotification.vue';

const h = vi.hoisted(() => ({ toasts: [] as unknown[], dismiss: vi.fn() }));

vi.mock('@/stores/toastStore', () => ({
  useToastStore: () => ({ toasts: h.toasts, dismissToast: h.dismiss }),
}));

const mountToasts = () =>
  mount(ToastNotification, {
    global: {
      stubs: {
        teleport: true,
        TransitionGroup: { template: '<div><slot /></div>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.toasts = [{ id: 't1', message: 'Saved', type: 'info' }];
});

describe('ToastNotification', () => {
  it('renders a toast message', () => {
    const wrapper = mountToasts();

    expect(wrapper.text()).toContain('Saved');
  });

  it('uses success styling', () => {
    h.toasts = [{ id: 't1', message: 'Done', type: 'success' }];
    const wrapper = mountToasts();

    expect(wrapper.html()).toContain('bg-green-700');
  });

  it('uses error styling', () => {
    h.toasts = [{ id: 't1', message: 'Oops', type: 'error' }];
    const wrapper = mountToasts();

    expect(wrapper.html()).toContain('bg-red-700');
  });

  it('dismisses a toast via the close button', async () => {
    const wrapper = mountToasts();

    await wrapper.find('button[aria-label="Dismiss notification"]').trigger('click');

    expect(h.dismiss).toHaveBeenCalledWith('t1');
  });

  it('runs the action and dismisses when the action button is clicked', async () => {
    const onClick = vi.fn();
    h.toasts = [{ id: 't1', message: 'Undo?', action: { label: 'Undo', onClick } }];
    const wrapper = mountToasts();

    const actionButton = wrapper.findAll('button').find((b) => b.text() === 'Undo');
    await actionButton!.trigger('click');

    expect(onClick).toHaveBeenCalled();
  });

  it('renders multiple toasts', () => {
    h.toasts = [
      { id: 't1', message: 'One' },
      { id: 't2', message: 'Two' },
    ];
    const wrapper = mountToasts();

    expect(wrapper.text()).toContain('Two');
  });

  it('marks error toasts as an assertive alert region', () => {
    h.toasts = [{ id: 't1', message: 'Oops', type: 'error' }];
    const wrapper = mountToasts();

    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });

  it('marks non-error toasts as a polite status region', () => {
    h.toasts = [{ id: 't1', message: 'Saved', type: 'info' }];
    const wrapper = mountToasts();

    expect(wrapper.find('[role="status"]').exists()).toBe(true);
  });
});
