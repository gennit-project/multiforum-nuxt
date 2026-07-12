import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import ProfileKudosPreview from '@/components/scratchpad/ProfileKudosPreview.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  loading: null as unknown,
  error: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.result,
    loading: h.loading,
    error: h.error,
  }),
}));

const buildResult = (count: number) => ({
  scratchpadEntriesAggregate: { count },
  scratchpadEntries: Array.from({ length: count }, (_, index) => ({
    id: `entry-${index + 1}`,
    createdAt: '2026-07-10T12:00:00.000Z',
    text: `Kudos ${index + 1}`,
    Author: {
      username: `user-${index + 1}`,
      displayName: `User ${index + 1}`,
    },
  })),
});

const mountPreview = () =>
  mountWithDefaults(ProfileKudosPreview, {
    props: { username: 'alice' },
    global: {
      stubs: {
        RightArrowIcon: { template: '<i />' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="error">{{ text }}</div>' },
      },
    },
  });

beforeEach(() => {
  h.result = ref(buildResult(1));
  h.loading = ref(false);
  h.error = ref(null);
});

describe('ProfileKudosPreview', () => {
  it('hides the section when there are no public kudos', () => {
    h.result = ref(buildResult(0));
    const wrapper = mountPreview();

    expect(wrapper.find('[data-testid="profile-kudos-preview"]').exists()).toBe(
      false
    );
  });

  it('renders up to three preview entries', () => {
    h.result = ref(buildResult(3));
    const wrapper = mountPreview();

    expect(
      wrapper.findAll('[data-testid="profile-kudos-preview-entry"]')
    ).toHaveLength(3);
  });

  it('shows a see all link when there are more than three kudos', () => {
    h.result = ref(buildResult(4));
    const wrapper = mountPreview();

    expect(
      wrapper.findAll('[data-testid="profile-kudos-preview-entry"]')
    ).toHaveLength(3);
    expect(wrapper.get('[data-testid="profile-kudos-see-all"]').text()).toContain(
      'See all kudos'
    );
  });
});
