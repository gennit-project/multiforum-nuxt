import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import CreateIssueForm from '@/components/mod/CreateIssueForm.vue';

const h = vi.hoisted(() => ({
  modName: null as unknown,
  username: null as unknown,
  createIssue: vi.fn(),
  mutationOptions: undefined as undefined | (() => Record<string, unknown>),
  onDone: undefined as undefined | ((r: unknown) => void),
  error: { value: null as unknown },
  push: vi.fn(),
  back: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (_doc: unknown, optionsFactory: () => Record<string, unknown>) => {
    h.mutationOptions = optionsFactory;
    return {
      mutate: h.createIssue,
      loading: ref(false),
      error: h.error,
      onDone: (cb: (r: unknown) => void) => {
        h.onDone = cb;
      },
    };
  },
}));
vi.mock('nuxt/app', () => ({
  useRouter: () => ({ push: h.push, back: h.back }),
}));
vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => h.modName,
  useUsername: () => h.username,
}));

const stub = (name: string, props: string[] = [], emits: string[] = []) => ({
  name,
  props,
  emits,
  template: '<div><slot /></div>',
});

const mountForm = (props: Record<string, unknown> = {}, hasAuth = true) =>
  mount(CreateIssueForm, {
    props,
    global: {
      stubs: {
        RequireAuth: {
          template: `<div><slot name="${hasAuth ? 'has-auth' : 'does-not-have-auth'}" /></div>`,
        },
        TextInput: stub('TextInput', ['value'], ['update']),
        TextEditor: stub('TextEditor', ['initialValue'], ['update']),
        PrimaryButton: stub('PrimaryButton', ['disabled', 'loading', 'label'], ['click']),
        GenericButton: stub('GenericButton', ['text'], ['click']),
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err" />' },
      },
    },
  });

const titleInput = (w: ReturnType<typeof mount>) =>
  w.getComponent({ name: 'TextInput' });
const bodyInput = (w: ReturnType<typeof mount>) =>
  w.getComponent({ name: 'TextEditor' });
const submitBtn = (w: ReturnType<typeof mount>) =>
  w.getComponent({ name: 'PrimaryButton' });

const fill = async (w: ReturnType<typeof mount>, title = 'T', body = 'B') => {
  await titleInput(w).vm.$emit('update', title);
  await bodyInput(w).vm.$emit('update', body);
};

const input = () =>
  (h.mutationOptions?.().variables as { input: Record<string, unknown> }).input;

beforeEach(() => {
  vi.clearAllMocks();
  h.modName = ref('');
  h.username = ref('alice');
  h.mutationOptions = undefined;
  h.onDone = undefined;
  h.error = { value: null };
});

describe('CreateIssueForm auth gate', () => {
  it('shows a sign-in message when unauthenticated', () => {
    const wrapper = mountForm({}, false);

    expect(wrapper.text()).toContain("don't have permission");
  });

  it('shows the form when authenticated', () => {
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('New Issue');
  });
});

describe('CreateIssueForm canSubmit', () => {
  it('disables submit until title and body are filled', () => {
    const wrapper = mountForm();

    expect(submitBtn(wrapper).props('disabled')).toBe(true);
  });

  it('enables submit once title and body are present', async () => {
    const wrapper = mountForm();

    await fill(wrapper);

    expect(submitBtn(wrapper).props('disabled')).toBe(false);
  });

  it('stays disabled with no author', async () => {
    h.username = ref('');
    const wrapper = mountForm();

    await fill(wrapper);

    expect(submitBtn(wrapper).props('disabled')).toBe(true);
  });
});

describe('CreateIssueForm issue input', () => {
  it('connects the author as a user when only a username exists', async () => {
    const wrapper = mountForm();
    await fill(wrapper);

    expect(input().Author).toMatchObject({
      User: { connect: { where: { node: { username: 'alice' } } } },
    });
  });

  it('prefers the moderation profile as the author when present', async () => {
    h.modName = ref('modAlice');
    const wrapper = mountForm();
    await fill(wrapper);

    expect(input().Author).toMatchObject({
      ModerationProfile: { connect: { where: { node: { displayName: 'modAlice' } } } },
    });
  });

  it('attaches a channel connection when a channel is selected', async () => {
    const wrapper = mountForm({ defaultChannelId: 'cats' });
    await fill(wrapper);

    expect(input().channelUniqueName).toBe('cats');
  });

  it('omits the channel when none is selected', async () => {
    const wrapper = mountForm();
    await fill(wrapper);

    expect(input().Channel).toBeUndefined();
  });
});

describe('CreateIssueForm submit', () => {
  it('runs the mutation when submitting a valid form', async () => {
    const wrapper = mountForm();
    await fill(wrapper);

    await submitBtn(wrapper).vm.$emit('click');

    expect(h.createIssue).toHaveBeenCalled();
  });

  it('does not run the mutation when the form is invalid', async () => {
    const wrapper = mountForm();

    await submitBtn(wrapper).vm.$emit('click');

    expect(h.createIssue).not.toHaveBeenCalled();
  });

  it('navigates back on cancel', async () => {
    const wrapper = mountForm();

    await wrapper.getComponent({ name: 'GenericButton' }).vm.$emit('click');

    expect(h.back).toHaveBeenCalled();
  });

  it('shows an error banner when the mutation errors', () => {
    h.error = { value: { message: 'boom' } };
    const wrapper = mountForm();

    expect(wrapper.find('.err').exists()).toBe(true);
  });
});

describe('CreateIssueForm navigation on success', () => {
  it('routes to the forum issue page when the issue has a channel', () => {
    mountForm({ defaultChannelId: 'cats' });

    h.onDone?.({
      data: { createIssue: { issueNumber: 5, Channel: { uniqueName: 'cats' } } },
    });

    expect(h.push).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'forums-forumId-issues-issueNumber',
        params: { forumId: 'cats', issueNumber: 5 },
      })
    );
  });

  it('routes to the admin issue page when there is no channel', () => {
    mountForm();

    h.onDone?.({ data: { createIssue: { issueNumber: 9 } } });

    expect(h.push).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'admin-issues-issueNumber',
        params: { issueNumber: 9 },
      })
    );
  });
});

describe('CreateIssueForm cache update', () => {
  const makeCache = () => ({
    readQuery: vi.fn(() => ({
      channels: [{ Issues: [] }],
      issuesAggregate: { count: 2 },
    })),
    writeQuery: vi.fn(),
  });

  it('prepends the new issue and bumps counts for a channel issue', () => {
    mountForm({ defaultChannelId: 'cats' });
    const cache = makeCache();

    (h.mutationOptions?.().update as (c: unknown, r: unknown) => void)(cache, {
      data: { createIssue: { issueNumber: 1 } },
    });

    expect(cache.writeQuery).toHaveBeenCalled();
  });

  it('still bumps the server count for an issue with no channel', () => {
    mountForm();
    const cache = makeCache();

    (h.mutationOptions?.().update as (c: unknown, r: unknown) => void)(cache, {
      data: { createIssue: { issueNumber: 1 } },
    });

    expect(cache.writeQuery).toHaveBeenCalled();
  });
});
