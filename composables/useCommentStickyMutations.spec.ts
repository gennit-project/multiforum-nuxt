import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { asMock, createMutationRouter } from '@/tests/utils/mockApollo';
import { useCommentStickyMutations } from './useCommentStickyMutations';
import type { Comment } from '@/__generated__/graphql';

vi.mock('@vue/apollo-composable', () => ({ useMutation: vi.fn() }));

const router = createMutationRouter(['stickyComment', 'unstickyComment']);

const comment = (): Comment =>
  ({ id: 'c1', __typename: 'Comment' }) as unknown as Comment;

beforeEach(() => {
  router.reset();
  asMock(useMutation).mockImplementation(router.useMutation);
});

// A cache whose modify() runs the field policies so their bodies are covered.
const fakeCache = () => {
  const fields: Record<string, () => unknown> = {};
  return {
    identify: vi.fn(() => 'Comment:c1'),
    modify: vi.fn((opts: any) => {
      Object.assign(fields, opts.fields);
      Object.values(opts.fields).forEach((fn: any) => fn());
    }),
    fields,
  };
};

describe('useCommentStickyMutations', () => {
  it('stickies the current comment', () => {
    const { stickyCurrentComment } = useCommentStickyMutations(ref(comment()));
    stickyCurrentComment();
    expect(router.get('stickyComment').mutate).toHaveBeenCalledWith({
      commentId: 'c1',
    });
  });

  it('unstickies the current comment', () => {
    const { unstickyCurrentComment } = useCommentStickyMutations(ref(comment()));
    unstickyCurrentComment();
    expect(router.get('unstickyComment').mutate).toHaveBeenCalledWith({
      commentId: 'c1',
    });
  });

  it('writes the sticky fields into the cache on a successful sticky', () => {
    useCommentStickyMutations(ref(comment()));
    const cache = fakeCache();
    router.get('stickyComment').update!(cache, {
      data: {
        stickyComment: {
          id: 'c1',
          isSticky: true,
          stickyAt: '2026-01-01',
          stickyByUsername: 'mod',
        },
      },
    });
    expect(cache.fields.isSticky()).toBe(true);
  });

  it('writes the sticky fields into the cache on a successful unsticky', () => {
    useCommentStickyMutations(ref(comment()));
    const cache = fakeCache();
    router.get('unstickyComment').update!(cache, {
      data: { unstickyComment: { id: 'c1', isSticky: false } },
    });
    expect(cache.fields.isSticky()).toBe(false);
  });

  it('defaults stickyAt and stickyByUsername to null when absent', () => {
    useCommentStickyMutations(ref(comment()));
    const cache = fakeCache();
    router.get('stickyComment').update!(cache, {
      data: { stickyComment: { id: 'c1', isSticky: true } },
    });
    expect([cache.fields.stickyAt(), cache.fields.stickyByUsername()]).toEqual([
      null,
      null,
    ]);
  });

  it('skips the cache write when the mutation returned no comment id', () => {
    useCommentStickyMutations(ref(comment()));
    const cache = fakeCache();
    router.get('stickyComment').update!(cache, { data: { stickyComment: null } });
    expect(cache.modify).not.toHaveBeenCalled();
  });
});
