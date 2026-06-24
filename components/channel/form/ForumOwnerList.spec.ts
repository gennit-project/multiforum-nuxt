import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ForumOwnerList from '@/components/channel/form/ForumOwnerList.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  loading: null as unknown,
  error: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, loading: h.loading, error: h.error }),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { forumId: 'cats' } }) }));

const withAdmins = (admins: unknown[]) => ({ channels: [{ Admins: admins }] });

const mountList = () =>
  mount(ForumOwnerList, {
    global: {
      stubs: {
        AvatarComponent: true,
        UsernameWithTooltip: { name: 'UsernameWithTooltip', props: ['username'], template: '<span>{{ username }}</span>' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

const removeButton = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text() === 'Remove Admin');

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(withAdmins([{ username: 'alice' }]));
  h.loading = ref(false);
  h.error = ref(null);
});

describe('ForumOwnerList states', () => {
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

  it('shows the empty message when there are no owners', () => {
    h.result = ref(withAdmins([]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('This forum has no owners');
  });

  it('shows the empty message when the channel is missing', () => {
    h.result = ref({ channels: [] });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('This forum has no owners');
  });
});

describe('ForumOwnerList content', () => {
  it('renders an owner', () => {
    const wrapper = mountList();

    expect(wrapper.text()).toContain('alice');
  });

  it('emits click-remove-owner with the username', async () => {
    const wrapper = mountList();

    await removeButton(wrapper)!.trigger('click');

    expect(wrapper.emitted('click-remove-owner')?.[0]).toEqual(['alice']);
  });
});
