import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ImageReportsList from '@/components/admin/ImageReportsList.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  loading: null as unknown,
  error: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, loading: h.loading, error: h.error }),
}));

const report = (overrides: Record<string, unknown> = {}) => ({
  id: 'r1',
  issueNumber: 1,
  isOpen: true,
  title: 'Bad image',
  Author: { __typename: 'User', username: 'alice' },
  createdAt: '2024-01-01T00:00:00Z',
  ActivityFeedAggregate: { count: 1 },
  relatedImageId: 'img1',
  ...overrides,
});

const mountList = () =>
  mount(ImageReportsList, {
    global: { stubs: { NuxtLink: { props: ['to'], template: '<a><slot /></a>' } } },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref({ issues: [report()] });
  h.loading = ref(false);
  h.error = ref(null);
});

describe('ImageReportsList states', () => {
  it('shows a loading message', () => {
    h.loading = ref(true);
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows an error message', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('boom');
  });

  it('shows an empty message when there are no reports', () => {
    h.result = ref({ issues: [] });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('No image reports');
  });

  it('shows the report count', () => {
    h.result = ref({ issues: [report(), report({ id: 'r2', issueNumber: 2 })] });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('2 report(s)');
  });

  it('shows the report title', () => {
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Bad image');
  });
});

describe('ImageReportsList image type', () => {
  it.each([
    [{ relatedProfilePicUserId: 'u1' }, 'Profile Picture'],
    [{ relatedChannelIconName: 'icon.png' }, 'Channel Icon'],
    [{ relatedChannelBannerName: 'banner.png' }, 'Channel Banner'],
    [{ relatedImageId: 'img1' }, 'Album Image'],
    [{}, 'Image'],
  ])('labels %o as "%s"', (fields, label) => {
    h.result = ref({
      issues: [
        report({
          relatedImageId: null,
          relatedProfilePicUserId: null,
          relatedChannelIconName: null,
          relatedChannelBannerName: null,
          ...fields,
        }),
      ],
    });
    const wrapper = mountList();

    expect(wrapper.text()).toContain(label);
  });
});
