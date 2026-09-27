import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useDiscussionAgeGateCheck } from '@/composables/useDiscussionAgeGateCheck';

const h = vi.hoisted(() => ({
  result: undefined as unknown,
  variables: undefined as undefined | (() => unknown),
  options: undefined as undefined | (() => { enabled: boolean }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (
    _document: unknown,
    variables: () => unknown,
    options: () => { enabled: boolean }
  ) => {
    h.variables = variables;
    h.options = options;
    return { result: h.result, loading: ref(false) };
  },
}));
vi.mock('@/graphQLData/age/queries', () => ({
  GET_DISCUSSION_AGE_GATE_CHECK: 'GET_DISCUSSION_AGE_GATE_CHECK',
}));

beforeEach(() => {
  h.result = ref(undefined);
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
