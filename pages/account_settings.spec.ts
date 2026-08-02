import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import AccountSettingsPage from './account_settings.vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

const updateUser = vi.fn();
const refetchUser = vi.fn();
let onDoneCallback: (() => void) | undefined;
const getUserResult = ref({
  users: [
    {
      Email: { address: 'alice@example.com' },
      profilePicURL: '',
      displayName: 'Alice',
      bio: '',
      notifyOnReplyToCommentByDefault: false,
      notifyOnReplyToDiscussionByDefault: false,
      notifyOnReplyToEventByDefault: false,
      notifyWhenTagged: false,
      notifyOnSubscribedIssueUpdates: null,
      notifyOnFeedback: false,
      notifyOnSuspensionBlocks: null,
      notificationBundleInterval: 'hourly',
      notificationBundleEnabled: true,
      enableSensitiveContentByDefault: false,
    },
  ],
});

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: ref('en'),
  }),
}));

vi.mock('nuxt/app', () => ({ useHead: vi.fn() }));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ({ value: 'alice' }),
}));

vi.mock('@/config', () => ({
  config: {
    enableLanguagePicker: true,
  },
}));

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots['has-auth']?.());
  },
});

const CheckBoxStub = defineComponent({
  props: ['checked', 'testId', 'label'],
  emits: ['update'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-testid': props.testId,
          'data-checked': String(props.checked),
          onClick: () => emit('update', !props.checked),
        },
        props.label
      );
  },
});

describe('account_settings', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    onDoneCallback = undefined;
    getUserResult.value = {
      users: [
        {
          Email: { address: 'alice@example.com' },
          profilePicURL: '',
          displayName: 'Alice',
          bio: '',
          notifyOnReplyToCommentByDefault: false,
          notifyOnReplyToDiscussionByDefault: false,
          notifyOnReplyToEventByDefault: false,
          notifyWhenTagged: false,
          notifyOnSubscribedIssueUpdates: null,
          notifyOnFeedback: false,
          notifyOnSuspensionBlocks: null,
          notificationBundleInterval: 'hourly',
          notificationBundleEnabled: true,
          enableSensitiveContentByDefault: false,
        },
      ],
    };

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (_query: unknown, variables: () => unknown, options: () => unknown) => {
        variables();
        options();
        return {
          result: getUserResult,
          loading: ref(false),
          error: ref(null),
          refetch: refetchUser,
        };
      }
    );

    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: updateUser,
      loading: ref(false),
      error: ref(null),
      onDone: (callback: () => void) => {
        onDoneCallback = callback;
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const buildWrapper = () =>
    mount(AccountSettingsPage, {
      global: {
        mocks: {
          $t: (value: string) => value,
        },
        stubs: {
          NuxtLayout: defineComponent({
            setup(_props, { slots }) {
              return () => h('div', slots.default?.());
            },
          }),
          RequireAuth: RequireAuthStub,
          EditAccountSettingsFields: {
            name: 'EditAccountSettingsFields',
            props: ['formValues'],
            emits: ['submit', 'update-form-values'],
            template: '<div class="account-fields" />',
          },
          NotificationComponent: {
            name: 'NotificationComponent',
            emits: ['close-notification'],
            template: '<div class="saved-notification" />',
          },
          FormRow: defineComponent({
            setup(_props, { slots }) {
              return () =>
                h('div', [slots.content?.(), slots['sub-description']?.()]);
            },
          }),
          CheckBox: CheckBoxStub,
        },
      },
    });

  it('defaults subscribed issue emails to enabled when the user field is null', () => {
    const wrapper = buildWrapper();
    const checkbox = wrapper.get('[data-testid="notify-subscribed-issues"]');
    expect(checkbox.attributes('data-checked')).toBe('true');
  });

  it('autosaves subscribed issue email preference changes', async () => {
    const wrapper = buildWrapper();

    await wrapper
      .get('[data-testid="notify-subscribed-issues"]')
      .trigger('click');
    await vi.advanceTimersByTimeAsync(900);

    expect(updateUser).toHaveBeenCalledWith({
      where: { username: 'alice' },
      update: expect.objectContaining({
        notifyOnSubscribedIssueUpdates: false,
      }),
    });
  });

  it('defaults suspension block notifications to enabled when the user field is null', () => {
    const wrapper = buildWrapper();
    const checkbox = wrapper.get('[data-testid="notify-suspension-blocks"]');
    expect(checkbox.attributes('data-checked')).toBe('true');
  });

  it('autosaves suspension block notification preference changes', async () => {
    const wrapper = buildWrapper();

    await wrapper
      .get('[data-testid="notify-suspension-blocks"]')
      .trigger('click');
    await vi.advanceTimersByTimeAsync(900);

    expect(updateUser).toHaveBeenCalledWith({
      where: { username: 'alice' },
      update: expect.objectContaining({
        notifyOnSuspensionBlocks: false,
      }),
    });
  });

  it.each([
    ['notify-comment-reply', 'notifyOnReplyToCommentByDefault'],
    ['notify-discussion-reply', 'notifyOnReplyToDiscussionByDefault'],
    ['notify-event-reply', 'notifyOnReplyToEventByDefault'],
    ['notify-tagged', 'notifyWhenTagged'],
    ['notify-feedback', 'notifyOnFeedback'],
    ['enable-sensitive-content', 'enableSensitiveContentByDefault'],
  ])('autosaves the %s preference', async (testId, field) => {
    const wrapper = buildWrapper();
    await wrapper.get(`[data-testid="${testId}"]`).trigger('click');
    await vi.advanceTimersByTimeAsync(900);
    expect(updateUser).toHaveBeenCalledWith({
      where: { username: 'alice' },
      update: expect.objectContaining({ [field]: true }),
    });
  });

  it('updates and submits the basic account profile', async () => {
    const wrapper = buildWrapper();
    const fields = wrapper.findComponent({ name: 'EditAccountSettingsFields' });
    await fields.vm.$emit('update-form-values', {
      displayName: 'Alicia',
      bio: 'Hello',
      profilePicURL: '/alice.png',
    });
    await fields.vm.$emit('submit');
    expect({
      mutation: updateUser.mock.calls.at(-1)?.[0],
      refetches: refetchUser.mock.calls.length,
    }).toEqual({
      mutation: {
        where: { username: 'alice' },
        update: {
          displayName: 'Alicia',
          bio: 'Hello',
          profilePicURL: '/alice.png',
        },
      },
      refetches: 1,
    });
  });

  it('shows and dismisses the saved notification after mutation completion', async () => {
    const wrapper = buildWrapper();
    onDoneCallback?.();
    await wrapper.vm.$nextTick();
    const notification = wrapper.findComponent({
      name: 'NotificationComponent',
    });
    await notification.vm.$emit('close-notification');
    expect(wrapper.find('.saved-notification').exists()).toBe(false);
  });

  it('updates account fields when refreshed user data arrives', async () => {
    const wrapper = buildWrapper();
    getUserResult.value = {
      users: [
        {
          ...getUserResult.value.users[0],
          displayName: 'Updated Alice',
          bio: 'Updated bio',
        },
      ],
    };
    await wrapper.vm.$nextTick();
    expect(
      wrapper
        .findComponent({ name: 'EditAccountSettingsFields' })
        .props('formValues')
    ).toEqual(
      expect.objectContaining({
        displayName: 'Updated Alice',
        bio: 'Updated bio',
      })
    );
  });

  it('changes the selected language', async () => {
    const wrapper = buildWrapper();
    const select = wrapper.get('select');
    await select.setValue('es');
    expect((select.element as HTMLSelectElement).value).toBe('es');
  });

  it('shows the no-email fallback for a user without an email', () => {
    getUserResult.value = {
      users: [{ ...getUserResult.value.users[0], Email: null }],
    };
    const wrapper = buildWrapper();
    expect(wrapper.text()).toContain('accountSettings.noEmailAssociated');
  });
});
