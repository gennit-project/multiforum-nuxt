import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useIssueSubscription } from './useIssueSubscription';

const subscribeMutate = vi.fn();
const unsubscribeMutate = vi.fn();
const routerReplace = vi.fn();
let useMutationCall = 0;
let routeQuery: Record<string, unknown> = {};

vi.mock('@vue/apollo-composable', () => ({
  // First useMutation call in the composable is SUBSCRIBE, second is UNSUBSCRIBE.
  useMutation: () => {
    useMutationCall += 1;
    return {
      mutate: useMutationCall === 1 ? subscribeMutate : unsubscribeMutate,
      loading: ref(false),
    };
  },
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ replace: routerReplace }),
}));

vi.mock('@/composables/useAutoUnsubscribe', () => ({
  useAutoUnsubscribe: vi.fn(),
}));

const subscribedIssue = (username: string) => ({
  id: 'issue-1',
  SubscribedToNotifications: [{ username }],
});

const unsubscribedIssue = () => ({
  id: 'issue-1',
  SubscribedToNotifications: [],
});

const setup = (opts: {
  activeIssue?: unknown;
  username?: string;
  refetchIssue?: () => Promise<unknown>;
} = {}) =>
  useIssueSubscription({
    activeIssue: ref(opts.activeIssue ?? unsubscribedIssue()) as never,
    username: ref(opts.username ?? 'alice'),
    refetchIssue: opts.refetchIssue ?? vi.fn().mockResolvedValue(undefined),
  });

beforeEach(() => {
  subscribeMutate.mockClear().mockResolvedValue(undefined);
  unsubscribeMutate.mockClear().mockResolvedValue(undefined);
  routerReplace.mockClear().mockResolvedValue(undefined);
  useMutationCall = 0;
  routeQuery = {};
});

describe('useIssueSubscription — subscribed-state derivation', () => {
  it('reports subscribed when the current user is in the subscriber list', () => {
    const { isIssueSubscribed } = setup({
      activeIssue: subscribedIssue('alice'),
      username: 'alice',
    });

    expect(isIssueSubscribed.value).toBe(true);
  });

  it('reports not subscribed when the user is absent from the list', () => {
    const { isIssueSubscribed } = setup({
      activeIssue: subscribedIssue('someone-else'),
      username: 'alice',
    });

    expect(isIssueSubscribed.value).toBe(false);
  });

  it('reports not subscribed when there is no current username', () => {
    const { isIssueSubscribed } = setup({
      activeIssue: subscribedIssue('alice'),
      username: '',
    });

    expect(isIssueSubscribed.value).toBe(false);
  });
});

describe('useIssueSubscription — toggle', () => {
  it('subscribes when the user is not yet subscribed', async () => {
    const { toggleIssueSubscription } = setup({
      activeIssue: unsubscribedIssue(),
    });

    await toggleIssueSubscription();

    expect(subscribeMutate).toHaveBeenCalledWith({ issueId: 'issue-1' });
  });

  it('sets the subscribed confirmation title after subscribing', async () => {
    const { toggleIssueSubscription, issueSubscriptionNotificationTitle } =
      setup({ activeIssue: unsubscribedIssue() });

    await toggleIssueSubscription();

    expect(issueSubscriptionNotificationTitle.value).toBe(
      'Subscribed to issue updates'
    );
  });

  it('unsubscribes when the user is already subscribed', async () => {
    const { toggleIssueSubscription } = setup({
      activeIssue: subscribedIssue('alice'),
      username: 'alice',
    });

    await toggleIssueSubscription();

    expect(unsubscribeMutate).toHaveBeenCalledWith({ issueId: 'issue-1' });
  });

  it('sets the unsubscribed confirmation title after unsubscribing', async () => {
    const { toggleIssueSubscription, issueSubscriptionNotificationTitle } =
      setup({ activeIssue: subscribedIssue('alice'), username: 'alice' });

    await toggleIssueSubscription();

    expect(issueSubscriptionNotificationTitle.value).toBe(
      'Unsubscribed from issue updates'
    );
  });

  it('shows the confirmation notification after toggling', async () => {
    const { toggleIssueSubscription, showIssueSubscriptionNotification } =
      setup({ activeIssue: unsubscribedIssue() });

    await toggleIssueSubscription();

    expect(showIssueSubscriptionNotification.value).toBe(true);
  });

  it('refetches the issue after toggling', async () => {
    const refetchIssue = vi.fn().mockResolvedValue(undefined);
    const { toggleIssueSubscription } = setup({
      activeIssue: unsubscribedIssue(),
      refetchIssue,
    });

    await toggleIssueSubscription();

    expect(refetchIssue).toHaveBeenCalledTimes(1);
  });

  it('does nothing when there is no active issue id', async () => {
    const { toggleIssueSubscription } = setup({
      activeIssue: { id: '', SubscribedToNotifications: [] },
    });

    await toggleIssueSubscription();

    expect(subscribeMutate).not.toHaveBeenCalled();
  });
});

describe('useIssueSubscription — subscribe CTA', () => {
  it('initializes the CTA as visible when the route flags it', () => {
    routeQuery = { subscribeCta: '1' };
    const { showSubscribeCta } = setup();

    expect(showSubscribeCta.value).toBe(true);
  });

  it('hides the CTA when dismissed', async () => {
    routeQuery = { subscribeCta: '1' };
    const { dismissSubscribeCta, showSubscribeCta } = setup();

    await dismissSubscribeCta();

    expect(showSubscribeCta.value).toBe(false);
  });

  it('strips the subscribeCta query param when dismissing', async () => {
    routeQuery = { subscribeCta: '1', other: 'keep' };
    const { dismissSubscribeCta } = setup();

    await dismissSubscribeCta();

    expect(routerReplace).toHaveBeenCalledWith({ query: { other: 'keep' } });
  });

  it('does not touch the route when there is no subscribeCta param', async () => {
    routeQuery = { other: 'keep' };
    const { dismissSubscribeCta } = setup();

    await dismissSubscribeCta();

    expect(routerReplace).not.toHaveBeenCalled();
  });
});
