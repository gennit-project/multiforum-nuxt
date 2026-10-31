import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import EventRootCommentFormWrapper from './EventRootCommentFormWrapper.vue';
import {
  GetEventCommentsDocument,
  type CreateCommentMutation,
} from '@/__generated__/operations';
import { makeEventDetail } from '@/tests/utils/eventCommentFixtures';
const mockMutation = vi.hoisted(() => vi.fn());

type CreateCommentsResult = {
  data?: CreateCommentMutation;
  errors?: Array<{ message: string }>;
};

const onDoneCallbacks: Array<(result: CreateCommentsResult) => void> = [];
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
  useMutation: (document, options) => {
    mockMutation(document, options);
    return {
      mutate: vi.fn(),
      error: ref(null),
      onDone: (cb: (result: CreateCommentsResult) => void) => {
        onDoneCallbacks.push(cb);
      },
    };
  },
}));

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return { useUsername: () => ref('alice'), setUsername: vi.fn() };
});

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
        event: makeEventDetail({ id: 'event-1' }),
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
  it('captures the generated root-read variables at mutation start', async () => {
    const wrapper = buildWrapper();
    const options = mockMutation.mock.calls.at(-1)![1];
    const first = options().refetchQueries[0];
    await wrapper.setProps({ event: makeEventDetail({ id: 'event-2' }) });
    expect({
      document: first.query,
      first: first.variables,
      next: options().refetchQueries[0].variables,
    }).toEqual({
      document: GetEventCommentsDocument,
      first: { eventId: 'event-1', limit: 50, offset: 0, sort: 'hot' },
      next: { eventId: 'event-2', limit: 50, offset: 0, sort: 'hot' },
    });
  });
});
