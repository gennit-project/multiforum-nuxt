import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AvatarComponent from './AvatarComponent.vue';

describe('AvatarComponent', () => {
  it('renders the provided src when given', () => {
    const wrapper = mount(AvatarComponent, {
      props: { text: 'alice', src: 'https://img.test/a.png' },
    });
    expect(wrapper.find('img').attributes('src')).toBe('https://img.test/a.png');
  });

  it('generates an identicon data URI when no src is provided', () => {
    const wrapper = mount(AvatarComponent, { props: { text: 'alice' } });
    expect(wrapper.find('img').attributes('src')).toContain(
      'data:image/svg+xml;base64,'
    );
  });

  it('uses the text as the alt by default', () => {
    const wrapper = mount(AvatarComponent, { props: { text: 'alice' } });
    expect(wrapper.find('img').attributes('alt')).toBe('alice');
  });

  it('hides a decorative avatar from assistive tech', () => {
    const wrapper = mount(AvatarComponent, {
      props: { text: 'alice', isDecorative: true },
    });
    expect([
      wrapper.find('img').attributes('alt'),
      wrapper.find('img').attributes('aria-hidden'),
    ]).toEqual(['', 'true']);
  });

  it('applies the large size class when isLarge is set', () => {
    const wrapper = mount(AvatarComponent, {
      props: { text: 'alice', isLarge: true },
    });
    expect(wrapper.find('img').classes()).toContain('h-48');
  });
});
