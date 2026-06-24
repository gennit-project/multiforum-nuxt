import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import EventTitleEditForm from '@/components/event/detail/EventTitleEditForm.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  loading: null as unknown,
  error: null as unknown,
  onResult: undefined as undefined | ((r: unknown) => void),
  updateEvent: vi.fn(),
  updateError: { value: null as unknown },
  onDone: undefined as undefined | (() => void),
  username: null as unknown,
  route: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.result,
    error: h.error,
    loading: h.loading,
    onResult: (cb: (r: unknown) => void) => {
      h.onResult = cb;
    },
  }),
  useMutation: () => ({
    mutate: h.updateEvent,
    error: h.updateError,
    loading: ref(false),
    onDone: (cb: () => void) => {
      h.onDone = cb;
    },
  }),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));
vi.mock('@/composables/useTheme', () => ({ useAppTheme: () => ({ theme: ref('light') }) }));
vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref(''),
  useUsername: () => h.username,
}));

const eventData = (overrides: Record<string, unknown> = {}) => ({
  id: 'ev1',
  title: 'My Event',
  createdAt: '2024-03-30T00:00:00Z',
  Poster: { username: 'alice' },
  ...overrides,
});

const mountForm = () =>
  mount(EventTitleEditForm, {
    global: {
      stubs: {
        RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
        TextInput: {
          name: 'TextInput',
          props: ['value'],
          emits: ['update'],
          // onClickEdit focuses this ref in nextTick — expose focus to avoid
          // an unhandled rejection.
          methods: { focus() {} },
          template: '<input />',
        },
        PrimaryButton: {
          name: 'PrimaryButton',
          props: ['disabled', 'loading', 'label'],
          emits: ['click'],
          template: '<button @click="$emit(\'click\')">{{ label }}</button>',
        },
        GenericButton: {
          name: 'GenericButton',
          props: ['text'],
          emits: ['click'],
          template: '<button @click="$emit(\'click\')">{{ text }}</button>',
        },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err" />' },
        CharCounter: { props: ['current', 'max'], template: '<div />' },
        'v-skeleton-loader': { template: '<div class="skeleton" />' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

const button = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text() === text);

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref({ events: [eventData()] });
  h.loading = ref(false);
  h.error = ref(null);
  h.onResult = undefined;
  h.updateError = { value: null };
  h.onDone = undefined;
  h.username = ref('alice');
  h.route = { params: { forumId: 'cats', eventId: 'ev1' } };
});

describe('EventTitleEditForm display', () => {
  it('shows a skeleton while loading', () => {
    h.loading = ref(true);
    h.result = ref(null);
    const wrapper = mountForm();

    expect(wrapper.find('.skeleton').exists()).toBe(true);
  });

  it('shows the event title', () => {
    const wrapper = mountForm();

    expect(wrapper.get('h1').text()).toBe('My Event');
  });

  it('shows [Deleted] when the event is missing', () => {
    h.result = ref({ events: [] });
    const wrapper = mountForm();

    expect(wrapper.get('h1').text()).toBe('[Deleted]');
  });

  it('shows the poster and date', () => {
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('posted this event');
  });

  it('shows an error banner on query error', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountForm();

    expect(wrapper.find('.err').exists()).toBe(true);
  });
});

describe('EventTitleEditForm author actions', () => {
  it('shows the Edit button to the poster', () => {
    const wrapper = mountForm();

    expect(button(wrapper, 'Edit')).toBeTruthy();
  });

  it('hides the Edit button from non-posters', () => {
    h.username = ref('bob');
    const wrapper = mountForm();

    expect(button(wrapper, 'Edit')).toBeUndefined();
  });

  it('always shows the New Event link', () => {
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('New Event');
  });
});

describe('EventTitleEditForm edit flow', () => {
  it('enters edit mode on Edit click', async () => {
    const wrapper = mountForm();

    await button(wrapper, 'Edit')!.trigger('click');

    expect(wrapper.findComponent({ name: 'TextInput' }).exists()).toBe(true);
  });

  it('saves the new title', async () => {
    const wrapper = mountForm();
    await button(wrapper, 'Edit')!.trigger('click');

    await button(wrapper, 'Save')!.trigger('click');

    expect(h.updateEvent).toHaveBeenCalled();
  });

  it('leaves edit mode when the update completes', async () => {
    const wrapper = mountForm();
    await button(wrapper, 'Edit')!.trigger('click');

    h.onDone?.();
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'TextInput' }).exists()).toBe(false);
  });

  it('exits edit mode on Cancel', async () => {
    const wrapper = mountForm();
    await button(wrapper, 'Edit')!.trigger('click');

    await button(wrapper, 'Cancel')!.trigger('click');

    expect(wrapper.findComponent({ name: 'TextInput' }).exists()).toBe(false);
  });

  it('syncs the form title from the query result', async () => {
    const wrapper = mountForm();

    h.onResult?.({ data: { events: [{ title: 'Loaded Event' }] } });
    await button(wrapper, 'Edit')!.trigger('click');

    expect(wrapper.getComponent({ name: 'TextInput' }).props('value')).toBe(
      'Loaded Event'
    );
  });
});
