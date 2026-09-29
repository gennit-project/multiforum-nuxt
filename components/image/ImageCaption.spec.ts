import { describe, expect, it, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import ImageCaption from '@/components/image/ImageCaption.vue';

vi.mock('nuxt/app', () => ({
  useCookie: () => ({ value: 'dark' }),
  useHead: vi.fn(),
  useRoute: () => ({ params: {} }),
  useRouter: () => ({ push: vi.fn() }),
}));

const mountCaption = (text: string) =>
  mountWithDefaults(ImageCaption, {
    props: { text },
    global: {
      stubs: {
        WarningModal: true,
      },
    },
  });

describe('ImageCaption', () => {
  it('renders Markdown links as anchors', () => {
    const link = mountCaption('[Example](https://example.com)').get('a');

    expect(link.attributes('href')).toBe('https://example.com');
  });

  it('renders Markdown emphasis', () => {
    expect(mountCaption('A **bold** caption').get('strong').text()).toBe(
      'bold'
    );
  });

  it('sanitizes unsafe caption HTML', () => {
    expect(
      mountCaption('<script>alert(1)</script>').find('script').exists()
    ).toBe(false);
  });
});
