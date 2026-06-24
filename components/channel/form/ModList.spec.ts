import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ModList from '@/components/channel/form/ModList.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  loading: null as unknown,
  error: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, loading: h.loading, error: h.error }),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { forumId: 'cats' } }) }));

const withMods = (mods: unknown[]) => ({ channels: [{ Moderators: mods }] });

const mod = (overrides: Record<string, unknown> = {}) => ({
  displayName: 'mod1',
  User: { username: 'alice' },
  ...overrides,
});

const mountList = () =>
  mount(ModList, {
    global: {
      stubs: {
        AvatarComponent: true,
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

const removeButton = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text() === 'Remove Mod');

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(withMods([mod()]));
  h.loading = ref(false);
  h.error = ref(null);
});

describe('ModList states', () => {
  it('shows a loading message', () => {
    h.loading = ref(true);
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows an error message', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Error');
  });

  it('shows the empty message when there are no mods', () => {
    h.result = ref(withMods([]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('This forum has no mods');
  });

  it('shows the empty message when the channel is missing', () => {
    h.result = ref({ channels: [] });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('This forum has no mods');
  });
});

describe('ModList content', () => {
  it('renders a mod with its display name and username', () => {
    const wrapper = mountList();

    expect(wrapper.text()).toContain('mod1 (alice)');
  });

  it('emits click-remove-mod with the username', async () => {
    const wrapper = mountList();

    await removeButton(wrapper)!.trigger('click');

    expect(wrapper.emitted('click-remove-mod')?.[0]).toEqual(['alice']);
  });
});
