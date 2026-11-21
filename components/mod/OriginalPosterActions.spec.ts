import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRouter } from '@/tests/utils/mockRouter';
import WarningModal from '@/components/WarningModal.vue';
import type { Issue } from '@/__generated__/graphql';

import OriginalPosterActions from '@/components/mod/OriginalPosterActions.vue';

const mockResolve = vi.hoisted(() =>
  vi.fn((location: { name: string; params: Record<string, string> }) => ({
    href: `/${location.name}/${JSON.stringify(location.params)}`,
  }))
);
vi.mock('nuxt/app', () => ({
  useRouter: () => ({ ...createMockRouter(), resolve: mockResolve }),
}));

const mountActions = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(OriginalPosterActions, {
    props: {
      issue: {} as Issue,
      isCurrentUserOriginalPoster: true,
      ...props,
    },
    global: { stubs: { WarningModal: true, EyeIcon: true, TrashIcon: true } },
  });

const confirmDelete = (wrapper: ReturnType<typeof mountActions>) =>
  wrapper.findComponent(WarningModal).vm.$emit('primary-button-click');

const clickEdit = async (wrapper: ReturnType<typeof mountActions>) => {
  const open = vi.spyOn(window, 'open').mockReturnValue(null);
  await wrapper
    .findAll('button')
    .find((button) => button.text().startsWith('Edit'))!
    .trigger('click');
  open.mockRestore();
  return mockResolve.mock.calls.at(-1)![0];
};

describe('OriginalPosterActions edit links', () => {
  it('links to the discussion edit page by number and slug', async () => {
    const wrapper = mountActions({
      discussionId: 'd1',
      discussionNumber: 42,
      discussionTitle: 'Trail Conditions',
      channelUniqueName: 'cats',
    });
    expect(await clickEdit(wrapper)).toEqual({
      name: 'forums-forumId-discussions-edit-discussionId',
      params: { forumId: 'cats', discussionId: '42-trail-conditions' },
    });
  });

  it('links to the event edit page by number and slug', async () => {
    const wrapper = mountActions({
      eventId: 'e1',
      eventNumber: 7,
      eventTitle: 'Spring Meetup',
      channelUniqueName: 'cats',
    });
    expect(await clickEdit(wrapper)).toEqual({
      name: 'forums-forumId-events-edit-eventId',
      params: { forumId: 'cats', eventId: '7-spring-meetup' },
    });
  });

  it('falls back to the raw discussion id without a number', async () => {
    const wrapper = mountActions({
      discussionId: 'd1',
      channelUniqueName: 'cats',
    });
    expect(await clickEdit(wrapper)).toEqual({
      name: 'forums-forumId-discussions-edit-discussionId',
      params: { forumId: 'cats', discussionId: 'd1' },
    });
  });

  it('links to the issue comment permalink by shortId', async () => {
    const wrapper = mountActions({
      commentId: 'c1',
      commentShortId: 'a1b2c3d4e5f6',
      channelUniqueName: 'cats',
      issue: { issueNumber: 5 } as Issue,
    });
    expect(await clickEdit(wrapper)).toEqual({
      name: 'forums-forumId-issues-issueNumber-comments-commentId',
      params: { forumId: 'cats', issueNumber: 5, commentId: 'a1b2c3d4e5f6' },
    });
  });
});

describe('OriginalPosterActions', () => {
  it('emits delete-discussion with the discussion id', async () => {
    const wrapper = mountActions({ discussionId: 'd1' });
    await confirmDelete(wrapper);
    expect(wrapper.emitted('delete-discussion')).toEqual([['d1']]);
  });

  it('emits delete-event with the event id', async () => {
    const wrapper = mountActions({ eventId: 'e1' });
    await confirmDelete(wrapper);
    expect(wrapper.emitted('delete-event')).toEqual([['e1']]);
  });

  it('emits delete-comment with the comment id', async () => {
    const wrapper = mountActions({ commentId: 'c1' });
    await confirmDelete(wrapper);
    expect(wrapper.emitted('delete-comment')).toEqual([['c1']]);
  });
});
