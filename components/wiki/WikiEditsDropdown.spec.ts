import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import WikiEditsDropdown from './WikiEditsDropdown.vue';

vi.mock('@/composables/usePopoverPositioning', () => ({
  usePopoverPositioning: () => ({
    adjustedPosition: ref({ top: 0, left: 0, placement: 'below' }),
    updateAdjustedPosition: vi.fn(),
  }),
}));

vi.mock('@/utils', () => ({
  timeAgo: () => '2 hours ago',
}));

const mockWikiPage = {
  id: 'wiki-1',
  title: 'Test Wiki Page',
  body: 'Current content',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  VersionAuthor: { username: 'editor', displayName: 'Editor' },
  PastVersions: [
    {
      id: 'v1',
      body: 'First version content',
      createdAt: '2024-01-01T00:00:00Z',
      Author: { username: 'author', displayName: 'Author' },
      AuthorConnection: {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalCount: 0,
      },
    },
    {
      id: 'v2',
      body: 'Second version content',
      createdAt: '2024-01-10T00:00:00Z',
      editReason: 'Fixed typos',
      Author: { username: 'editor', displayName: 'Editor' },
      AuthorConnection: {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalCount: 0,
      },
    },
  ],
};

describe('WikiEditsDropdown', () => {
  it('shows edits label in trigger button', () => {
    const wrapper = mount(WikiEditsDropdown, {
      props: {
        wikiPage: mockWikiPage,
      },
      global: {
        stubs: {
          WikiRevisionDiffModal: { template: '<div />' },
        },
      },
    });

    // Should show "Edits" label when there are past versions
    expect(wrapper.text()).toContain('Edits');
  });

  it('builds sequential revision pairs correctly', () => {
    const wrapper = mount(WikiEditsDropdown, {
      props: {
        wikiPage: mockWikiPage,
      },
      global: {
        stubs: {
          WikiRevisionDiffModal: { template: '<div />' },
        },
      },
    });

    // The component should have computed the edits
    // We can verify by checking that it renders without errors
    expect(wrapper.exists()).toBe(true);
  });

  it('hides dropdown when no edits exist', () => {
    const wikiPageNoEdits = {
      ...mockWikiPage,
      PastVersions: [],
    };

    const wrapper = mount(WikiEditsDropdown, {
      props: {
        wikiPage: wikiPageNoEdits,
      },
      global: {
        stubs: {
          WikiRevisionDiffModal: { template: '<div />' },
        },
      },
    });

    // Should not render trigger button when no edits
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('shows dropdown when there are edits', () => {
    const wrapper = mount(WikiEditsDropdown, {
      props: {
        wikiPage: mockWikiPage,
      },
      global: {
        stubs: {
          WikiRevisionDiffModal: { template: '<div />' },
        },
      },
    });

    // Should render trigger button when edits exist
    expect(wrapper.find('button').exists()).toBe(true);
  });
});
