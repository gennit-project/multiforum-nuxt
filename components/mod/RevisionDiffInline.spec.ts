import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import RevisionDiffInline from '@/components/mod/RevisionDiffInline.vue';

const version = (overrides: Record<string, unknown> = {}) => ({
  id: 'v1',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const mountDiff = (oldOverrides = {}, newOverrides = {}) =>
  mount(RevisionDiffInline, {
    props: {
      oldVersion: version(oldOverrides),
      newVersion: version({ id: 'v2', ...newOverrides }),
    },
  });

describe('RevisionDiffInline diff', () => {
  it('highlights a deletion on the left', () => {
    const wrapper = mountDiff({ body: 'hello world' }, { body: 'hello' });

    expect(wrapper.html()).toContain('bg-red-500/20');
  });

  it('highlights an insertion on the right', () => {
    const wrapper = mountDiff({ body: 'hello' }, { body: 'hello there' });

    expect(wrapper.html()).toContain('bg-green-500/20');
  });

  it('uses the title when there is no body', () => {
    const wrapper = mountDiff(
      { title: 'Old Title' },
      { title: 'Old Title' }
    );

    expect(wrapper.text()).toContain('Old Title');
  });

  it('always renders the Previous and Current labels', () => {
    const wrapper = mountDiff({ body: 'a' }, { body: 'b' });

    expect(wrapper.text()).toContain('Previous');
  });

  it('renders the legend', () => {
    const wrapper = mountDiff({ body: 'a' }, { body: 'b' });

    expect(wrapper.text()).toContain('Removed');
  });
});

describe('RevisionDiffInline edit reason', () => {
  it('shows the edit reason from the new version', () => {
    const wrapper = mountDiff({}, { editReason: 'Fixed a typo' });

    expect(wrapper.text()).toContain('Fixed a typo');
  });

  it('falls back to the old version edit reason', () => {
    const wrapper = mountDiff({ editReason: 'Old reason' }, {});

    expect(wrapper.text()).toContain('Old reason');
  });

  it('omits the reason block when there is no reason', () => {
    const wrapper = mountDiff({ body: 'a' }, { body: 'b' });

    expect(wrapper.text()).not.toContain('Edit reason:');
  });

  it('labels rules-based reasons as "Edit details:"', () => {
    const wrapper = mountDiff({}, { editReason: 'Forum rules: no spam' });

    expect(wrapper.text()).toContain('Edit details:');
  });

  it('labels other reasons as "Edit reason:"', () => {
    const wrapper = mountDiff({}, { editReason: 'Just because' });

    expect(wrapper.text()).toContain('Edit reason:');
  });
});
