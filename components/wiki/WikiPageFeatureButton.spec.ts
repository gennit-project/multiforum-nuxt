import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

import WikiPageFeatureButton from './WikiPageFeatureButton.vue';

const h = vi.hoisted(() => ({
  isAuthenticated: { value: true },
  username: { value: 'alice' },
  adminUsernames: { value: ['alice'] as string[] },
  featuredIds: [] as string[],
  success: vi.fn(),
  error: vi.fn(),
  mutate: vi.fn(),
  doneHandlers: [] as Array<(result: unknown) => void>,
  errorHandlers: [] as Array<(error: Error) => void>,
}));

vi.mock('@/config', () => ({ config: { serverName: 'test-server' } }));

vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => h.isAuthenticated,
  useUsername: () => h.username,
}));

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({
    serverAdminUsernames: h.adminUsernames,
    serverModProfileNames: ref([]),
  }),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: h.success, error: h.error }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref({
      serverConfigs: [{ featuredWikiPageIds: h.featuredIds }],
    }),
  }),
  useMutation: () => ({
    mutate: h.mutate,
    loading: ref(false),
    onDone: (handler: (result: unknown) => void) =>
      h.doneHandlers.push(handler),
    onError: (handler: (error: Error) => void) => h.errorHandlers.push(handler),
  }),
}));

const mountButton = () =>
  mount(WikiPageFeatureButton, { props: { wikiPageId: 'wiki-1' } });

beforeEach(() => {
  vi.clearAllMocks();
  h.isAuthenticated.value = true;
  h.username.value = 'alice';
  h.adminUsernames.value = ['alice'];
  h.featuredIds = [];
  h.doneHandlers = [];
  h.errorHandlers = [];
});

describe('WikiPageFeatureButton', () => {
  it('appends the page to the featured list when featuring', async () => {
    h.featuredIds = ['wiki-0'];
    const wrapper = mountButton();

    await wrapper.get('button').trigger('click');

    expect(h.mutate).toHaveBeenCalledWith({
      serverName: 'test-server',
      wikiPageIds: ['wiki-0', 'wiki-1'],
    });
  });

  it('removes only this page when it is already featured', async () => {
    h.featuredIds = ['wiki-0', 'wiki-1'];
    const wrapper = mountButton();

    await wrapper.get('button').trigger('click');

    expect(h.mutate).toHaveBeenCalledWith({
      serverName: 'test-server',
      wikiPageIds: ['wiki-0'],
    });
  });

  it('labels the button by featured state', () => {
    h.featuredIds = ['wiki-1'];
    const wrapper = mountButton();

    expect(wrapper.text()).toBe('Remove from featured');
  });

  it('hides for a signed-in user who is not a server admin', () => {
    h.username.value = 'bob';
    const wrapper = mountButton();

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('hides for signed-out visitors', () => {
    h.isAuthenticated.value = false;
    const wrapper = mountButton();

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('shows a toast when the mutation fails', () => {
    mountButton();

    h.errorHandlers.forEach((handler) => handler(new Error('denied')));

    expect(h.error).toHaveBeenCalledWith(
      'Could not update featured wiki pages: denied'
    );
  });

  it.each([
    [['wiki-1'], 'Wiki page featured on the site wiki list.'],
    [[], 'Wiki page removed from featured pages.'],
  ])('toasts from the saved list %j', (savedIds, message) => {
    mountButton();

    h.doneHandlers.forEach((handler) =>
      handler({
        data: { setFeaturedWikiPages: { featuredWikiPageIds: savedIds } },
      })
    );

    expect(h.success).toHaveBeenCalledWith(message);
  });
});
