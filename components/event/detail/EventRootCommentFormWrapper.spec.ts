import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import EventRootCommentFormWrapper from './EventRootCommentFormWrapper.vue';

const onDoneCallbacks: Array<(result: any) => void> = [];
const suspensionIssueNumber = ref<number | null>(null);
const suspensionChannelId = ref('');

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats' },
    query: {},
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref(null),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    error: ref(null),
    onDone: (cb: (result: any) => void) => {
      onDoneCallbacks.push(cb);
    },
  }),
}));

vi.mock('@/cache', () => ({
  usernameVar: { value: 'alice' },
}));

vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    issueNumber: suspensionIssueNumber,
    suspendedUntil: ref('2030-01-01T00:00:00.000Z'),
    suspendedIndefinitely: ref(false),
    channelId: suspensionChannelId,
  }),
}));

describe('EventRootCommentFormWrapper', () => {
  beforeEach(() => {
    onDoneCallbacks.length = 0;
    suspensionIssueNumber.value = null;
    suspensionChannelId.value = '';
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const buildWrapper = () =>
    mount(EventRootCommentFormWrapper, {
      props: {
        previousOffset: 0,
        event: {
          id: 'event-1',
        },
      },
      global: {
        stubs: {
          ErrorBanner: {
            template: '<div data-testid="error-banner">{{ text }}</div>',
            props: ['text'],
          },
          CreateRootCommentForm: {
            template:
              '<button data-testid="submit" @click="$emit(\'handle-create-comment\')"></button>',
          },
        },
      },
    });

  it('suppresses the permission error banner when suspension context is known', async () => {
    suspensionIssueNumber.value = 34;
    suspensionChannelId.value = 'cats';

    const wrapper = buildWrapper();

    await wrapper.find('[data-testid="submit"]').trigger('click');
    onDoneCallbacks[0]?.({
      errors: [{ message: 'Forbidden' }],
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(false);
  });

  it('shows the permission error banner when no suspension context is available', async () => {
    const wrapper = buildWrapper();

    await wrapper.find('[data-testid="submit"]').trigger('click');
    onDoneCallbacks[0]?.({
      errors: [{ message: 'Forbidden' }],
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(true);
  });
});
