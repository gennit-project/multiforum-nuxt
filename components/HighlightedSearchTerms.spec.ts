import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';

const mountHighlight = (props: Record<string, unknown>) =>
  mountWithDefaults(HighlightedSearchTerms, { props });

describe('HighlightedSearchTerms', () => {
  it('renders the full text when there is no search input', () => {
    const wrapper = mountHighlight({ text: 'hello world' });
    expect(wrapper.text()).toContain('hello world');
  });

  it('wraps the matching term in a <mark>', () => {
    const wrapper = mountHighlight({ text: 'hello world', searchInput: 'world' });
    expect(wrapper.find('mark').text()).toBe('world');
  });

  it('matches the term case-insensitively', () => {
    const wrapper = mountHighlight({ text: 'Hello World', searchInput: 'world' });
    expect(wrapper.find('mark').exists()).toBe(true);
  });

  it('renders no <mark> when the term does not occur', () => {
    const wrapper = mountHighlight({ text: 'hello', searchInput: 'zzz' });
    expect(wrapper.find('mark').exists()).toBe(false);
  });
});
