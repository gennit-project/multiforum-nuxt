import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import ActivityFeed from './ActivityFeed.vue';

// Mock nuxt/app before importing the component
vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'test-forum' } }),
}));

// Mock @vue/apollo-composable
vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    loading: { value: false },
    error: { value: null },
  })),
}));

const ActivityFeedListItemStub = {
  name: 'ActivityFeedListItem',
  props: ['commentEditIndex', 'activityItem'],
  template:
    '<div class="activity-item" :data-comment-edit-index="commentEditIndex"></div>',
};

const NuxtPageStub = {
  name: 'NuxtPage',
  template: '<div />',
};

describe('ActivityFeed', () => {
  it('treats EDIT_CONTENT as an edit when computing comment edit indexes', () => {
    const feedItems = [
      {
        id: 'edit-new',
        actionType: 'EDIT_CONTENT',
        Comment: {
          id: 'comment-1',
          PastVersions: [{ id: 'v1' }, { id: 'v2' }],
        },
      },
      {
        id: 'edit-old',
        actionType: 'EDIT_CONTENT',
        Comment: {
          id: 'comment-1',
          PastVersions: [{ id: 'v1' }, { id: 'v2' }],
        },
      },
    ];

    const wrapper = mount(ActivityFeed, {
      props: {
        feedItems,
        originalUserAuthorUsername: '',
        originalModAuthorName: '',
      },
      global: {
        stubs: {
          ActivityFeedListItem: ActivityFeedListItemStub,
          NuxtPage: NuxtPageStub,
        },
      },
    });

    const items = wrapper.findAll('.activity-item');
    expect(items).toHaveLength(2);
    expect(items[0].attributes()['data-comment-edit-index']).toBe('1');
    expect(items[1].attributes()['data-comment-edit-index']).toBe('0');
  });
});
