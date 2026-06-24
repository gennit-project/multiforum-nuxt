import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import MarkAsAnsweredButton from '@/components/discussion/detail/MarkAsAnsweredButton.vue';

const h = vi.hoisted(() => ({
  markAnswered: vi.fn(() => Promise.resolve()),
  answeredLoading: null as unknown,
  answeredError: null as unknown,
  markUnanswered: vi.fn(() => Promise.resolve()),
  unansweredLoading: null as unknown,
  unansweredError: null as unknown,
  index: { n: 0 },
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => {
    const i = h.index.n++;
    return i === 0
      ? { mutate: h.markAnswered, loading: h.answeredLoading, error: h.answeredError }
      : { mutate: h.markUnanswered, loading: h.unansweredLoading, error: h.unansweredError };
  },
}));

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(MarkAsAnsweredButton, {
    props: { answered: false, channelId: 'cats', discussionId: 'd1', ...props },
    global: {
      stubs: {
        CheckCircleIcon: true,
        LoadingSpinner: { name: 'LoadingSpinner', template: '<span class="spinner" />' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.index.n = 0;
  h.markAnswered = vi.fn(() => Promise.resolve());
  h.answeredLoading = ref(false);
  h.answeredError = ref(null);
  h.markUnanswered = vi.fn(() => Promise.resolve());
  h.unansweredLoading = ref(false);
  h.unansweredError = ref(null);
});

describe('MarkAsAnsweredButton unanswered', () => {
  it('shows the Mark as Answered button', () => {
    const wrapper = mountButton({ answered: false });

    expect(wrapper.text()).toContain('Mark as Answered');
  });

  it('marks as answered on click', async () => {
    const wrapper = mountButton({ answered: false });

    await wrapper.get('button').trigger('click');

    expect(h.markAnswered).toHaveBeenCalledWith({ channelId: 'cats', discussionId: 'd1' });
  });

  it('shows a spinner while marking', () => {
    h.answeredLoading = ref(true);
    const wrapper = mountButton({ answered: false });

    expect(wrapper.find('.spinner').exists()).toBe(true);
  });
});

describe('MarkAsAnsweredButton answered', () => {
  it('shows the Mark as Unanswered button', () => {
    const wrapper = mountButton({ answered: true });

    expect(wrapper.text()).toContain('Mark as Unanswered');
  });

  it('marks as unanswered on click', async () => {
    const wrapper = mountButton({ answered: true });

    await wrapper.get('button').trigger('click');

    expect(h.markUnanswered).toHaveBeenCalledWith({ channelId: 'cats', discussionId: 'd1' });
  });

  it('emits mark-unanswered after unanswering', async () => {
    const wrapper = mountButton({ answered: true });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('mark-unanswered')).toBeTruthy();
  });
});

describe('MarkAsAnsweredButton errors', () => {
  it('shows an error banner on mutation error', () => {
    h.answeredError = ref({ message: 'boom' });
    const wrapper = mountButton({ answered: false });

    expect(wrapper.find('.err').text()).toContain('boom');
  });
});
