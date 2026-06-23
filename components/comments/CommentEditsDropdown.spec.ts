import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import CommentEditsDropdown from '@/components/comments/CommentEditsDropdown.vue';
import type { Comment } from '@/__generated__/graphql';

// authors[0] is the current author (most-recent edit); each past version is
// authored by the matching entry in `pastAuthors`.
const makeComment = (
  currentAuthor: string | null,
  pastAuthors: string[]
) =>
  ({
    text: 'current body',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    CommentAuthor: currentAuthor ? { username: currentAuthor } : null,
    PastVersions: pastAuthors.map((name, i) => ({
      id: `v${i}`,
      body: `old ${i}`,
      createdAt: `2024-01-0${pastAuthors.length - i}T00:00:00Z`,
      Author: { username: name },
    })),
  }) as unknown as Comment;

const mountDropdown = (comment: Comment) =>
  mount(CommentEditsDropdown, {
    props: { comment },
    global: {
      stubs: {
        Teleport: { template: '<div><slot /></div>' },
        CommentRevisionDiffModal: {
          name: 'CommentRevisionDiffModal',
          props: ['open', 'oldVersion', 'newVersion', 'isMostRecent'],
          emits: ['close', 'deleted'],
          template: '<div class="diff-modal" />',
        },
      },
    },
  });

const open = async (w: ReturnType<typeof mount>) => {
  await w.get('button').trigger('click');
};

describe('CommentEditsDropdown visibility', () => {
  it('renders nothing when the comment has no past versions', () => {
    const wrapper = mountDropdown(makeComment('alice', []));

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('renders the Edits trigger when there is at least one edit', () => {
    const wrapper = mountDropdown(makeComment('alice', ['bob']));

    expect(wrapper.get('button').text()).toBe('Edits');
  });
});

describe('CommentEditsDropdown contents', () => {
  it('summarizes the edit count', async () => {
    const wrapper = mountDropdown(makeComment('alice', ['bob', 'carol']));

    await open(wrapper);

    expect(wrapper.text()).toContain('Edited 2 times');
  });

  it('attributes the most recent edit to the current author', async () => {
    const wrapper = mountDropdown(makeComment('alice', ['bob']));

    await open(wrapper);

    expect(wrapper.get('li').text()).toContain('alice');
  });

  it('attributes an older edit to the past version author', async () => {
    const wrapper = mountDropdown(makeComment('alice', ['bob', 'carol']));

    await open(wrapper);

    expect(wrapper.findAll('li')[1].text()).toContain('carol');
  });

  it('falls back to [Deleted] when the author is unknown', async () => {
    const wrapper = mountDropdown(makeComment(null, ['bob']));

    await open(wrapper);

    expect(wrapper.get('li').text()).toContain('[Deleted]');
  });
});

describe('CommentEditsDropdown toggle', () => {
  it('closes when the trigger is clicked again', async () => {
    const wrapper = mountDropdown(makeComment('alice', ['bob']));

    await open(wrapper);
    await wrapper.get('button').trigger('click');

    expect(wrapper.find('li').exists()).toBe(false);
  });

  it('closes when a click lands outside', async () => {
    const wrapper = mountDropdown(makeComment('alice', ['bob']));
    await open(wrapper);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(wrapper.find('li').exists()).toBe(false);
  });
});

describe('CommentEditsDropdown diff modal', () => {
  it('opens the diff modal when an edit is clicked', async () => {
    const wrapper = mountDropdown(makeComment('alice', ['bob']));
    await open(wrapper);

    await wrapper.get('li').trigger('click');

    expect(
      wrapper.findComponent({ name: 'CommentRevisionDiffModal' }).exists()
    ).toBe(true);
  });

  it('closes the diff modal on the close event', async () => {
    const wrapper = mountDropdown(makeComment('alice', ['bob']));
    await open(wrapper);
    await wrapper.get('li').trigger('click');

    await wrapper
      .findComponent({ name: 'CommentRevisionDiffModal' })
      .vm.$emit('close');

    expect(
      wrapper.findComponent({ name: 'CommentRevisionDiffModal' }).exists()
    ).toBe(false);
  });

  it('closes the diff modal when a revision is deleted', async () => {
    const wrapper = mountDropdown(makeComment('alice', ['bob']));
    await open(wrapper);
    await wrapper.get('li').trigger('click');

    await wrapper
      .findComponent({ name: 'CommentRevisionDiffModal' })
      .vm.$emit('deleted', 'v0');

    expect(
      wrapper.findComponent({ name: 'CommentRevisionDiffModal' }).exists()
    ).toBe(false);
  });
});
