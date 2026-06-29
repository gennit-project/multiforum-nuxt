import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import InlineCommentForm from './InlineCommentForm.vue';

const createCommentError = ref<{ message: string } | null>(null);
const createCommentLoading = ref(false);
const getUserResult = ref<{
  users?: { notifyOnReplyToCommentByDefault?: boolean }[];
} | null>(null);
const suspensionIssueNumber = ref<number | null>(null);
const suspensionChannelId = ref('');
const usernameRef = ref('alice');
const mutateMock = vi.fn();
// Captured at mount time so tests can invoke the real mutation `update` and
// `onDone` callbacks that a plain vi.fn() mock would never run.
let capturedMutationOptions: (() => any) | null = null;
let onDoneCallbacks: ((result: any) => void)[] = [];

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    query: {},
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: getUserResult,
  }),
  useMutation: (_doc: unknown, optionsFn: () => any) => {
    capturedMutationOptions = optionsFn;
    return {
      mutate: mutateMock,
      loading: createCommentLoading,
      error: createCommentError,
      onDone: (cb: (result: any) => void) => onDoneCallbacks.push(cb),
    };
  },
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => usernameRef,
  setUsername: vi.fn(),
}));

vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    issueNumber: suspensionIssueNumber,
    suspendedUntil: ref('2030-01-01T00:00:00.000Z'),
    suspendedIndefinitely: ref(false),
    channelId: suspensionChannelId,
  }),
}));

const baseStubs = (authSlot: 'has-auth' | 'does-not-have-auth' = 'has-auth') => ({
  ErrorBanner: {
    template: '<div data-testid="error-banner">{{ text }}</div>',
    props: ['text'],
  },
  SuspensionNotice: {
    template: '<div data-testid="suspension-notice"></div>',
  },
  RequireAuth: {
    template: `<div><slot name="${authSlot}" /></div>`,
  },
  LoadingSpinner: { template: '<div data-testid="loading-spinner" />' },
});

type BuildOpts = {
  props?: Record<string, unknown>;
  authSlot?: 'has-auth' | 'does-not-have-auth';
};

const buildWrapper = (opts: BuildOpts = {}) =>
  mount(InlineCommentForm, {
    props: {
      discussionChannel: {
        id: 'discussion-channel-1',
        discussionId: 'discussion-1',
        channelUniqueName: 'cats',
      },
      ...(opts.props ?? {}),
    },
    attachTo: document.body,
    global: {
      stubs: baseStubs(opts.authSlot),
    },
  });

const buildFakeCache = (
  queryResult: unknown,
  overrides: Record<string, unknown> = {}
) => ({
  writeFragment: vi.fn(() => ({ __ref: 'Comment:new' })),
  readQuery: vi.fn(() => queryResult),
  writeQuery: vi.fn(),
  // Invoke the field policy functions so their bodies are exercised.
  modify: vi.fn(({ fields }: { fields: Record<string, any> }) => {
    for (const key of Object.keys(fields)) {
      fields[key](undefined, { readField: () => [] });
    }
  }),
  identify: vi.fn(() => 'ROOT_QUERY'),
  ...overrides,
});

const successResult = () => ({
  data: {
    createComments: {
      comments: [{ id: 'new-comment-1', text: 'hi', __typename: 'Comment' }],
    },
  },
});

beforeEach(() => {
  createCommentError.value = null;
  createCommentLoading.value = false;
  getUserResult.value = null;
  suspensionIssueNumber.value = null;
  suspensionChannelId.value = '';
  usernameRef.value = 'alice';
  mutateMock.mockClear();
  capturedMutationOptions = null;
  onDoneCallbacks = [];
});

describe('InlineCommentForm — error banner vs suspension', () => {
  it('suppresses the create error banner when suspension context is known', async () => {
    createCommentError.value = { message: 'Forbidden' };
    suspensionIssueNumber.value = 12;
    suspensionChannelId.value = 'cats';

    const wrapper = buildWrapper();
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(false);
  });

  it('shows the create error banner when no suspension context is available', async () => {
    createCommentError.value = { message: 'Forbidden' };

    const wrapper = buildWrapper();
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(true);
  });

  it('renders the suspension notice once a suspended user attempts to submit', async () => {
    suspensionIssueNumber.value = 7;
    suspensionChannelId.value = 'cats';

    const wrapper = buildWrapper();
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('[data-testid="suspension-notice"]').exists()).toBe(
      true
    );
  });
});

describe('InlineCommentForm — submit guards', () => {
  it('calls the create mutation when an authenticated user submits', async () => {
    const wrapper = buildWrapper();
    await wrapper.find('form').trigger('submit.prevent');

    expect(mutateMock).toHaveBeenCalledTimes(1);
  });

  it('does not submit when there is no username', async () => {
    usernameRef.value = '';

    const wrapper = buildWrapper();
    await wrapper.find('form').trigger('submit.prevent');

    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('does not submit when there is no discussion channel', async () => {
    const wrapper = buildWrapper({ props: { discussionChannel: null } });
    await wrapper.find('form').trigger('submit.prevent');

    expect(mutateMock).not.toHaveBeenCalled();
  });
});

describe('InlineCommentForm — create comment input', () => {
  it('builds the comment input wired to the discussion channel', () => {
    buildWrapper();
    const input = capturedMutationOptions!().variables.createCommentInput[0];

    expect(input).toMatchObject({
      isRootComment: true,
      isFeedbackComment: false,
      DiscussionChannel: {
        connect: { where: { node: { id: 'discussion-channel-1' } } },
      },
    });
  });

  it('subscribes to notifications when the user opts in by default', () => {
    getUserResult.value = {
      users: [{ notifyOnReplyToCommentByDefault: true }],
    };

    buildWrapper();
    const input = capturedMutationOptions!().variables.createCommentInput[0];

    expect(input.SubscribedToNotifications).toBeTruthy();
  });

  it('omits the notification subscription when the user has not opted in', () => {
    getUserResult.value = {
      users: [{ notifyOnReplyToCommentByDefault: false }],
    };

    buildWrapper();
    const input = capturedMutationOptions!().variables.createCommentInput[0];

    expect(input.SubscribedToNotifications).toBeUndefined();
  });
});

describe('InlineCommentForm — cache update', () => {
  it('prepends the new comment to an existing cached comment section', () => {
    buildWrapper();
    const cache = buildFakeCache({
      getCommentSection: { Comments: [{ id: 'old' }] },
    });
    capturedMutationOptions!().update(cache, successResult());

    expect(cache.writeQuery).toHaveBeenCalledTimes(1);
  });

  it('falls back to cache.modify when the query result is missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    buildWrapper();
    const cache = buildFakeCache(null);
    capturedMutationOptions!().update(cache, successResult());
    warnSpy.mockRestore();

    expect(cache.writeQuery).not.toHaveBeenCalled();
  });

  it('bumps the discussion channel comment count on the cache', () => {
    buildWrapper();
    const cache = buildFakeCache({
      getCommentSection: { Comments: [] },
    });
    capturedMutationOptions!().update(cache, successResult());

    expect(cache.modify).toHaveBeenCalled();
  });

  it('does nothing when the mutation returns no new comment', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    buildWrapper();
    const cache = buildFakeCache({ getCommentSection: { Comments: [] } });
    capturedMutationOptions!().update(cache, {
      data: { createComments: { comments: [] } },
    });
    errorSpy.mockRestore();

    expect(cache.writeFragment).not.toHaveBeenCalled();
  });

  it('swallows errors thrown while updating the cache', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    buildWrapper();
    const cache = buildFakeCache(
      { getCommentSection: { Comments: [] } },
      {
        writeFragment: vi.fn(() => {
          throw new Error('cache boom');
        }),
      }
    );

    expect(() =>
      capturedMutationOptions!().update(cache, successResult())
    ).not.toThrow();
    errorSpy.mockRestore();
  });
});

describe('InlineCommentForm — onDone handling', () => {
  it('shows the saved notice after a successful create', async () => {
    const wrapper = buildWrapper();
    onDoneCallbacks.forEach((cb) => cb(successResult()));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Saved!');
  });

  it('does not show the saved notice when the result carries errors', async () => {
    const wrapper = buildWrapper();
    onDoneCallbacks.forEach((cb) => cb({ errors: [{ message: 'nope' }] }));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).not.toContain('Saved!');
  });

  it('clears the saved notice after the timeout elapses', async () => {
    vi.useFakeTimers();
    const wrapper = buildWrapper();
    onDoneCallbacks.forEach((cb) => cb(successResult()));
    vi.advanceTimersByTime(2000);
    vi.useRealTimers();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).not.toContain('Saved!');
  });
});

describe('InlineCommentForm — loading state', () => {
  it('shows the saving label while the mutation is in flight', () => {
    createCommentLoading.value = true;
    const wrapper = buildWrapper();

    expect(wrapper.find('button[type="submit"]').text()).toContain('Saving');
  });
});

describe('InlineCommentForm — bot mention autocomplete', () => {
  const botSuggestions = [
    {
      value: 'helper',
      label: 'Helper',
      mention: '/bot/helper',
      displayName: 'Helper Bot',
      isDeprecated: false,
    },
    {
      value: 'retired',
      label: 'Retired',
      mention: '/bot/retired',
      isDeprecated: true,
    },
  ];

  const typeMention = async (wrapper: ReturnType<typeof buildWrapper>, text: string) => {
    const textarea = wrapper.find('[data-testid="discussion-inline-comment"]');
    (textarea.element as HTMLTextAreaElement).value = text;
    (textarea.element as HTMLTextAreaElement).selectionStart = text.length;
    await textarea.trigger('input');
    return textarea;
  };

  it('shows active bot suggestions while typing a /bot/ mention', async () => {
    const wrapper = buildWrapper({ props: { botSuggestions } });
    await typeMention(wrapper, '/bot/hel');

    expect(wrapper.findAll('button[type="button"]')).toHaveLength(1);
  });

  it('hides the bot dropdown once the query is an exact match', async () => {
    const wrapper = buildWrapper({ props: { botSuggestions } });
    await typeMention(wrapper, '/bot/helper');

    expect(wrapper.findAll('button[type="button"]')).toHaveLength(0);
  });

  it('inserts the selected bot mention into the comment text', async () => {
    const wrapper = buildWrapper({ props: { botSuggestions } });
    await typeMention(wrapper, '/bot/hel');
    await wrapper.find('button[type="button"]').trigger('click');
    const textarea = wrapper.find(
      '[data-testid="discussion-inline-comment"]'
    ).element as HTMLTextAreaElement;

    expect(textarea.value).toContain('/bot/helper');
  });
});

describe('InlineCommentForm — mod mention autocomplete', () => {
  const modSuggestions = [
    {
      value: 'alice',
      label: 'Alice',
      mention: '/m/alice',
      username: 'alice-acct',
    },
  ];

  const typeMention = async (wrapper: ReturnType<typeof buildWrapper>, text: string) => {
    const textarea = wrapper.find('[data-testid="discussion-inline-comment"]');
    (textarea.element as HTMLTextAreaElement).value = text;
    (textarea.element as HTMLTextAreaElement).selectionStart = text.length;
    await textarea.trigger('input');
    return textarea;
  };

  it('shows mod suggestions while typing a /m/ mention', async () => {
    const wrapper = buildWrapper({ props: { modSuggestions } });
    await typeMention(wrapper, '/m/ali');

    expect(wrapper.findAll('button[type="button"]')).toHaveLength(1);
  });

  it('inserts the selected mod mention into the comment text', async () => {
    const wrapper = buildWrapper({ props: { modSuggestions } });
    await typeMention(wrapper, '/m/ali');
    await wrapper.find('button[type="button"]').trigger('click');
    const textarea = wrapper.find(
      '[data-testid="discussion-inline-comment"]'
    ).element as HTMLTextAreaElement;

    expect(textarea.value).toContain('/m/alice');
  });
});

describe('InlineCommentForm — unauthenticated view', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a disabled composer when the user is not authenticated', () => {
    const wrapper = buildWrapper({ authSlot: 'does-not-have-auth' });

    expect(
      (wrapper.find('textarea').element as HTMLTextAreaElement).disabled
    ).toBe(true);
  });
});
