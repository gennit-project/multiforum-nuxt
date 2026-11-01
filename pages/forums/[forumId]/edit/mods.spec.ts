import { getOperationAST } from 'graphql';
import type { DocumentNode } from 'graphql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import ModList from '@/components/channel/form/ModList.vue';
import PendingForumModList from '@/components/channel/form/PendingForumModList.vue';

const h = vi.hoisted(() => ({
  mutations: new Map<unknown, ReturnType<typeof vi.fn>>(),
  options: new Map<unknown, () => { refetchQueries: Array<{ query: DocumentNode; variables: { channelUniqueName: string } }>; awaitRefetchQueries: boolean }>(),
  done: new Map<unknown, () => void>(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
}));



vi.mock('@vue/apollo-composable', () => ({
  useMutation: (
    document: DocumentNode,
    options: () => { refetchQueries: Array<{ query: DocumentNode; variables: { channelUniqueName: string } }>; awaitRefetchQueries: boolean }
  ) => {
    const name = getOperationAST(document)?.name?.value;
    const operation = name === 'inviteForumMod' ? 'invite' : name === 'cancelInviteForumMod' ? 'cancel' : 'remove';
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
  const Page = (await import('./mods.vue')).default;
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

describe('forum mods edit page', () => {
  it('renders the current and pending mod lists', async () => {
    const wrapper = await mountPage();
    expect([
      wrapper.findComponent(ModList).exists(),
      wrapper.findComponent(PendingForumModList).exists(),
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
      .findComponent(PendingForumModList)
      .vm.$emit('click-cancel-invite', 'bob');
    await wrapper
      .findAllComponents(WarningModalStub)[0]
      .vm.$emit('primary-button-click');
    expect(h.mutations.get('cancel')).toHaveBeenCalledWith({
      inviteeUsername: 'bob',
      channelUniqueName: 'cats',
    });
  });

  it('removes the selected forum moderator', async () => {
    const wrapper = await mountPage();
    wrapper.findComponent(ModList).vm.$emit('click-remove-mod', 'ModBob');
    await wrapper
      .findAllComponents(WarningModalStub)[1]
      .vm.$emit('primary-button-click');
    expect(h.mutations.get('remove')).toHaveBeenCalledWith({
      modProfileName: 'ModBob',
      channelUniqueName: 'cats',
    });
  });

  it.each(['invite', 'cancel', 'remove'])('refetches the exact selected forum after %s', async (operation) => {
    await mountPage();
    const options = h.options.get(operation)?.();
    expect({
      query: getOperationAST(options!.refetchQueries[0]!.query)?.name?.value,
      variables: options?.refetchQueries[0]?.variables,
      awaitRefetchQueries: options?.awaitRefetchQueries,
    }).toEqual({
      query: operation === 'remove' ? 'getModsByChannel' : 'getPendingChannelModsByChannel',
      variables: { channelUniqueName: 'cats' },
      awaitRefetchQueries: true,
    });
  });

  it('closes action modals when mutations finish', async () => {
    const wrapper = await mountPage();
    wrapper
      .findComponent(PendingForumModList)
      .vm.$emit('click-cancel-invite', 'bob');
    wrapper.findComponent(ModList).vm.$emit('click-remove-mod', 'bob');
    h.done.get('cancel')?.();
    h.done.get('remove')?.();
    expect(
      wrapper
        .findAllComponents(WarningModalStub)
        .map((modal) => modal.props('open'))
    ).toEqual([false, false]);
  });
});
