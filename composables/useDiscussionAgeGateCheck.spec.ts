import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useDiscussionAgeGateCheck } from '@/composables/useDiscussionAgeGateCheck';

const h = vi.hoisted(() => ({
  result: undefined as unknown,
  variables: undefined as undefined | (() => unknown),
  options: undefined as undefined | (() => { enabled: boolean }),
  calls: [] as Array<{
    variables: () => unknown;
    options: () => { enabled: boolean };
  }>,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (
    _document: unknown,
    variables: () => unknown,
    options: () => { enabled: boolean }
  ) => {
    h.variables = variables;
    h.options = options;
    h.calls.push({ variables, options });
    return { result: h.result, loading: ref(false) };
  },
}));
vi.mock('@/graphQLData/age/queries', () => ({
  GET_DISCUSSION_AGE_GATE_CHECK: 'GET_DISCUSSION_AGE_GATE_CHECK',
}));

beforeEach(() => {
  h.result = ref(undefined);
  h.calls = [];
});

describe('useDiscussionAgeGateCheck', () => {
  it('asks about the given discussion', () => {
    useDiscussionAgeGateCheck({ discussionId: ref('d1'), enabled: ref(true) });
    expect(h.variables?.()).toEqual({ discussionId: 'd1' });
  });

  it.each([
    ['enabled with an id', 'd1', true, true],
    ['disabled', 'd1', false, false],
    ['missing an id', '', true, false],
  ])('only runs when %s', (_label, discussionId, enabled, expected) => {
    useDiscussionAgeGateCheck({
      discussionId: ref(discussionId),
      enabled: ref(enabled),
    });
    expect(h.options?.().enabled).toBe(expected);
  });

  it.each([
    [
      { requiresAgeCheck: true, status: 'SIGN_IN_REQUIRED', minimumAge: 18 },
      true,
    ],
    [{ requiresAgeCheck: false, status: 'ALLOWED', minimumAge: null }, false],
    [undefined, false],
  ])('reports requiresAgeCheck for %o', (check, expected) => {
    h.result = ref(check ? { getDiscussionAgeGateCheck: check } : undefined);
    const { requiresAgeCheck } = useDiscussionAgeGateCheck({
      discussionId: ref('d1'),
      enabled: ref(true),
    });
    expect(requiresAgeCheck.value).toBe(expected);
  });
});

describe('useDiscussionAgeGateCheck without a known id', () => {
  const lookupByNumber = () =>
    useDiscussionAgeGateCheck({
      discussionNumber: ref(7),
      channelUniqueName: ref('cats'),
      enabled: ref(true),
    });

  it('looks the id up from the forum and discussion number', () => {
    lookupByNumber();
    expect(h.calls[0]?.variables()).toEqual({
      channelUniqueName: 'cats',
      discussionNumber: 7,
    });
  });

  it('runs the id lookup when only the number is known', () => {
    lookupByNumber();
    expect(h.calls[0]?.options().enabled).toBe(true);
  });

  it('waits for the id before running the age check', () => {
    lookupByNumber();
    expect(h.calls[1]?.options().enabled).toBe(false);
  });

  it('asks about the looked-up discussion id', () => {
    h.result = ref({ discussionChannels: [{ discussionId: 'looked-up' }] });
    lookupByNumber();
    expect(h.calls[1]?.variables()).toEqual({ discussionId: 'looked-up' });
  });

  it('skips the lookup when the id is already known', () => {
    useDiscussionAgeGateCheck({
      discussionId: ref('d1'),
      discussionNumber: ref(7),
      channelUniqueName: ref('cats'),
      enabled: ref(true),
    });
    expect(h.calls[0]?.options().enabled).toBe(false);
  });
});

