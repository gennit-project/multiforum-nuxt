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

  // Drives the form into a multi-date / recurring state and submits, exercising
  // the series-creation path (issue #229).
  async function submitWithFormValues(
    overrides: Record<string, unknown>
  ) {
    const wrapper = mountCreateEvent();
    const fields = wrapper.findComponent({ name: 'CreateEditEventFields' });
    fields.vm.$emit('updateFormValues', {
      title: 'Weekly meetup',
      selectedChannels: ['cats'],
      ...overrides,
    });
    await wrapper.vm.$nextTick();
    await wrapper.find('[data-testid="submit"]').trigger('click');
    return wrapper;
  }

  it('submits the manually-entered occurrences as a series for "multiple" date mode', async () => {
    await submitWithFormValues({
      dateMode: 'multiple',
      occurrences: [
        { startTime: '2030-01-01T18:00:00.000Z', endTime: '2030-01-01T21:00:00.000Z' },
        { startTime: '2030-01-08T18:00:00.000Z', endTime: '2030-01-08T21:00:00.000Z' },
      ],
    });

    expect(mockMutate).toHaveBeenCalledWith({
      input: expect.objectContaining({
        title: 'Weekly meetup',
        channelConnections: ['cats'],
        occurrences: [
          { startTime: '2030-01-01T18:00:00.000Z', endTime: '2030-01-01T21:00:00.000Z' },
          { startTime: '2030-01-08T18:00:00.000Z', endTime: '2030-01-08T21:00:00.000Z' },
        ],
      }),
    });
  });

  it('generates occurrences from the repeat pattern for "recurring" date mode', async () => {
    await submitWithFormValues({
      dateMode: 'recurring',
      startTime: '2030-01-01T18:00:00.000Z',
      endTime: '2030-01-01T21:00:00.000Z',
      repeatPattern: {
        type: 'WEEKLY',
        count: 1,
        endType: 'AFTER_COUNT',
        endCount: 3,
      },
    });

    expect(mockMutate.mock.calls[0][0].input.occurrences).toHaveLength(3);
  });

  it('uses the single-event mutation (occurrences nested in an array) for "single" date mode', async () => {
    await submitWithFormValues({
      dateMode: 'single',
      startTime: '2030-01-01T18:00:00.000Z',
      endTime: '2030-01-01T21:00:00.000Z',
    });

    expect(Array.isArray(mockMutate.mock.calls[0][0].input)).toBe(true);
  });

  // Date-range mode (#232): one occurrence per day in each range, at that
  // range's hours.
  it('expands a date range into one occurrence per day for "dateRange" mode', async () => {
    // Heard Museum "Lumenous": Dec 16–18, 6–9pm (three nights).
    await submitWithFormValues({
      dateMode: 'dateRange',
      dateRangeGroups: [
        {
          startDate: '2030-12-16',
          endDate: '2030-12-18',
          startTimeOfDay: '18:00',
          endTimeOfDay: '21:00',
        },
      ],
    });

    expect(mockMutate.mock.calls[0][0].input.occurrences).toHaveLength(3);
  });

  it('expands multiple date ranges with distinct per-range hours (expo style)', async () => {
    // Expo hours: day 1 12:00–19:30; days 2–4 09:00–17:00; day 5 09:00–12:00.
    await submitWithFormValues({
      dateMode: 'dateRange',
      dateRangeGroups: [
        { startDate: '2030-03-06', endDate: '2030-03-06', startTimeOfDay: '12:00', endTimeOfDay: '19:30' },
        { startDate: '2030-03-07', endDate: '2030-03-09', startTimeOfDay: '09:00', endTimeOfDay: '17:00' },
        { startDate: '2030-03-10', endDate: '2030-03-10', startTimeOfDay: '09:00', endTimeOfDay: '12:00' },
      ],
    });

    const occ = mockMutate.mock.calls[0][0].input.occurrences;
    // 1 + 3 + 1 = 5 occurrences, sorted, with the first day's distinct hours.
    expect({
      count: occ.length,
      firstStartHour: occ[0].startTime.slice(11, 16),
      secondStartHour: occ[1].startTime.slice(11, 16),
    }).toEqual({ count: 5, firstStartHour: '12:00', secondStartHour: '09:00' });
  });
});
