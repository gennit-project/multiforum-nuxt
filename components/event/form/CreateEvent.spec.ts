import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CreateEvent from '@/components/event/form/CreateEvent.vue';
import { useUsername } from '@/composables/useAuthState';

const { mockUsername } = await vi.hoisted(async () => {
  const { ref } = await import('vue');
  return { mockUsername: ref('alice') };
});
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => mockUsername,
  setUsername: vi.fn(),
}));

const mockPush = vi.fn();
const mockMutate = vi.fn();
const onDoneCallbacks: Array<(data: any) => void> = [];
const channelResult = ref({
  channels: [
    {
      uniqueName: 'cats',
      eventsEnabled: true,
    },
  ],
});

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats' },
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: mockMutate,
    error: ref(null),
    onDone: (cb: any) => {
      onDoneCallbacks.push(cb);
    },
  })),
  useQuery: vi.fn(() => ({
    result: channelResult,
    loading: ref(false),
    error: ref(null),
  })),
}));

vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    issueNumber: ref(19),
    suspendedUntil: ref('2030-04-01T00:00:00.000Z'),
    suspendedIndefinitely: ref(false),
    channelId: ref('cats'),
  }),
}));

describe('CreateEvent', () => {
  beforeEach(() => {
    onDoneCallbacks.length = 0;
    mockPush.mockReset();
    mockMutate.mockReset();
    channelResult.value = {
      channels: [
        {
          uniqueName: 'cats',
          eventsEnabled: true,
        },
      ],
    };
    useUsername().value = 'alice';
  });

  function mountCreateEvent() {
    return mount(CreateEvent, {
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
          CreateEditEventFields: {
            name: 'CreateEditEventFields',
            props: ['suspensionIssueNumber', 'submitError'],
            template:
              '<button data-testid="submit" @click="$emit(\'submit\')"></button>',
          },
        },
      },
    });
  }

  it('does not show suspension info before submit attempt', () => {
    const wrapper = mountCreateEvent();

    const stub = wrapper.findComponent({ name: 'CreateEditEventFields' });
    expect(stub.props('suspensionIssueNumber')).toBeUndefined();
  });

  it('shows suspension info after submit attempt', async () => {
    const wrapper = mount(CreateEvent, {
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
          CreateEditEventFields: {
            name: 'CreateEditEventFields',
            props: ['suspensionIssueNumber'],
            template:
              '<button data-testid="submit" @click="$emit(\'submit\')"></button>',
          },
        },
      },
    });

    await wrapper.find('[data-testid="submit"]').trigger('click');
    await wrapper.vm.$nextTick();

    const stub = wrapper.findComponent({ name: 'CreateEditEventFields' });
    expect(stub.props('suspensionIssueNumber')).toBe(19);
  });

  it('sets submit error when event id is missing', async () => {
    const wrapper = mount(CreateEvent, {
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
          CreateEditEventFields: {
            name: 'CreateEditEventFields',
            props: ['submitError'],
            template: '<div />',
          },
        },
      },
    });

    const onDone = onDoneCallbacks[0];
    onDone({
      data: {
        createEventWithChannelConnections: [{}],
      },
    });

    await wrapper.vm.$nextTick();

    const stub = wrapper.findComponent({ name: 'CreateEditEventFields' });
    expect(stub.props('submitError')).toContain('Unable to create event');
  });

  it('shows a submit error when routed forum events are disabled', () => {
    channelResult.value = {
      channels: [
        {
          uniqueName: 'cats',
          eventsEnabled: false,
        },
      ],
    };

    const wrapper = mountCreateEvent();

    const stub = wrapper.findComponent({ name: 'CreateEditEventFields' });
    expect(stub.props('submitError')).toContain('events are not enabled');
  });

  it('does not submit when routed forum events are disabled', async () => {
    channelResult.value = {
      channels: [
        {
          uniqueName: 'cats',
          eventsEnabled: false,
        },
      ],
    };
    const wrapper = mountCreateEvent();

    await wrapper.find('[data-testid="submit"]').trigger('click');

    expect(mockMutate).not.toHaveBeenCalled();
  });
});
