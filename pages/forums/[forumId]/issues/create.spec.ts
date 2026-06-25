import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
}));

describe('forum create issue page', () => {
  it('passes the forum id from the route as the default channel', async () => {
    const Page = (await import('./create.vue')).default;
    const CreateIssueForm = (
      await import('@/components/mod/CreateIssueForm.vue')
    ).default;
    const form = shallowMount(Page).findComponent(CreateIssueForm);
    expect(form.props('defaultChannelId')).toBe('cats');
  });
});
