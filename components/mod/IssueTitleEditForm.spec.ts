import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import IssueTitleEditForm from '@/components/mod/IssueTitleEditForm.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  loading: null as unknown,
  error: null as unknown,
  onResult: undefined as undefined | ((r: unknown) => void),
  updateIssue: vi.fn(),
  updateError: { value: null as unknown },
  onDone: undefined as undefined | (() => void),
  modName: null as unknown,
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
    mutate: h.updateIssue,
    error: h.updateError,
    loading: ref(false),
    onDone: (cb: () => void) => {
      h.onDone = cb;
    },
  }),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));
vi.mock('@/composables/useTheme', () => ({ useAppTheme: () => ({ theme: ref('light') }) }));
vi.mock('@/composables/useAuthState', () => ({ useModProfileName: () => h.modName }));

const issue = (overrides: Record<string, unknown> = {}) => ({
  id: 'i1',
  title: 'My Issue',
  isOpen: true,
  createdAt: '2024-03-30T00:00:00Z',
  Author: { displayName: 'mod1' },
  ...overrides,
});

const mountForm = () =>
  mount(IssueTitleEditForm, {
    global: {
      stubs: {
        RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
        TextInput: { name: 'TextInput', props: ['value'], emits: ['update'], template: '<input />' },
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
        IssueBadge: { name: 'IssueBadge', props: ['issue'], template: '<div class="badge" />' },
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
  h.result = ref({ issues: [issue()] });
  h.loading = ref(false);
  h.error = ref(null);
  h.onResult = undefined;
  h.updateError = { value: null };
  h.onDone = undefined;
  h.modName = ref('mod1');
  h.route = { params: { forumId: 'cats', issueNumber: '5' } };
});

describe('IssueTitleEditForm display', () => {
  it('shows skeletons while loading', () => {
    h.loading = ref(true);
    h.result = ref(null);
    const wrapper = mountForm();

    expect(wrapper.find('.skeleton').exists()).toBe(true);
  });

  it('shows the issue title', () => {
    const wrapper = mountForm();

    expect(wrapper.get('h2').text()).toBe('My Issue');
  });

  it('shows a not-found message when the issue is missing', () => {
    h.result = ref({ issues: [] });
    const wrapper = mountForm();

    expect(wrapper.get('h2').text()).toContain("Couldn't find the issue");
  });

  it('shows an error banner on query error', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountForm();

    expect(wrapper.find('.err').exists()).toBe(true);
  });

  it('shows the issue badge', () => {
    const wrapper = mountForm();

    expect(wrapper.find('.badge').exists()).toBe(true);
  });

  it('notes when the issue collects reports for content', () => {
    h.result = ref({ issues: [issue({ relatedDiscussionId: 'd1' })] });
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('All reports for this content');
  });

  it('shows the reporter and date', () => {
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('First reported on');
  });
});

describe('IssueTitleEditForm author actions', () => {
  it('shows the Edit button to the author', () => {
    const wrapper = mountForm();

    expect(button(wrapper, 'Edit')).toBeTruthy();
  });

  it('hides the Edit button from non-authors', () => {
    h.modName = ref('someoneElse');
    const wrapper = mountForm();

    expect(button(wrapper, 'Edit')).toBeUndefined();
  });

  it('always shows the New Issue link', () => {
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('New Issue');
  });
});

describe('IssueTitleEditForm edit flow', () => {
  it('enters edit mode on Edit click', async () => {
    const wrapper = mountForm();

    await button(wrapper, 'Edit')!.trigger('click');

    expect(wrapper.findComponent({ name: 'TextInput' }).exists()).toBe(true);
  });

  it('saves the new title', async () => {
    const wrapper = mountForm();
    await button(wrapper, 'Edit')!.trigger('click');

    await button(wrapper, 'Save')!.trigger('click');

    expect(h.updateIssue).toHaveBeenCalled();
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

    h.onResult?.({ data: { issues: [{ title: 'Loaded Issue' }] } });
    await button(wrapper, 'Edit')!.trigger('click');

    expect(wrapper.getComponent({ name: 'TextInput' }).props('value')).toBe(
      'Loaded Issue'
    );
  });
});
