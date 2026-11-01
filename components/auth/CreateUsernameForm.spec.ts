import { GetAgePolicyDocument } from '@/__generated__/operations';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

import CreateUsernameForm from '@/components/auth/CreateUsernameForm.vue';

const h = vi.hoisted(() => ({
  setUsername: vi.fn(),
  setModProfileName: vi.fn(),
  setIsAuthenticated: vi.fn(),
  setIsLoadingAuth: vi.fn(),
  verificationStatus: { value: 'verified' },
  canResend: { value: false },
  sending: { value: false },
  message: { value: '' },
  check: vi.fn(),
  resend: vi.fn(),
  logout: vi.fn(),
  createMutate: vi.fn(),
  onDone: undefined as undefined | ((r: unknown) => void),
  mutationOptions: undefined as undefined | (() => unknown),
  userResult: { value: { users: [] as unknown[] } },
  agePolicyResult: {
    value: {
      getAgePolicy: {
        accountAgeGateEnabled: true,
        minimumAccountAge: 13,
        sensitiveContentAgeGateEnabled: true,
        minimumSensitiveContentAge: 18,
      },
    },
  },
  getError: { value: null as unknown },
  getLoading: { value: false },
  createError: { value: null as unknown },
  createLoading: { value: false },
}));

vi.mock('@/composables/useSignupVerification', () => ({
  useSignupVerification: () => ({
    status: h.verificationStatus,
    canResend: h.canResend,
    sending: h.sending,
    message: h.message,
    check: h.check,
    resend: h.resend,
  }),
}));
vi.mock('@/composables/useServerLogout', () => ({
  useServerLogout: () => ({ logout: h.logout }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (query: unknown) => ({
    result: query === GetAgePolicyDocument ? h.agePolicyResult : h.userResult,
    error: h.getError,
    loading: h.getLoading,
  }),
  useMutation: (_mutation: unknown, options: () => unknown) => {
    h.mutationOptions = options;
    return {
      mutate: h.createMutate,
      error: h.createError,
      loading: h.createLoading,
      onDone: (cb: (r: unknown) => void) => {
        h.onDone = cb;
      },
    };
  },
}));
vi.mock('@/composables/useAuthState', () => ({
  setUsername: h.setUsername,
  setModProfileName: h.setModProfileName,
  setIsAuthenticated: h.setIsAuthenticated,
}));
vi.mock('@/cache', () => ({ setIsLoadingAuth: h.setIsLoadingAuth }));

const stubs = {
  PrimaryButton: {
    name: 'PrimaryButton',
    props: ['label', 'disabled', 'loading'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ label }}</button>',
  },
  DatePicker: {
    name: 'DatePicker',
    props: ['value', 'testId'],
    emits: ['update'],
    template: '<div />',
  },
  CharCounter: { props: ['current', 'max'], template: '<div />' },
  ErrorBanner: {
    name: 'ErrorBanner',
    props: ['text'],
    template: '<div class="err" />',
  },
  CheckCircleIcon: true,
  ExclamationIcon: true,
};

const mountForm = (email = 'alice@example.com') =>
  mount(CreateUsernameForm, { props: { email }, global: { stubs } });

const saveButton = (wrapper: ReturnType<typeof mount>) =>
  wrapper
    .findAllComponents({ name: 'PrimaryButton' })
    .find((button) => button.props('label') === 'Save')!;

const setBirthday = (wrapper: ReturnType<typeof mount>, date: string) =>
  wrapper.getComponent({ name: 'DatePicker' }).vm.$emit('update', date);

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  h.verificationStatus = ref('verified');
  h.canResend = ref(false);
  h.sending = ref(false);
  h.message = ref('');
  h.onDone = undefined;
  h.mutationOptions = undefined;
  h.userResult = { value: { users: [] } };
  h.getError = { value: null };
  h.getLoading = { value: false };
  h.createError = { value: null };
  h.createLoading = { value: false };
  h.agePolicyResult.value.getAgePolicy = {
    accountAgeGateEnabled: true,
    minimumAccountAge: 13,
    sensitiveContentAgeGateEnabled: true,
    minimumSensitiveContentAge: 18,
  };
});

describe('CreateUsernameForm initial state', () => {
  it('seeds the username from the local part of the email', () => {
    const wrapper = mountForm('bob@example.com');

    expect((wrapper.get('input').element as HTMLInputElement).value).toBe(
      'bob'
    );
  });

  it('shows the username as available for a fresh valid name', () => {
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('This username is available');
  });
});

describe('CreateUsernameForm username validation', () => {
  it('flags a taken username and disables saving', () => {
    h.userResult = { value: { users: [{ username: 'alice' }] } };
    const wrapper = mountForm();

    expect(saveButton(wrapper).props('disabled')).toBe(true);
  });

  it('does not show the available message when the name is taken', () => {
    h.userResult = { value: { users: [{ username: 'alice' }] } };
    const wrapper = mountForm();

    expect(wrapper.text()).not.toContain('This username is available');
  });

  it('disables saving for an invalid username', async () => {
    const wrapper = mountForm();

    await wrapper.get('input').setValue('has spaces!!');

    expect(saveButton(wrapper).props('disabled')).toBe(true);
  });
});

describe('CreateUsernameForm birthday and canSave', () => {
  it('keeps saving disabled until a birthday is entered', () => {
    const wrapper = mountForm();

    expect(saveButton(wrapper).props('disabled')).toBe(true);
  });

  it('enables saving for a valid username and an adult birthday', async () => {
    const wrapper = mountForm();

    await setBirthday(wrapper, '2000-01-01');

    expect(saveButton(wrapper).props('disabled')).toBe(false);
  });

  it('disables saving when the user is under the minimum age', async () => {
    const wrapper = mountForm();

    await setBirthday(wrapper, '2020-01-01');

    expect(saveButton(wrapper).props('disabled')).toBe(true);
  });

  it('uses the server-configured minimum account age', async () => {
    h.agePolicyResult.value.getAgePolicy.minimumAccountAge = 21;
    const wrapper = mountForm();

    await setBirthday(wrapper, '2007-01-01');

    expect(wrapper.text()).toContain('at least 21 years old');
  });

  it('allows an omitted birthday when both age gates are disabled', () => {
    h.agePolicyResult.value.getAgePolicy.accountAgeGateEnabled = false;
    h.agePolicyResult.value.getAgePolicy.sensitiveContentAgeGateEnabled = false;

    const wrapper = mountForm();

    expect(saveButton(wrapper).props('disabled')).toBe(false);
  });

  it('requires but does not minimum-age-block a birthday for a sensitive-content-only gate', async () => {
    h.agePolicyResult.value.getAgePolicy.accountAgeGateEnabled = false;
    const wrapper = mountForm();

    await setBirthday(wrapper, '2020-01-01');

    expect(saveButton(wrapper).props('disabled')).toBe(false);
  });
});

describe('CreateUsernameForm submission', () => {
  it('runs the create mutation when Save is clicked', async () => {
    const wrapper = mountForm();
    await setBirthday(wrapper, '2000-01-01');

    await saveButton(wrapper).trigger('click');

    expect(h.createMutate).toHaveBeenCalled();
  });

  it('passes the birthday to account creation', async () => {
    const wrapper = mountForm();
    await setBirthday(wrapper, '2000-01-01');

    await saveButton(wrapper).trigger('click');

    expect(h.mutationOptions?.()).toEqual({
      variables: {
        emailAddress: 'alice@example.com',
        username: 'alice',
        birthday: '2000-01-01',
      },
    });
  });

  it('shows an error banner when creation fails', () => {
    h.createError = { value: { message: 'boom' } };
    const wrapper = mountForm();

    expect(wrapper.find('.err').exists()).toBe(true);
  });
});

describe('CreateUsernameForm account creation completion', () => {
  const result = {
    data: {
      createEmailAndUser: {
        username: 'alice',
        ModerationProfile: { displayName: 'modAlice' },
      },
    },
  };

  it('stores the username and authenticates on success', () => {
    mountForm();

    h.onDone?.(result);

    expect(h.setUsername).toHaveBeenCalledWith('alice');
  });

  it('sets the moderation profile name on success', () => {
    mountForm();

    h.onDone?.(result);

    expect(h.setModProfileName).toHaveBeenCalledWith('modAlice');
  });

  it('emits emailAndUserCreated on success', () => {
    const wrapper = mountForm();

    h.onDone?.(result);

    expect(wrapper.emitted('emailAndUserCreated')).toBeTruthy();
  });

  it('marks the user as authenticated', () => {
    mountForm();

    h.onDone?.(result);

    expect(h.setIsAuthenticated).toHaveBeenCalledWith(true);
  });
});

describe('signup verification recovery', () => {
  it.each(['checking', 'unverified', 'unknown', 'signed-out'])(
    'blocks Save while verification is %s',
    async (status) => {
      h.verificationStatus.value = status;
      const wrapper = mountForm();
      setBirthday(wrapper, '2000-01-01');
      await wrapper.vm.$nextTick();
      expect(saveButton(wrapper).props('disabled')).toBe(true);
    }
  );
  it('explains unverified email and offers reauthentication', () => {
    h.verificationStatus.value = 'unverified';
    const wrapper = mountForm();
    expect(wrapper.get('a[href="/auth/signup/refresh"]').text()).toContain(
      "I've verified my email"
    );
  });
  it('preserves entries before reauthentication', async () => {
    h.verificationStatus.value = 'unverified';
    const wrapper = mountForm();
    await wrapper.get('input').setValue('chosen_name');
    setBirthday(wrapper, '2000-01-01');
    await wrapper.get('a[href="/auth/signup/refresh"]').trigger('click');
    expect(
      JSON.parse(sessionStorage.getItem('signup-draft:alice@example.com')!)
    ).toEqual({ username: 'chosen_name', birthday: '2000-01-01' });
  });
  it('restores the draft after reauthentication', async () => {
    sessionStorage.setItem(
      'signup-draft:alice@example.com',
      JSON.stringify({ username: 'chosen_name', birthday: '2000-01-01' })
    );
    const wrapper = mountForm();
    await wrapper.vm.$nextTick();
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe(
      'chosen_name'
    );
  });
  it('clears the draft and signs out when switching accounts', async () => {
    sessionStorage.setItem('signup-draft:alice@example.com', '{}');
    const wrapper = mountForm();
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('use another account'))!
      .trigger('click');
    expect({
      calls: h.logout.mock.calls.length,
      draft: sessionStorage.getItem('signup-draft:alice@example.com'),
    }).toEqual({ calls: 1, draft: null });
  });
  it('offers sign in recovery for a backend login rejection without claiming the email is unverified', () => {
    h.createError.value = {
      message: 'A verified login is required to create an account',
    };
    const wrapper = mountForm();
    expect(wrapper.get('a[href="/auth/signup/refresh"]').text()).toBe(
      'Sign in again'
    );
  });
});

it('blocks repeated submission after a backend login rejection until reauthentication', async () => {
  h.createError.value = {
    message: 'A verified login is required to create an account',
  };
  const wrapper = mountForm();
  setBirthday(wrapper, '2000-01-01');
  await wrapper.vm.$nextTick();
  expect(saveButton(wrapper).props('disabled')).toBe(true);
});
