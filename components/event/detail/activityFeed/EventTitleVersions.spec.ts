import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import EventTitleVersions from './EventTitleVersions.vue';

vi.mock('@/utils', () => ({ timeAgo: () => 'just now' }));

// PastTitleVersions are returned newest-first by the query.
const buildEvent = (overrides: Record<string, unknown> = {}) => ({
  title: 'Current Title',
  PastTitleVersions: [
    {
      id: 'v2',
      body: 'Second Title',
      createdAt: '2024-02-01T00:00:00Z',
      Author: { username: 'bob' },
    },
    {
      id: 'v1',
      body: 'First Title',
      createdAt: '2024-01-01T00:00:00Z',
      Author: { username: 'alice' },
    },
  ],
  ...overrides,
});

const mountVersions = (event: Record<string, unknown>) =>
  mount(EventTitleVersions, { props: { event: event as never } });

describe('EventTitleVersions', () => {
  it('renders nothing when there are no past title versions', () => {
    const wrapper = mountVersions(buildEvent({ PastTitleVersions: [] }));
    expect(wrapper.text()).toBe('');
  });

  it('shows the most recent title change with old (strikethrough) → new and author', () => {
    const wrapper = mountVersions(buildEvent());

    expect(wrapper.text()).toContain('Title Edit History');
    expect(wrapper.text()).toContain('bob');
    expect(wrapper.text()).toContain('Current Title');

    const struck = wrapper.findAll('.line-through').map((s) => s.text());
    expect(struck).toContain('Second Title');

    expect(wrapper.text()).not.toContain('First Title');
  });

  it('expands older edits on demand', async () => {
    const wrapper = mountVersions(buildEvent());

    const showButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Show 1 older edit'));
    expect(showButton).toBeTruthy();

    await showButton!.trigger('click');

    expect(wrapper.text()).toContain('First Title');
  });

  it('attributes the older edit to its author when expanded', async () => {
    const wrapper = mountVersions(buildEvent());
    const showButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Show 1 older edit'));
    await showButton!.trigger('click');

    expect(wrapper.text()).toContain('alice');
  });

  it('falls back to [Deleted] when a past version has no author', () => {
    const wrapper = mountVersions(
      buildEvent({
        PastTitleVersions: [
          {
            id: 'v1',
            body: 'First Title',
            createdAt: '2024-01-01T00:00:00Z',
            Author: null,
          },
        ],
      })
    );

    expect(wrapper.text()).toContain('[Deleted]');
  });
});
