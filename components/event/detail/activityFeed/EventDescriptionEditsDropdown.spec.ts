import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import EventDescriptionEditsDropdown from '@/components/event/detail/activityFeed/EventDescriptionEditsDropdown.vue';
import type { Event } from '@/__generated__/graphql';

// Build an event whose description has been edited `authors.length` times.
// authors[0] is the most recent editor (DescriptionLastEditedBy); each past
// version is authored by the next name in the list.
const makeEvent = (
  authors: (string | null)[],
  overrides: Record<string, unknown> = {}
) =>
  ({
    description: 'current description',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    DescriptionLastEditedBy: authors[0] ? { username: authors[0] } : null,
    PastDescriptionVersions: authors.map((_, i) => ({
      id: `v${i}`,
      body: `old description ${i}`,
      createdAt: `2024-01-0${authors.length - i}T00:00:00Z`,
      Author: authors[i + 1] ? { username: authors[i + 1] } : null,
    })),
    ...overrides,
  }) as unknown as Event;

const mountDropdown = (event: Event) =>
  mount(EventDescriptionEditsDropdown, {
    props: { event },
    global: {
      stubs: {
        Teleport: { template: '<div><slot /></div>' },
        RevisionDiffModal: {
          name: 'RevisionDiffModal',
          props: ['open', 'oldVersion', 'newVersion', 'isMostRecent', 'deleteMutation'],
          emits: ['close', 'deleted'],
          template: '<div class="diff-modal" />',
        },
      },
    },
  });

const openDropdown = async (wrapper: ReturnType<typeof mount>) => {
  await wrapper.get('button').trigger('click');
};

describe('EventDescriptionEditsDropdown visibility', () => {
  it('renders nothing when the event has no past description versions', () => {
    const wrapper = mountDropdown(makeEvent([]));

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('renders the Edits trigger when there is at least one edit', () => {
    const wrapper = mountDropdown(makeEvent(['alice']));

    expect(wrapper.get('button').text()).toBe('Edits');
  });
});

describe('EventDescriptionEditsDropdown contents', () => {
  it('summarizes the number of edits', async () => {
    const wrapper = mountDropdown(makeEvent(['alice', 'bob']));

    await openDropdown(wrapper);

    expect(wrapper.text()).toContain('Edited 2 times');
  });

  it('attributes the most recent edit to DescriptionLastEditedBy', async () => {
    const wrapper = mountDropdown(makeEvent(['alice', 'bob']));

    await openDropdown(wrapper);

    expect(wrapper.findAll('li')[0].text()).toContain('alice');
  });

  it('attributes an older edit to the next version author', async () => {
    const wrapper = mountDropdown(makeEvent(['alice', 'bob']));

    await openDropdown(wrapper);

    expect(wrapper.findAll('li')[1].text()).toContain('bob');
  });

  it('falls back to [Deleted] when the editor is unknown', async () => {
    const wrapper = mountDropdown(makeEvent([null]));

    await openDropdown(wrapper);

    expect(wrapper.get('li').text()).toContain('[Deleted]');
  });
});

describe('EventDescriptionEditsDropdown revision modal', () => {
  it('opens the diff modal when an edit is clicked', async () => {
    const wrapper = mountDropdown(makeEvent(['alice']));
    await openDropdown(wrapper);

    await wrapper.get('li').trigger('click');

    expect(wrapper.findComponent({ name: 'RevisionDiffModal' }).exists()).toBe(
      true
    );
  });

  it('passes the event description delete mutation to the diff modal', async () => {
    const wrapper = mountDropdown(makeEvent(['alice']));
    await openDropdown(wrapper);
    await wrapper.get('li').trigger('click');

    expect(
      wrapper.findComponent({ name: 'RevisionDiffModal' }).props('deleteMutation')
    ).toBeTruthy();
  });

  it('closes the diff modal when a revision is deleted', async () => {
    const wrapper = mountDropdown(makeEvent(['alice']));
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

describe('EventDescriptionEditsDropdown toggle', () => {
  it('closes when a click lands outside the dropdown', async () => {
    const wrapper = mountDropdown(makeEvent(['alice']));
    await openDropdown(wrapper);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(wrapper.find('li').exists()).toBe(false);
  });
});
