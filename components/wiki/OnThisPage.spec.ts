import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import OnThisPage from '@/components/wiki/OnThisPage.vue';

const h = vi.hoisted(() => ({
  headings: null as unknown,
  scrollToHeading: vi.fn(),
}));

vi.mock('@/composables/useMarkdownHeadings', () => ({
  useMarkdownHeadings: () => ({
    headings: h.headings,
    scrollToHeading: h.scrollToHeading,
  }),
}));

const mountToc = (props: Record<string, unknown> = {}) =>
  mount(OnThisPage, {
    props: { markdownContent: '# hi', ...props },
    global: { stubs: { ChevronDownIcon: true } },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.headings = ref([
    { id: '1', anchor: 'intro', text: 'Intro', level: 1 },
    { id: '2', anchor: 'sub', text: 'Sub', level: 2 },
    { id: '3', anchor: 'deep', text: 'Too Deep', level: 5 },
  ]);
});

describe('OnThisPage rendering', () => {
  it('renders nothing when there are no headings', () => {
    h.headings = ref([]);
    const wrapper = mountToc();

    expect(wrapper.text()).toBe('');
  });

  it('renders the On This Page heading on desktop', () => {
    const wrapper = mountToc();

    expect(wrapper.text()).toContain('On This Page');
  });

  it('lists headings up to level 4 only', () => {
    const wrapper = mountToc();

    // 2 of 3 headings (level 5 excluded); no mobile toggle button on desktop
    expect(wrapper.findAll('button')).toHaveLength(2);
  });

  it('shows the heading text', () => {
    const wrapper = mountToc();

    expect(wrapper.text()).toContain('Intro');
  });
});

describe('OnThisPage navigation', () => {
  it('scrolls to the heading on click', async () => {
    const wrapper = mountToc();

    await wrapper.findAll('button')[0].trigger('click');

    expect(h.scrollToHeading).toHaveBeenCalledWith('intro');
  });

  it('marks the clicked heading active', async () => {
    const wrapper = mountToc();

    await wrapper.findAll('button')[0].trigger('click');

    expect(wrapper.findAll('button')[0].classes()).toContain('bg-orange-100');
  });

  it('updates the URL hash on click', async () => {
    const wrapper = mountToc();

    await wrapper.findAll('button')[0].trigger('click');

    expect(window.location.hash).toBe('#intro');
  });
});

describe('OnThisPage scroll spy', () => {
  it('activates the last heading scrolled past', async () => {
    const intro = document.createElement('div');
    intro.id = 'intro';
    Object.defineProperty(intro, 'offsetTop', { value: 0, configurable: true });
    const sub = document.createElement('div');
    sub.id = 'sub';
    Object.defineProperty(sub, 'offsetTop', { value: 500, configurable: true });
    document.body.append(intro, sub);
    Object.defineProperty(window, 'scrollY', { value: 1000, configurable: true });

    const wrapper = mountToc();
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();

    expect(
      wrapper.findAll('button').find((b) => b.text() === 'Sub')?.classes()
    ).toContain('bg-orange-100');
    document.body.innerHTML = '';
  });
});

describe('OnThisPage mobile', () => {
  it('hides the heading list until the dropdown is opened', () => {
    const wrapper = mountToc({ isMobile: true });

    expect(wrapper.find('nav').exists()).toBe(false);
  });

  it('opens the dropdown on toggle', async () => {
    const wrapper = mountToc({ isMobile: true });

    await wrapper.get('button').trigger('click');

    expect(wrapper.find('nav').exists()).toBe(true);
  });

  it('closes the dropdown after selecting a heading', async () => {
    const wrapper = mountToc({ isMobile: true });
    await wrapper.get('button').trigger('click');

    await wrapper.findAll('nav button')[0].trigger('click');

    expect(wrapper.find('nav').exists()).toBe(false);
  });
});
