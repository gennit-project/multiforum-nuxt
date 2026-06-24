import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import PendingInvite from '@/components/mod/PendingInvite.vue';

const h = vi.hoisted(() => ({
  // useQuery is called twice: [0] owner invite, [1] mod invite.
  queryResults: [] as unknown[],
  queryIndex: { n: 0 },
  // useMutation is called twice: [0] accept owner, [1] accept mod.
  ownerMutate: vi.fn(),
  ownerError: null as unknown,
  ownerOnDone: undefined as undefined | (() => void),
  modMutate: vi.fn(),
  modError: null as unknown,
  modOnDone: undefined as undefined | (() => void),
  mutIndex: { n: 0 },
  username: null as unknown,
  route: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.queryResults[h.queryIndex.n++] }),
  useMutation: () => {
    const i = h.mutIndex.n++;
    return i === 0
      ? {
          mutate: h.ownerMutate,
          loading: ref(false),
          error: h.ownerError,
          onDone: (cb: () => void) => {
            h.ownerOnDone = cb;
          },
        }
      : {
          mutate: h.modMutate,
          loading: ref(false),
          error: h.modError,
          onDone: (cb: () => void) => {
            h.modOnDone = cb;
          },
        };
  },
}));
vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));
vi.mock('@/composables/useAuthState', () => ({ useUsername: () => h.username }));

const ownerInvite = () => ref({ channels: [{ PendingOwnerInvites: [{ username: 'alice' }] }] });
const modInvite = () => ref({ channels: [{ PendingModInvites: [{ username: 'alice' }] }] });
const noInvite = () => ref({ channels: [{}] });

const mountInvite = () =>
  mount(PendingInvite, {
    global: {
      stubs: {
        PrimaryButton: {
          name: 'PrimaryButton',
          props: ['label', 'loading'],
          emits: ['click'],
          template: '<button @click="$emit(\'click\')">{{ label }}</button>',
        },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.queryIndex.n = 0;
  h.mutIndex.n = 0;
  h.queryResults = [noInvite(), noInvite()];
  h.ownerError = ref(null);
  h.modError = ref(null);
  h.ownerOnDone = undefined;
  h.modOnDone = undefined;
  h.username = ref('alice');
  h.route = { params: { forumId: 'cats' } };
});

describe('PendingInvite display', () => {
  it('shows no-invite message by default', () => {
    const wrapper = mountInvite();

    expect(wrapper.text()).toContain('no pending invites');
  });

  it('shows the owner invite message', () => {
    h.queryResults = [ownerInvite(), noInvite()];
    const wrapper = mountInvite();

    expect(wrapper.text()).toContain('invited to be an owner');
  });

  it('shows the mod invite message', () => {
    h.queryResults = [noInvite(), modInvite()];
    const wrapper = mountInvite();

    expect(wrapper.text()).toContain('invited to be a moderator');
  });

  it('ignores an invite addressed to a different user', () => {
    h.username = ref('bob');
    h.queryResults = [ownerInvite(), noInvite()];
    const wrapper = mountInvite();

    expect(wrapper.text()).toContain('no pending invites');
  });
});

describe('PendingInvite accept owner', () => {
  it('calls the owner mutation with the channel id', async () => {
    h.queryResults = [ownerInvite(), noInvite()];
    const wrapper = mountInvite();

    await wrapper.get('button').trigger('click');

    expect(h.ownerMutate).toHaveBeenCalledWith({ channelId: 'cats' });
  });

  it('shows a success message after the owner invite is accepted', async () => {
    h.queryResults = [ownerInvite(), noInvite()];
    const wrapper = mountInvite();

    h.ownerOnDone?.();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Invite accepted!');
  });

  it('shows an error banner on owner accept failure', () => {
    h.queryResults = [ownerInvite(), noInvite()];
    h.ownerError = ref({ message: 'boom' });
    const wrapper = mountInvite();

    expect(wrapper.find('.err').text()).toContain('boom');
  });
});

describe('PendingInvite accept mod', () => {
  it('calls the mod mutation with the channel id', async () => {
    h.queryResults = [noInvite(), modInvite()];
    const wrapper = mountInvite();

    await wrapper.get('button').trigger('click');

    expect(h.modMutate).toHaveBeenCalledWith({ channelId: 'cats' });
  });

  it('shows a success message after the mod invite is accepted', async () => {
    h.queryResults = [noInvite(), modInvite()];
    const wrapper = mountInvite();

    h.modOnDone?.();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Invite accepted!');
  });
});
