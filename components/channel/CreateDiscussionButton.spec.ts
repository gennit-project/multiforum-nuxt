import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRoute } from '@/tests/utils/mockRouter';
import CreateButton from '@/components/CreateButton.vue';

import CreateDiscussionButton from '@/components/channel/CreateDiscussionButton.vue';

const route = createMockRoute({
  name: 'DiscussionDetail',
  params: { forumId: 'cats' },
});

vi.mock('nuxt/app', () => ({ useRoute: () => route }));

const mountButton = () =>
  mountWithDefaults(CreateDiscussionButton, {
    global: { stubs: { CreateButton: true, PrimaryButton: true } },
  });

describe('CreateDiscussionButton', () => {
  it('links the create button to the forum from the route', () => {
    route.name = 'DiscussionDetail';
    const wrapper = mountButton();
    expect(wrapper.findComponent(CreateButton).props('to')).toBe(
      '/forums/cats/discussions/create'
    );
  });

  it('renders nothing outside the discussion detail route', () => {
    route.name = 'SomethingElse';
    const wrapper = mountButton();
    expect(wrapper.findComponent(CreateButton).exists()).toBe(false);
  });
});
