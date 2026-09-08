import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AgeProfilePrompt from './AgeProfilePrompt.vue';

const h = vi.hoisted(() => ({
  authenticated: { value: true },
  username: { value: 'alice' },
  policy: {
    value: {
      getAgePolicy: {
        accountAgeGateEnabled: true,
        minimumAccountAge: 13,
        sensitiveContentAgeGateEnabled: true,
        minimumSensitiveContentAge: 18,
      },
    },
  },
  profile: {
    value: {
      getMyAgeProfile: {
        birthday: null as string | null,
        meetsAccountMinimumAge: null,
        mayAccessSensitiveContent: false,
      },
    },
  },
  mutate: vi.fn(),
  onDone: undefined as undefined | (() => void),
  refetchQueries: vi.fn(),
}));

vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => h.authenticated,
  useUsername: () => h.username,
}));
vi.mock('@/graphQLData/age/queries', () => ({
  GET_AGE_POLICY: 'GET_AGE_POLICY',
  GET_MY_AGE_PROFILE: 'GET_MY_AGE_PROFILE',
}));
vi.mock('@/graphQLData/age/mutations', () => ({
  SET_MY_BIRTHDAY: 'SET_MY_BIRTHDAY',
}));
vi.mock('@vue/apollo-composable', () => ({
  useQuery: (query: unknown) => ({
    result: query === 'GET_AGE_POLICY' ? h.policy : h.profile,
    loading: { value: false },
    error: { value: null },
  }),
  useMutation: () => ({
    mutate: h.mutate,
    loading: { value: false },
    error: { value: null },
    onDone: (callback: () => void) => {
      h.onDone = callback;
    },
  }),
  useApolloClient: () => ({ client: { refetchQueries: h.refetchQueries } }),
}));

const modalStub = {
  name: 'GenericModal',
  props: ['open', 'primaryButtonDisabled'],
  emits: ['close', 'primaryButtonClick'],
  template:
    '<div v-if="open"><slot name="icon"/><slot name="content"/><button class="save" @click="$emit(\'primaryButtonClick\')"/><button class="close" @click="$emit(\'close\')"/></div>',
};

const mountPrompt = () =>
  mount(AgeProfilePrompt, {
    global: {
      stubs: {
        GenericModal: modalStub,
        DatePicker: {
          name: 'DatePicker',
          props: ['value'],
          emits: ['update'],
          template: '<div />',
        },
        ExclamationIcon: true,
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.onDone = undefined;
  h.authenticated.value = true;
  h.username.value = 'alice';
  h.policy.value.getAgePolicy.accountAgeGateEnabled = true;
  h.policy.value.getAgePolicy.sensitiveContentAgeGateEnabled = true;
  h.profile.value.getMyAgeProfile.birthday = null;
});

describe('AgeProfilePrompt', () => {
  it('opens for an authenticated existing user with no birthday', () => {
    const wrapper = mountPrompt();

    expect(wrapper.getComponent(modalStub).props('open')).toBe(true);
  });

  it('stays closed when the birthday is already set', () => {
    h.profile.value.getMyAgeProfile.birthday = '2000-01-01';

    const wrapper = mountPrompt();

    expect(wrapper.getComponent(modalStub).props('open')).toBe(false);
  });

  it('stays closed when both gates are disabled', () => {
    h.policy.value.getAgePolicy.accountAgeGateEnabled = false;
    h.policy.value.getAgePolicy.sensitiveContentAgeGateEnabled = false;

    const wrapper = mountPrompt();

    expect(wrapper.getComponent(modalStub).props('open')).toBe(false);
  });

  it('enables saving after a valid birthday is entered', async () => {
    const wrapper = mountPrompt();

    wrapper
      .getComponent({ name: 'DatePicker' })
      .vm.$emit('update', '2015-01-01');
    await wrapper.vm.$nextTick();

    expect(wrapper.getComponent(modalStub).props('primaryButtonDisabled')).toBe(
      false
    );
  });

  it('refetches active content after saving', async () => {
    mountPrompt();

    await h.onDone?.();

    expect(h.refetchQueries).toHaveBeenCalledWith({ include: 'active' });
  });

  it('submits through the private birthday mutation', async () => {
    const wrapper = mountPrompt();

    await wrapper.get('.save').trigger('click');

    expect(h.mutate).toHaveBeenCalledOnce();
  });

  it('can be dismissed for the current page view', async () => {
    const wrapper = mountPrompt();

    await wrapper.get('.close').trigger('click');

    expect(wrapper.getComponent(modalStub).props('open')).toBe(false);
  });

  it('explains that sensitive content is hidden when a birthday is missing', () => {
    const wrapper = mountPrompt();

    expect(
      wrapper.get('[data-testid="sensitive-content-gate-notice"]').text()
    ).toContain('until you confirm your birthday');
  });

  it('explains the configured threshold to an underage account', () => {
    h.profile.value.getMyAgeProfile.birthday = '2015-01-01';
    const wrapper = mountPrompt();

    expect(
      wrapper.get('[data-testid="sensitive-content-gate-notice"]').text()
    ).toContain('below 18 years old');
  });

  it('explains the gate to signed-out visitors', () => {
    h.authenticated.value = false;
    h.username.value = '';
    const wrapper = mountPrompt();

    expect(
      wrapper.get('[data-testid="sensitive-content-gate-notice"]').text()
    ).toContain('Sign in and confirm your birthday');
  });
});
