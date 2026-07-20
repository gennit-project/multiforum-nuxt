import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import DownloadNowButton from '@/components/channel/DownloadNowButton.vue';

describe('DownloadNowButton', () => {
  it('renders an enabled download button by default', () => {
    const wrapper = mountWithDefaults(DownloadNowButton);
    const button = wrapper.get('button');

    expect({
      disabled: button.attributes('disabled'),
      text: button.text(),
      classes: button.classes(),
    }).toEqual({
      disabled: undefined,
      text: 'Download Now',
      classes: expect.arrayContaining(['bg-orange-400']),
    });
  });

  it('paints a visible focus ring (ring width present, not just offset/color)', () => {
    const wrapper = mountWithDefaults(DownloadNowButton);

    expect(wrapper.get('button').classes()).toContain('focus:ring-2');
  });

  it('renders a disabled button state when disabled is true', () => {
    const wrapper = mountWithDefaults(DownloadNowButton, {
      props: { disabled: true },
    });
    const button = wrapper.get('button');

    expect({
      disabled: button.attributes('disabled'),
      classes: button.classes(),
    }).toEqual({
      disabled: '',
      classes: expect.arrayContaining(['bg-gray-200']),
    });
  });

  it('renders a review-specific label when provided', () => {
    const wrapper = mountWithDefaults(DownloadNowButton, {
      props: { label: 'Download for review' },
    });

    expect(wrapper.get('button').text()).toBe('Download for review');
  });
});
