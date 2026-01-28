import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CreateDiscussion from '@/components/discussion/form/CreateDiscussion.vue';
import { usernameVar } from '@/cache';

const mockPush = vi.fn();
const onDoneCallbacks: Array<(data: any) => void> = [];

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats' },
    query: {},
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    error: ref(null),
    onDone: (cb: any) => {
      onDoneCallbacks.push(cb);
    },
  })),
  useQuery: vi.fn(() => ({
    result: ref(null),
    loading: ref(false),
    error: ref(null),
  })),
}));

vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    issueNumber: ref(55),
    suspendedUntil: ref('2030-05-01T00:00:00.000Z'),
    suspendedIndefinitely: ref(false),
    channelId: ref('cats'),
  }),
}));

describe('CreateDiscussion', () => {
  beforeEach(() => {
    onDoneCallbacks.length = 0;
    mockPush.mockReset();
    usernameVar.value = 'alice';
  });

  it('only shows suspension info after submit attempt', async () => {
    const wrapper = mount(CreateDiscussion, {
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot /></div>' },
          CreateEditDiscussionFields: {
            name: 'CreateEditDiscussionFields',
            props: ['suspensionIssueNumber'],
            template:
              '<button data-testid="submit" @click="$emit(\'submit\')"></button>',
          },
        },
      },
    });

    const stub = wrapper.findComponent({ name: 'CreateEditDiscussionFields' });
    expect(stub.props('suspensionIssueNumber')).toBe(null);

    await wrapper.find('[data-testid="submit"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(stub.props('suspensionIssueNumber')).toBe(55);
  });

  it('sets submit error when discussion id is missing', async () => {
    const wrapper = mount(CreateDiscussion, {
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot /></div>' },
          CreateEditDiscussionFields: {
            name: 'CreateEditDiscussionFields',
            props: ['submitError'],
            template: '<div />',
          },
        },
      },
    });

    const onDone = onDoneCallbacks[0];
    onDone({
      data: {
        createDiscussionWithChannelConnections: [],
      },
    });

    await wrapper.vm.$nextTick();

    const stub = wrapper.findComponent({ name: 'CreateEditDiscussionFields' });
    expect(stub.props('submitError')).toContain('Unable to create discussion');
  });
});
