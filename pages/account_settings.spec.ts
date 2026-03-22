import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import AccountSettingsPage from './account_settings.vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

const updateUser = vi.fn();
const refetchUser = vi.fn();
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

vi.mock('nuxt/app', () => ({}));

vi.mock('@/cache', () => ({
  usernameVar: { value: 'alice' },
}));

vi.mock('@/config', () => ({
  config: {
    enableLanguagePicker: false,
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

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      result: getUserResult,
      loading: ref(false),
      error: ref(null),
      refetch: refetchUser,
    });

    (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: updateUser,
      loading: ref(false),
      error: ref(null),
      onDone: vi.fn(),
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
          EditAccountSettingsFields: true,
          NotificationComponent: true,
          FormRow: defineComponent({
            setup(_props, { slots }) {
              return () =>
                h('div', [
                  slots.content?.(),
                  slots['sub-description']?.(),
                ]);
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

    await wrapper.get('[data-testid="notify-subscribed-issues"]').trigger('click');
    await vi.advanceTimersByTimeAsync(900);

    expect(updateUser).toHaveBeenCalledWith({
      where: { username: 'alice' },
      update: expect.objectContaining({
        notifyOnSubscribedIssueUpdates: false,
      }),
    });
  });
});
