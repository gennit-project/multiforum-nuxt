import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import InfoBanner from '@/components/InfoBanner.vue';

const stubs = {
  // MarkdownRenderer renders the body text; stub it so the spec stays focused
  // on InfoBanner's own conditional rendering.
  MarkdownRenderer: {
    props: ['text'],
    template: '<div class="md-stub">{{ text }}</div>',
  },
  InfoIcon: { template: '<svg class="info-icon-stub" />' },
};

const mountBanner = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(InfoBanner, {
    props: { text: 'Body text', ...props },
    global: { stubs },
  });

describe('InfoBanner', () => {
  it('renders the body text through the markdown renderer', () => {
    const wrapper = mountBanner({ text: 'Hello world' });
    expect(wrapper.get('.md-stub').text()).toBe('Hello world');
  });

  it('renders the header text when provided', () => {
    const wrapper = mountBanner({ headerText: 'Heads up' });
    expect(wrapper.text()).toContain('Heads up');
  });

  it('omits the header element when headerText is empty', () => {
    const wrapper = mountBanner();
    expect(wrapper.find('p.font-bold').exists()).toBe(false);
  });

  it('applies the provided test id', () => {
    const wrapper = mountBanner({ testId: 'my-banner' });
    expect(wrapper.find('[data-testid="my-banner"]').exists()).toBe(true);
  });

  it('falls back to the default info icon when no slot is given', () => {
    const wrapper = mountBanner();
    expect(wrapper.find('.info-icon-stub').exists()).toBe(true);
  });
});
