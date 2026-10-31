import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import HydratedProfileComment from './HydratedProfileComment.vue';
import { makeHydratedAnswer } from '@/tests/utils/rootCommentFixtures';
import {
  GetCommentDocument,
  type GetCommentQuery,
} from '@/__generated__/operations';
const mockQuery = vi.hoisted(() => vi.fn());
vi.mock('@vue/apollo-composable', () => ({
  useQuery: (...args: unknown[]) => mockQuery(...args),
}));
const result = ref<GetCommentQuery>();
const loading = ref(false);
const error = ref<Error | null>(null);
const refetch = vi.fn();
const comment = {
  id: 'c1',
  text: 'Summary',
  createdAt: '2026-01-01',
  CommentAuthor: null,
};
const mountAnswer = () =>
  mount(HydratedProfileComment, {
    props: { comment },
    slots: {
      default: `<template #default="{ commentData }"><button class="controls">{{ commentData.text }}</button></template>`,
    },
  });
beforeEach(() => {
  vi.clearAllMocks();
  result.value = { comments: [makeHydratedAnswer()] };
  loading.value = false;
  error.value = null;
  mockQuery.mockReturnValue({ result, loading, error, refetch });
});
describe('profile comment hydration', () => {
  it('uses the existing typed full selection and cache-first loading', () => {
    mountAnswer();
    const [document, variables, options] = mockQuery.mock.calls[0]!;
    expect({ document, variables: variables(), options: options() }).toEqual({
      document: GetCommentDocument,
      variables: { id: 'c1' },
      options: {
        enabled: true,
        fetchPolicy: 'cache-first',
        keepPreviousResult: false,
      },
    });
  });
  it('renders full data through the controls slot', () => {
    expect(mountAnswer().find('.controls').text()).toBe('A comment');
  });
  it('retains summary while loading without exposing controls', () => {
    loading.value = true;
    const wrapper = mountAnswer();
    expect({
      text: wrapper.text(),
      controls: wrapper.find('.controls').exists(),
    }).toEqual({ text: 'SummaryLoading comment controls…', controls: false });
  });
  it('allows retry after an error', async () => {
    error.value = new Error('offline');
    const wrapper = mountAnswer();
    await wrapper.get('button').trigger('click');
    expect({
      controls: wrapper.find('.controls').exists(),
      retries: refetch.mock.calls.length,
    }).toEqual({ controls: false, retries: 1 });
  });
  it('handles missing answers', () => {
    result.value = { comments: [] };
    expect(mountAnswer().text()).toContain('no longer available');
  });
  it('does not show a previous answer during navigation', async () => {
    const wrapper = mountAnswer();
    await wrapper.setProps({ comment: { ...comment, id: 'c2' } });
    expect({
      controls: wrapper.find('.controls').exists(),
      variables: mockQuery.mock.calls[0]![1](),
    }).toEqual({ controls: false, variables: { id: 'c2' } });
  });
  it('passes nullable full data without inventing an author or parent', () => {
    result.value = {
      comments: [
        makeHydratedAnswer({
          text: null,
          CommentAuthor: null,
          ParentComment: null,
        }),
      ],
    };
    expect(mountAnswer().find('.controls').exists()).toBe(true);
  });
});
