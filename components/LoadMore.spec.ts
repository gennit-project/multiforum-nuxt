import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import LoadMore from '@/components/LoadMore.vue';

const mountLoadMore = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(LoadMore, {
    props: { reachedEndOfResults: false, ...props },
  });

describe('LoadMore', () => {
  it('shows the end-of-results message when the end is reached', () => {
    const wrapper = mountLoadMore({ reachedEndOfResults: true });
    expect(wrapper.text()).toContain('Reached the end of the results.');
  });

  it('does not render the load-more button when the end is reached', () => {
    const wrapper = mountLoadMore({ reachedEndOfResults: true });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('shows the loading message while loading', () => {
    const wrapper = mountLoadMore({ loading: true });
    expect(wrapper.text()).toContain('Loading...');
  });

  it('shows the load-more button when not loading and more results remain', () => {
    const wrapper = mountLoadMore();
    expect(wrapper.get('button').text()).toBe('Load more');
  });

  it('emits loadMore when the button is clicked', async () => {
    const wrapper = mountLoadMore();
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('loadMore')).toHaveLength(1);
  });
});
