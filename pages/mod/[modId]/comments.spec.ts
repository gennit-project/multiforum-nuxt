import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ModCommentsPage from './comments.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: {
      modId: 'mod-1',
    },
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

describe('mod profile comments page', () => {
  it('opens the report modal when a comment emits click-report', async () => {
    const { useQuery } = await import('@vue/apollo-composable');
    (useQuery as unknown as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        result: ref({
          moderationProfiles: [
            {
              AuthoredCommentsAggregate: { count: 1 },
            },
          ],
        }),
        error: ref(null),
      })
      .mockReturnValueOnce({
        result: ref({
          moderationProfiles: [
            {
              AuthoredComments: [{ id: 'comment-1', text: 'hello' }],
            },
          ],
        }),
        error: ref(null),
        fetchMore: vi.fn(),
      });

    const wrapper = mount(ModCommentsPage, {
      global: {
        stubs: {
          ErrorBanner: true,
          LoadMore: true,
          Notification: true,
          BrokenRulesModal: {
            template: '<div data-testid="report-modal" />',
            props: ['open', 'commentId', 'comment'],
          },
          Comment: {
            template: '<button data-testid="report-comment" @click="$emit(\'click-report\', { id: \'comment-1\', text: \'hello\' })" />',
          },
        },
      },
    });

    await wrapper.get('[data-testid="report-comment"]').trigger('click');

    expect(wrapper.find('[data-testid="report-modal"]').exists()).toBe(true);
  });
});
