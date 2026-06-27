import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RevisionDiffContent from './RevisionDiffContent.vue';

// The three revision modals (discussion body / comment / wiki) and the wiki
// revision detail page all delegate their rendering to this single component,
// so its behavior is what "all three modals render consistently" actually means.

const baseProps = {
  oldVersion: {
    id: 'past-1',
    body: 'old content',
    createdAt: '2024-01-01T12:00:00.000Z',
    Author: { username: 'alice' },
  },
  newVersion: {
    id: 'current',
    body: 'new content',
    createdAt: '2024-01-02T12:00:00.000Z',
    Author: { username: 'bob' },
  },
};

describe('RevisionDiffContent', () => {
  it('renders from/to author metadata for both versions', () => {
    const wrapper = mount(RevisionDiffContent, { props: baseProps });

    const text = wrapper.text();
    expect(text).toContain('From version by alice');
    expect(text).toContain('To version by bob');
  });

  it('falls back to [Deleted] when a version has no author', () => {
    const wrapper = mount(RevisionDiffContent, {
      props: {
        ...baseProps,
        oldVersion: { ...baseProps.oldVersion, Author: null },
      },
    });

    expect(wrapper.text()).toContain('From version by [Deleted]');
  });

  it('shows the current-version badge only when isMostRecent is set', () => {
    const withBadge = mount(RevisionDiffContent, {
      props: { ...baseProps, isMostRecent: true },
    });
    expect(withBadge.text()).toContain('Current version');

    const withoutBadge = mount(RevisionDiffContent, {
      props: { ...baseProps, isMostRecent: false },
    });
    expect(withoutBadge.text()).not.toContain('Current version');
  });

  it('renders a side-by-side diff with previous and current content', () => {
    const wrapper = mount(RevisionDiffContent, { props: baseProps });
    const text = wrapper.text();

    // Both panes are present...
    expect(text).toContain('Previous Version');
    expect(text).toContain('Current Version');
    // ...and each shows its respective content.
    expect(text).toContain('old content');
    expect(text).toContain('new content');

    // The removed/added line cells carry the diff color classes.
    expect(wrapper.html()).toContain('bg-red-500/20');
    expect(wrapper.html()).toContain('bg-green-500/20');
  });

  it('displays the edit reason when present and hides it otherwise', () => {
    const withReason = mount(RevisionDiffContent, {
      props: {
        ...baseProps,
        newVersion: { ...baseProps.newVersion, editReason: 'Fixed a typo' },
      },
    });
    expect(withReason.text()).toContain('Edit reason:');
    expect(withReason.text()).toContain('Fixed a typo');

    const withoutReason = mount(RevisionDiffContent, { props: baseProps });
    expect(withoutReason.text()).not.toContain('Edit reason:');
  });

  it('collapses unchanged lines and reveals them when the toggle is clicked', async () => {
    const base = Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join(
      '\n'
    );
    const wrapper = mount(RevisionDiffContent, {
      props: {
        oldVersion: { ...baseProps.oldVersion, body: base },
        newVersion: {
          ...baseProps.newVersion,
          body: base.replace('line 6', 'line 6 EDITED'),
        },
      },
    });

    // Unchanged runs outside the 3-line context window start collapsed behind a
    // toggle, so leading lines are hidden until the user expands them.
    const showButtons = wrapper
      .findAll('button')
      .filter((b) => b.text() === 'Show 2 unchanged lines');
    expect(showButtons.length).toBeGreaterThan(0);
    expect(wrapper.text()).not.toContain('line 1');

    await showButtons[0].trigger('click');

    // Expanding reveals the previously hidden lines and removes that toggle.
    expect(wrapper.text()).toContain('line 1');
    expect(
      wrapper.findAll('button').filter((b) => b.text() === 'Show 2 unchanged lines')
    ).toHaveLength(0);
  });
});
