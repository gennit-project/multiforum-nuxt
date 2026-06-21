import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import InlineCommentForm from './InlineCommentForm.vue';

const createCommentError = ref<{ message: string } | null>(null);
const suspensionIssueNumber = ref<number | null>(null);
const suspensionChannelId = ref('');

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    query: {},
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref(null),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    error: createCommentError,
    onDone: vi.fn(),
  }),
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

describe('InlineCommentForm', () => {
  beforeEach(() => {
    createCommentError.value = { message: 'Forbidden' };
    suspensionIssueNumber.value = null;
    suspensionChannelId.value = '';
  });

  const buildWrapper = () =>
    mount(InlineCommentForm, {
      props: {
        discussionChannel: {
          id: 'discussion-channel-1',
          discussionId: 'discussion-1',
          channelUniqueName: 'cats',
        },
      },
      global: {
        stubs: {
          ErrorBanner: {
            template: '<div data-testid="error-banner">{{ text }}</div>',
            props: ['text'],
          },
          SuspensionNotice: {
            template: '<div data-testid="suspension-notice"></div>',
          },
          RequireAuth: {
            template: '<div><slot name="has-auth" /></div>',
          },
          LoadingSpinner: { template: '<div />' },
        },
      },
    });

  it('suppresses the create error banner when suspension context is known', async () => {
    suspensionIssueNumber.value = 12;
    suspensionChannelId.value = 'cats';

    const wrapper = buildWrapper();

    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(false);
  });

  it('shows the create error banner when no suspension context is available', async () => {
    const wrapper = buildWrapper();

    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(true);
  });
});
