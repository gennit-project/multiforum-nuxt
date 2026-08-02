import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import ForumOwnerList from '@/components/channel/form/ForumOwnerList.vue';
import PendingForumOwnerList from '@/components/channel/form/PendingForumOwnerList.vue';

const h = vi.hoisted(() => ({
  mutations: new Map<unknown, ReturnType<typeof vi.fn>>(),
  options: new Map<unknown, { update?: (...args: unknown[]) => void }>(),
  done: new Map<unknown, () => void>(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
}));

vi.mock('@/graphQLData/mod/mutations', () => ({
  INVITE_FORUM_OWNER: 'invite',
  CANCEL_INVITE_FORUM_OWNER: 'cancel',
  REMOVE_FORUM_OWNER: 'remove',
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (
    operation: unknown,
    options: { update?: (...args: unknown[]) => void }
  ) => {
    const mutate = vi.fn();
    h.mutations.set(operation, mutate);
    h.options.set(operation, options);
    return {
      mutate,
      loading: ref(false),
      error: ref(null),
      onDone: (callback: () => void) => h.done.set(operation, callback),
    };
  },
}));

const FormRowStub = { template: '<div><slot name="content" /></div>' };
const WarningModalStub = {
  name: 'WarningModal',
  props: ['open', 'body'],
  emits: ['close', 'primary-button-click'],
  template: '<div />',
};
const TextInputStub = {
  name: 'TextInput',
  emits: ['update'],
  template: '<input />',
};
const PrimaryButtonStub = {
  name: 'PrimaryButton',
  emits: ['click'],
  template: '<button />',
};

const mountPage = async () => {
  const Page = (await import('./owners.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        FormRow: FormRowStub,
        WarningModal: WarningModalStub,
        TextInput: TextInputStub,
        PrimaryButton: PrimaryButtonStub,
      },
    },
  });
};

beforeEach(() => {
  h.mutations.clear();
  h.options.clear();
  h.done.clear();
});

describe('forum owners edit page', () => {
  it('renders the current and pending owner lists', async () => {
    const wrapper = await mountPage();
    expect([
      wrapper.findComponent(ForumOwnerList).exists(),
      wrapper.findComponent(PendingForumOwnerList).exists(),
    ]).toEqual([true, true]);
  });

  it('invites the username entered in the form', async () => {
    const wrapper = await mountPage();
    wrapper.findComponent({ name: 'TextInput' }).vm.$emit('update', 'bob');
    await wrapper.findComponent({ name: 'PrimaryButton' }).vm.$emit('click');
    expect(h.mutations.get('invite')).toHaveBeenCalledWith({
      inviteeUsername: 'bob',
      channelUniqueName: 'cats',
    });
  });

  it('cancels the selected pending invitation', async () => {
    const wrapper = await mountPage();
    wrapper
      .findComponent(PendingForumOwnerList)
      .vm.$emit('click-cancel-invite', 'bob');
    await wrapper
      .findAllComponents(WarningModalStub)[0]
      .vm.$emit('primary-button-click');
    expect(h.mutations.get('cancel')).toHaveBeenCalledWith({
      inviteeUsername: 'bob',
      channelUniqueName: 'cats',
    });
  });

  it('removes the selected forum owner', async () => {
    const wrapper = await mountPage();
    wrapper.findComponent(ForumOwnerList).vm.$emit('click-remove-owner', 'bob');
    await wrapper
      .findAllComponents(WarningModalStub)[1]
      .vm.$emit('primary-button-click');
    expect(h.mutations.get('remove')).toHaveBeenCalledWith({
      username: 'bob',
      channelUniqueName: 'cats',
    });
  });

  it('updates cached pending invitations after an invite', async () => {
    const wrapper = await mountPage();
    wrapper.findComponent({ name: 'TextInput' }).vm.$emit('update', 'bob');
    const cache = {
      readQuery: vi.fn().mockReturnValue({
        channels: [
          { PendingOwnerInvites: [{ username: 'alice' }], slug: 'cats' },
        ],
      }),
      writeQuery: vi.fn(),
    };
    h.options.get('invite')?.update?.(cache);
    expect(cache.writeQuery.mock.calls[0][0].data.channels[0]).toEqual({
      slug: 'cats',
      PendingOwnerInvites: [{ username: 'alice' }, { username: 'bob' }],
    });
  });

  it('filters cached invitations and owners', async () => {
    await mountPage();
    const cache = {
      readQuery: vi.fn().mockReturnValue({
        channels: [
          { PendingOwnerInvites: [{ username: 'alice' }, { username: '' }] },
        ],
      }),
      writeQuery: vi.fn(),
    };
    h.options.get('cancel')?.update?.(cache);
    cache.readQuery.mockReturnValue({
      channels: [{ Admins: [{ username: 'alice' }, { username: '' }] }],
    });
    h.options.get('remove')?.update?.(cache);
    expect(
      cache.writeQuery.mock.calls.map((call) => call[0].data.channels[0])
    ).toEqual([
      { PendingOwnerInvites: [{ username: 'alice' }] },
      { Admins: [{ username: 'alice' }] },
    ]);
  });

  it('closes action modals when mutations finish', async () => {
    const wrapper = await mountPage();
    wrapper
      .findComponent(PendingForumOwnerList)
      .vm.$emit('click-cancel-invite', 'bob');
    wrapper.findComponent(ForumOwnerList).vm.$emit('click-remove-owner', 'bob');
    h.done.get('cancel')?.();
    h.done.get('remove')?.();
    expect(
      wrapper
        .findAllComponents(WarningModalStub)
        .map((modal) => modal.props('open'))
    ).toEqual([false, false]);
  });
});
