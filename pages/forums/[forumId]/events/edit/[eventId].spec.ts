import { beforeEach, describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h as createElement } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import CreateEditEventFields from '@/components/event/form/CreateEditEventFields.vue';
import EditScopeModal from '@/components/event/form/EditScopeModal.vue';

const mockState = vi.hoisted(() => ({
  routeParams: { forumId: 'cats' as unknown, eventId: 'e1' as unknown },
  routerPush: vi.fn(),
  queryResultCallback: null as null | ((value: unknown) => void),
  updateEvent: vi.fn(),
  updateSeries: vi.fn(),
  updateDone: null as null | (() => void),
  seriesDone: null as null | (() => void),
  updateError: null as unknown as { value: unknown },
  seriesError: null as unknown as { value: unknown },
  updateLoading: null as unknown as { value: boolean },
  seriesLoading: null as unknown as { value: boolean },
}));

mockState.updateError = ref(null);
mockState.seriesError = ref(null);
mockState.updateLoading = ref(false);
mockState.seriesLoading = ref(false);

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: mockState.routeParams }),
  useRouter: () => ({ push: mockState.routerPush }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref('mod-1'),
}));

const RequireAuthStub = defineComponent({
  props: { owners: { type: Array, default: () => [] } },
  setup(_props, { slots }) {
    return () => createElement('div', slots['has-auth']?.());
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const mockedUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;

const baseEvent = {
  id: 'e1',
  title: 'Meetup',
  description: '',
  Tags: [{ text: 'old-tag' }],
  EventChannels: [{ channelUniqueName: 'cats' }, { channelUniqueName: 'dogs' }],
  Poster: { username: 'owner' },
  startTime: '2024-01-01T18:00:00Z',
  endTime: '2024-01-01T20:00:00Z',
  canceled: false,
};

const mountWith = async (
  event: Record<string, unknown> = baseEvent,
  options: { loading?: boolean; queryError?: unknown } = {}
) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ events: [event] }),
    onResult: (callback: (value: unknown) => void) => {
      mockState.queryResultCallback = callback;
    },
    loading: ref(options.loading ?? false),
    error: ref(options.queryError ?? null),
  });
  mockedUseMutation
    .mockReturnValueOnce({
      mutate: mockState.updateEvent,
      loading: mockState.updateLoading,
      error: mockState.updateError,
      onDone: (callback: () => void) => {
        mockState.updateDone = callback;
      },
    })
    .mockReturnValueOnce({
      mutate: mockState.updateSeries,
      loading: mockState.seriesLoading,
      error: mockState.seriesError,
      onDone: (callback: () => void) => {
        mockState.seriesDone = callback;
      },
    });
  const Page = (await import('./[eventId].vue')).default;
  return shallowMount(Page, {
    global: { stubs: { RequireAuth: RequireAuthStub } },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockState.routeParams = { forumId: 'cats', eventId: 'e1' };
  mockState.queryResultCallback = null;
  mockState.updateDone = null;
  mockState.seriesDone = null;
  mockState.updateError.value = null;
  mockState.seriesError.value = null;
  mockState.updateLoading.value = false;
  mockState.seriesLoading.value = false;
});

describe('event edit page', () => {
  it('renders the event edit form for authenticated users', async () => {
    const wrapper = await mountWith();
    expect(wrapper.findComponent(CreateEditEventFields).exists()).toBe(true);
  });

  it('provides the event owner to the auth boundary', async () => {
    const wrapper = await mountWith();

    expect(wrapper.findComponent(RequireAuthStub).props('owners')).toEqual([
      'owner',
    ]);
  });

  it('replaces default form values when the query finishes', async () => {
    const wrapper = await mountWith({}, { loading: true });

    mockState.queryResultCallback?.({
      loading: false,
      data: { events: [baseEvent] },
    });
    await wrapper.vm.$nextTick();

    expect(
      wrapper.findComponent(CreateEditEventFields).props('formValues').title
    ).toBe('Meetup');
  });

  it('does not replace form values for an intermediate loading result', async () => {
    const wrapper = await mountWith({}, { loading: true });
    const initialValues = wrapper
      .findComponent(CreateEditEventFields)
      .props('formValues');

    mockState.queryResultCallback?.({
      loading: true,
      data: { events: [baseEvent] },
    });

    expect(
      wrapper.findComponent(CreateEditEventFields).props('formValues')
    ).toBe(initialValues);
  });

  it('updates one event with channel and tag changes', async () => {
    const wrapper = await mountWith();
    const form = wrapper.findComponent(CreateEditEventFields);
    form.vm.$emit('update-form-values', {
      selectedChannels: ['cats', 'birds'],
      selectedTags: ['new-tag'],
      latitude: 33.45,
      longitude: -112.07,
      locationName: 'Library',
      address: '1 Main St',
    });
    await wrapper.vm.$nextTick();
    form.vm.$emit('submit');

    const variables = mockState.updateEvent.mock.calls[0]?.[0];
    expect({
      channelConnections: variables.channelConnections,
      channelDisconnections: variables.channelDisconnections,
      tagConnection:
        variables.updateEventInput.Tags[0].connectOrCreate[0].where.node.text,
      tagDisconnection:
        variables.updateEventInput.Tags[0].disconnect[0].where.node.text,
      location: variables.updateEventInput.location,
    }).toEqual({
      channelConnections: ['cats', 'birds'],
      channelDisconnections: ['dogs'],
      tagConnection: 'new-tag',
      tagDisconnection: 'old-tag',
      location: { latitude: 33.45, longitude: -112.07 },
    });
  });

  it('opens the scope modal instead of immediately updating a series event', async () => {
    const wrapper = await mountWith({
      ...baseEvent,
      EventSeries: { id: 'series-1' },
    });

    wrapper.findComponent(CreateEditEventFields).vm.$emit('submit');
    await wrapper.vm.$nextTick();

    expect({
      modalOpen: wrapper.findComponent(EditScopeModal).props('isOpen'),
      directUpdates: mockState.updateEvent.mock.calls.length,
    }).toEqual({ modalOpen: true, directUpdates: 0 });
  });

  it('updates a series using the selected edit scope', async () => {
    const wrapper = await mountWith({
      ...baseEvent,
      EventSeries: { id: 'series-1' },
    });
    wrapper.findComponent(CreateEditEventFields).vm.$emit('submit');
    await wrapper.vm.$nextTick();

    wrapper.findComponent(EditScopeModal).vm.$emit('confirm', 'future');

    expect(mockState.updateSeries).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'e1',
        scope: 'future',
      })
    );
  });

  it('closes the series edit modal without updating', async () => {
    const wrapper = await mountWith({
      ...baseEvent,
      EventSeries: { id: 'series-1' },
    });
    wrapper.findComponent(CreateEditEventFields).vm.$emit('submit');
    await wrapper.vm.$nextTick();
    wrapper.findComponent(EditScopeModal).vm.$emit('close');
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(EditScopeModal).props('isOpen')).toBe(false);
  });

  it('redirects to the selected channel after a successful update', async () => {
    await mountWith();

    mockState.updateDone?.();

    expect(mockState.routerPush).toHaveBeenCalledWith({
      name: 'forums-forumId-events-eventId',
      params: { forumId: 'cats', eventId: 'e1' },
    });
  });

  it('does not redirect after a failed series update', async () => {
    mockState.seriesError.value = new Error('failed');
    await mountWith({ ...baseEvent, EventSeries: { id: 'series-1' } });

    mockState.seriesDone?.();

    expect(mockState.routerPush).not.toHaveBeenCalled();
  });

  it('combines mutation loading and error state for the form', async () => {
    mockState.seriesLoading.value = true;
    mockState.updateError.value = new Error('failed');
    const wrapper = await mountWith();
    const form = wrapper.findComponent(CreateEditEventFields);

    expect({
      loading: form.props('updateEventLoading'),
      error: (form.props('updateEventError') as Error).message,
    }).toEqual({ loading: true, error: 'failed' });
  });
});
