import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CreateEvent from '@/components/event/form/CreateEvent.vue';
import { useUsername } from '@/composables/useAuthState';
import {
  LAS_NOCHES_AT_DBG,
  LUMENOUS_AT_HEARD,
  SVM_HOLIDAY_MARKET,
  DOWNTOWN_FARMERS_MARKET,
  type ExampleEvent,
} from '@/tests/fixtures/exampleEvents';

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

  // Drives the form into the given event's shape and submits, exercising the
  // series-creation path (issue #229). Uses realistic example events.
  async function submitExampleEvent(event: ExampleEvent) {
    const wrapper = mountCreateEvent();
    const fields = wrapper.findComponent({ name: 'CreateEditEventFields' });
    fields.vm.$emit('updateFormValues', {
      title: event.title,
      selectedChannels: ['cats'],
      dateMode: event.dateMode,
      ...(event.startTime ? { startTime: event.startTime } : {}),
      ...(event.endTime ? { endTime: event.endTime } : {}),
      ...(event.occurrences ? { occurrences: event.occurrences } : {}),
      ...(event.repeatPattern ? { repeatPattern: event.repeatPattern } : {}),
    });
    await wrapper.vm.$nextTick();
    await wrapper.find('[data-testid="submit"]').trigger('click');
    return wrapper;
  }

  it.each([LUMENOUS_AT_HEARD, SVM_HOLIDAY_MARKET])(
    'submits the manually-entered occurrences as a series for "$title"',
    async (event) => {
      await submitExampleEvent(event);

      expect(mockMutate).toHaveBeenCalledWith({
        input: expect.objectContaining({
          title: event.title,
          channelConnections: ['cats'],
          occurrences: event.occurrences,
        }),
      });
    }
  );

  it('generates a season of occurrences from the repeat pattern (recurring)', async () => {
    await submitExampleEvent(DOWNTOWN_FARMERS_MARKET);

    expect(mockMutate.mock.calls[0][0].input.occurrences).toHaveLength(
      DOWNTOWN_FARMERS_MARKET.repeatPattern!.endCount
    );
  });

  it('uses the single-event mutation (occurrences nested in an array) for a single-date event', async () => {
    await submitExampleEvent(LAS_NOCHES_AT_DBG);

    expect(Array.isArray(mockMutate.mock.calls[0][0].input)).toBe(true);
  });
});
