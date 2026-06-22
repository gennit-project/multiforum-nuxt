import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import EditsDropdown from '@/components/discussion/detail/activityFeed/EditsDropdown.vue';
import type { Discussion } from '@/__generated__/graphql';

// Build a discussion whose body has been edited `authors.length` times. authors[0]
// is the most recent editor (BodyLastEditedBy); each past version is authored by
// the next name in the list.
const makeDiscussion = (
  authors: (string | null)[],
  overrides: Record<string, unknown> = {}
) =>
  ({
    body: 'current body',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    BodyLastEditedBy: authors[0] ? { username: authors[0] } : null,
    PastBodyVersions: authors.map((_, i) => ({
      id: `v${i}`,
      body: `old body ${i}`,
      // newest past version first so ordering is deterministic
      createdAt: `2024-01-0${authors.length - i}T00:00:00Z`,
      Author: authors[i + 1] ? { username: authors[i + 1] } : null,
    })),
    ...overrides,
  }) as unknown as Discussion;

const mountDropdown = (discussion: Discussion) =>
  mount(EditsDropdown, {
    props: { discussion },
    global: {
      stubs: {
        Teleport: { template: '<div><slot /></div>' },
        RevisionDiffModal: {
          name: 'RevisionDiffModal',
          props: ['open', 'oldVersion', 'newVersion', 'isMostRecent'],
          emits: ['close', 'deleted'],
          template: '<div class="diff-modal" />',
        },
      },
    },
  });

const openDropdown = async (wrapper: ReturnType<typeof mount>) => {
  await wrapper.get('button').trigger('click');
};

describe('EditsDropdown visibility', () => {
  it('renders nothing when the discussion has no past versions', () => {
    const wrapper = mountDropdown(makeDiscussion([]));

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('renders the Edits trigger when there is at least one edit', () => {
    const wrapper = mountDropdown(makeDiscussion(['alice']));

    expect(wrapper.get('button').text()).toBe('Edits');
  });
});

describe('EditsDropdown contents', () => {
  it('summarizes the number of edits', async () => {
    const wrapper = mountDropdown(makeDiscussion(['alice', 'bob']));

    await openDropdown(wrapper);

    expect(wrapper.text()).toContain('Edited 2 times');
  });

  it('attributes the most recent edit to BodyLastEditedBy', async () => {
    const wrapper = mountDropdown(makeDiscussion(['alice', 'bob']));

    await openDropdown(wrapper);

    expect(wrapper.findAll('li')[0].text()).toContain('alice');
  });

  it('attributes an older edit to the next version author', async () => {
    const wrapper = mountDropdown(makeDiscussion(['alice', 'bob']));

    await openDropdown(wrapper);

    expect(wrapper.findAll('li')[1].text()).toContain('bob');
  });

  it('falls back to [Deleted] when the editor is unknown', async () => {
    const wrapper = mountDropdown(makeDiscussion([null]));

    await openDropdown(wrapper);

    expect(wrapper.get('li').text()).toContain('[Deleted]');
  });
});

describe('EditsDropdown toggle', () => {
  it('closes the dropdown when the trigger is clicked again', async () => {
    const wrapper = mountDropdown(makeDiscussion(['alice']));

    await openDropdown(wrapper);
    await wrapper.get('button').trigger('click');

    expect(wrapper.find('li').exists()).toBe(false);
  });

  it('closes when a click lands outside the dropdown', async () => {
    const wrapper = mountDropdown(makeDiscussion(['alice']));
    await openDropdown(wrapper);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(wrapper.find('li').exists()).toBe(false);
  });
});

describe('EditsDropdown revision modal', () => {
  it('opens the diff modal when an edit is clicked', async () => {
    const wrapper = mountDropdown(makeDiscussion(['alice']));
    await openDropdown(wrapper);

    await wrapper.get('li').trigger('click');

    expect(wrapper.findComponent({ name: 'RevisionDiffModal' }).exists()).toBe(
      true
    );
  });

  it('closes the diff modal on the modal close event', async () => {
    const wrapper = mountDropdown(makeDiscussion(['alice']));
    await openDropdown(wrapper);
    await wrapper.get('li').trigger('click');

    await wrapper.findComponent({ name: 'RevisionDiffModal' }).vm.$emit('close');

    expect(wrapper.findComponent({ name: 'RevisionDiffModal' }).exists()).toBe(
      false
    );
  });

  it('closes the diff modal when a revision is deleted', async () => {
    const wrapper = mountDropdown(makeDiscussion(['alice']));
    await openDropdown(wrapper);
    await wrapper.get('li').trigger('click');

    await wrapper
      .findComponent({ name: 'RevisionDiffModal' })
      .vm.$emit('deleted', 'v0');

    expect(wrapper.findComponent({ name: 'RevisionDiffModal' }).exists()).toBe(
      false
    );
  });
});
