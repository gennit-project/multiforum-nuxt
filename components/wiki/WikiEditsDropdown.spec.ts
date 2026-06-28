import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
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

describe('WikiEditsDropdown revision pairing', () => {
  // PastVersions sorted newest-first, as the GraphQL query returns them.
  const orderedWikiPage = {
    id: 'wiki-1',
    title: 'Test Wiki Page',
    body: 'Current content',
    editReason: 'Latest reason',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    VersionAuthor: { username: 'editor' },
    PastVersions: [
      {
        id: 'v2',
        body: 'Second version',
        editReason: 'Fixed typos',
        createdAt: '2024-01-10T00:00:00Z',
        Author: { username: 'bob' },
      },
      {
        id: 'v1',
        body: 'First version',
        createdAt: '2024-01-01T00:00:00Z',
        Author: { username: 'alice' },
      },
    ],
  };

  // Records the versions the dropdown hands to the modal when an edit is opened.
  const ModalStub = {
    name: 'WikiRevisionDiffModal',
    props: ['open', 'oldVersion', 'newVersion', 'isMostRecent'],
    template: '<div class="modal-stub" />',
  };

  const mountOpened = async () => {
    const wrapper = mount(WikiEditsDropdown, {
      props: { wikiPage: orderedWikiPage },
      global: {
        stubs: {
          Teleport: { template: '<div><slot /></div>' },
          WikiRevisionDiffModal: ModalStub,
        },
      },
    });
    await wrapper.get('button').trigger('click');
    await nextTick();
    return wrapper;
  };

  it('summarizes the edit count and lists one row per pair', async () => {
    const wrapper = await mountOpened();

    expect(wrapper.text()).toContain('Edited 2 times');
    expect(wrapper.findAll('li')).toHaveLength(2);
  });

  it('flags the top row as the current revision', async () => {
    const wrapper = await mountOpened();
    expect(wrapper.findAll('li')[0].text()).toContain('(Current)');
  });

  it('compares the current content against the most recent past version', async () => {
    const wrapper = await mountOpened();

    await wrapper.findAll('li')[0].trigger('click');
    await nextTick();

    const modal = wrapper.findComponent(ModalStub);
    expect(modal.props('oldVersion').id).toBe('v2');
    expect(modal.props('newVersion').id).toBe('current');
    // Regression: the most-recent edit must flag the modal as current so the
    // "Current version" badge renders (previously broken object-identity check).
    expect(modal.props('isMostRecent')).toBe(true);
  });

  it('compares adjacent past versions for older edits', async () => {
    const wrapper = await mountOpened();

    await wrapper.findAll('li')[1].trigger('click');
    await nextTick();

    const modal = wrapper.findComponent(ModalStub);
    expect(modal.props('oldVersion').id).toBe('v1');
    expect(modal.props('newVersion').id).toBe('v2');
    expect(modal.props('isMostRecent')).toBe(false);
  });

  it('shows the edit reason for a revision', async () => {
    const wrapper = await mountOpened();

    expect(wrapper.text()).toContain('Edit reason:');
    expect(wrapper.text()).toContain('Fixed typos');
  });
});
