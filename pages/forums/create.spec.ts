import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, h as createEl } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import CreateForumPage from './create.vue';

const h = vi.hoisted(() => ({
  mutate: null as unknown as ReturnType<typeof vi.fn>,
  push: null as unknown as ReturnType<typeof vi.fn>,
  onDoneCb: null as unknown as (r: unknown) => void,
  onErrorCb: null as unknown as () => void,
}));

vi.mock('nuxt/app', () => ({
  useRouter: () => ({ push: h.push }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.mutate = vi.fn();
  h.push = vi.fn();
  return {
    useMutation: () => ({
      mutate: h.mutate,
      error: ref(null),
      loading: ref(false),
      onDone: (cb: (r: unknown) => void) => {
        h.onDoneCb = cb;
      },
      onError: (cb: () => void) => {
        h.onErrorCb = cb;
      },
    }),
  };
});

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return { useUsername: () => ref('alice') };
});

vi.mock('@/composables/useSuspensionNotice', async () => {
  const { ref } = await import('vue');
  return {
    useServerSuspensionNotice: () => ({
      issueNumber: ref(null),
      suspendedUntil: ref(null),
      suspendedIndefinitely: ref(false),
      channelId: ref(''),
    }),
  };
});

vi.mock('@/graphQLData/channel/mutations', () => ({ CREATE_CHANNEL: 'm' }));

const FieldsStub = {
  name: 'CreateEditChannelFields',
  props: ['formValues', 'submitError', 'createChannelLoading'],
  emits: ['submit', 'update-form-values'],
  template: '<div class="fields" />',
};

const RequireAuthUnauth = defineComponent({
  name: 'RequireAuth',
  setup(_p, { slots }) {
    return () => createEl('div', slots['does-not-have-auth']?.());
  },
});

const mountPage = (extraStubs: Record<string, unknown> = {}) =>
  mountWithDefaults(CreateForumPage, {
    global: { stubs: { CreateEditChannelFields: FieldsStub, ...extraStubs } },
  });

const fields = (wrapper: ReturnType<typeof mountPage>) =>
  wrapper.findComponent(FieldsStub);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Create forum page', () => {
  it('renders the channel form for authorized users', () => {
    expect(fields(mountPage()).exists()).toBe(true);
  });

  it('shows a permission message for unauthorized users', () => {
    const wrapper = mountPage({ RequireAuth: RequireAuthUnauth });
    expect(wrapper.text()).toContain("don't have permission");
  });

  it('merges field updates into the form values', async () => {
    const wrapper = mountPage();
    await fields(wrapper).vm.$emit('update-form-values', { displayName: 'Cats' });
    expect(fields(wrapper).props('formValues').displayName).toBe('Cats');
  });

  it('submits a channel create input built from the form values', async () => {
    const wrapper = mountPage();
    await fields(wrapper).vm.$emit('update-form-values', {
      uniqueName: 'cats',
      displayName: 'Cats',
      selectedTags: ['pets'],
    });
    await fields(wrapper).vm.$emit('submit');

    expect(h.mutate).toHaveBeenCalledTimes(1);
    const input = h.mutate.mock.calls[0][0].createChannelInput[0];
    expect(input.uniqueName).toBe('cats');
    expect(input.Tags.connectOrCreate[0].where.node.text).toBe('pets');
    expect(input.Admins.connect[0].where.node.username).toBe('alice');
  });

  it('navigates to the new forum once creation completes', () => {
    mountPage();
    h.onDoneCb({
      data: { createChannels: { channels: [{ uniqueName: 'cats' }] } },
    });
    expect(h.push).toHaveBeenCalledWith(
      expect.objectContaining({ params: { forumId: 'cats' } })
    );
  });

  it('surfaces an error when creation returns no channel', async () => {
    const wrapper = mountPage();
    h.onDoneCb({ data: { createChannels: { channels: [] } } });
    await wrapper.vm.$nextTick();
    expect(fields(wrapper).props('submitError')).toContain('Unable to create forum');
  });
});
