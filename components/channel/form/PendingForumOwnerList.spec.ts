import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import PendingForumOwnerList from '@/components/channel/form/PendingForumOwnerList.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  loading: null as unknown,
  error: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, loading: h.loading, error: h.error }),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { forumId: 'cats' } }) }));

const withInvites = (invites: unknown[]) => ({
  channels: [{ PendingOwnerInvites: invites }],
});

const mountList = () =>
  mount(PendingForumOwnerList, {
    global: {
      stubs: {
        AvatarComponent: true,
        UsernameWithTooltip: { name: 'UsernameWithTooltip', props: ['username'], template: '<span>{{ username }}</span>' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

const cancelButton = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text() === 'Cancel Invite');

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(withInvites([{ username: 'alice' }]));
  h.loading = ref(false);
  h.error = ref(null);
});

describe('PendingForumOwnerList', () => {
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

  it('shows the empty message when there are no invites', () => {
    h.result = ref(withInvites([]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('no pending owner invites');
  });

  it('renders a pending invite', () => {
    const wrapper = mountList();

    expect(wrapper.text()).toContain('alice');
  });

  it('emits click-cancel-invite with the username', async () => {
    const wrapper = mountList();

    await cancelButton(wrapper)!.trigger('click');

    expect(wrapper.emitted('click-cancel-invite')?.[0]).toEqual(['alice']);
  });
});
