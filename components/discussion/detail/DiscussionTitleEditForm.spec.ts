import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import DiscussionTitleEditForm from '@/components/discussion/detail/DiscussionTitleEditForm.vue';

const h = vi.hoisted(() => ({
  answeredResult: null as unknown,
  answeredLoading: null as unknown,
  answeredError: null as unknown,
  discussionResult: null as unknown,
  discussionLoading: null as unknown,
  discussionError: null as unknown,
  onResult: undefined as undefined | ((r: unknown) => void),
  updateDiscussion: vi.fn(),
  updateError: { value: null as unknown },
  onDone: undefined as undefined | (() => void),
  username: null as unknown,
  route: null as unknown,
  callIndex: { n: 0 },
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => {
    h.callIndex.n++;
    if (h.callIndex.n === 1)
      return {
        result: h.answeredResult,
        error: h.answeredError,
        loading: h.answeredLoading,
      };
    return {
      result: h.discussionResult,
      error: h.discussionError,
      loading: h.discussionLoading,
      onResult: (cb: (r: unknown) => void) => {
        h.onResult = cb;
      },
    };
  },
  useMutation: () => ({
    mutate: h.updateDiscussion,
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

const discussion = () => ({
  id: 'd1',
  title: 'My Discussion',
  Author: { username: 'alice' },
  createdAt: '2024-03-30T00:00:00Z',
});

const mountForm = () =>
  mount(DiscussionTitleEditForm, {
    global: {
      stubs: {
        RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
        // Apollo/Pinia-backed; not relevant to the title-form behavior here.
        AddToDiscussionFavorites: true,
        TextInput: {
          name: 'TextInput',
          props: ['value'],
          emits: ['update'],
          // onClickEdit focuses the ref in nextTick; expose focus so it
          // doesn't throw an unhandled rejection.
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
        InfoBanner: { name: 'InfoBanner', props: ['text'], template: '<div class="info" />' },
        CharCounter: { props: ['current', 'max'], template: '<div />' },
        CheckCircleIcon: true,
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
  h.callIndex.n = 0;
  h.answeredResult = ref({ discussionChannels: [{ answered: false }] });
  h.answeredLoading = ref(false);
  h.answeredError = ref(null);
  h.discussionResult = ref({ discussions: [discussion()] });
  h.discussionLoading = ref(false);
  h.discussionError = ref(null);
  h.onResult = undefined;
  h.updateError = { value: null };
  h.onDone = undefined;
  h.username = ref('alice');
  h.route = {
    params: { forumId: 'cats', discussionId: 'd1' },
    name: 'forums-forumId-discussions-discussionId',
  };
});

describe('DiscussionTitleEditForm display', () => {
  it('shows skeletons while loading', () => {
    h.discussionLoading = ref(true);
    h.discussionResult = ref(null);
    const wrapper = mountForm();

    expect(wrapper.find('.skeleton').exists()).toBe(true);
  });

  it('shows the discussion title', () => {
    const wrapper = mountForm();

    expect(wrapper.get('h1').text()).toBe('My Discussion');
  });

  it('shows a not-found message when the discussion is missing', () => {
    h.discussionResult = ref({ discussions: [] });
    const wrapper = mountForm();

    expect(wrapper.find('.info').exists()).toBe(true);
  });

  it('shows an error banner on query error', () => {
    h.discussionError = ref({ message: 'boom' });
    const wrapper = mountForm();

    expect(wrapper.find('.err').exists()).toBe(true);
  });

  it('shows the answered badge when the discussion is answered', () => {
    h.answeredResult = ref({ discussionChannels: [{ answered: true }] });
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('Answered');
  });
});

describe('DiscussionTitleEditForm author actions', () => {
  it('shows the Edit button to the author', () => {
    const wrapper = mountForm();

    expect(button(wrapper, 'Edit')).toBeTruthy();
  });

  it('hides the Edit button from non-authors', () => {
    h.username = ref('bob');
    const wrapper = mountForm();

    expect(button(wrapper, 'Edit')).toBeUndefined();
  });

  it('shows the New Discussion link on a discussion page', () => {
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('New Discussion');
  });

  it('shows the New Upload link on a download page', () => {
    h.route = {
      params: { forumId: 'cats', discussionId: 'd1' },
      name: 'forums-forumId-downloads-discussionId',
    };
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('New Upload');
  });
});

describe('DiscussionTitleEditForm edit flow', () => {
  it('enters edit mode on Edit click', async () => {
    const wrapper = mountForm();

    await button(wrapper, 'Edit')!.trigger('click');

    expect(wrapper.findComponent({ name: 'TextInput' }).exists()).toBe(true);
  });

  it('saves the new title', async () => {
    const wrapper = mountForm();
    await button(wrapper, 'Edit')!.trigger('click');

    await button(wrapper, 'Save')!.trigger('click');

    expect(h.updateDiscussion).toHaveBeenCalled();
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

    h.onResult?.({ data: { discussions: [{ title: 'Loaded Title' }] } });
    await button(wrapper, 'Edit')!.trigger('click');

    expect(wrapper.getComponent({ name: 'TextInput' }).props('value')).toBe(
      'Loaded Title'
    );
  });
});
