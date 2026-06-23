import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import CreateUsernameForm from '@/components/auth/CreateUsernameForm.vue';

const h = vi.hoisted(() => ({
  setUsername: vi.fn(),
  setModProfileName: vi.fn(),
  setIsAuthenticated: vi.fn(),
  setIsLoadingAuth: vi.fn(),
  createMutate: vi.fn(),
  onDone: undefined as undefined | ((r: unknown) => void),
  userResult: { value: { users: [] as unknown[] } },
  getError: { value: null as unknown },
  getLoading: { value: false },
  createError: { value: null as unknown },
  createLoading: { value: false },
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.userResult,
    error: h.getError,
    loading: h.getLoading,
  }),
  useMutation: () => ({
    mutate: h.createMutate,
    error: h.createError,
    loading: h.createLoading,
    onDone: (cb: (r: unknown) => void) => {
      h.onDone = cb;
    },
  }),
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
  ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err" />' },
  CheckCircleIcon: true,
  ExclamationIcon: true,
};

const mountForm = (email = 'alice@example.com') =>
  mount(CreateUsernameForm, { props: { email }, global: { stubs } });

const saveButton = (wrapper: ReturnType<typeof mount>) =>
  wrapper.getComponent({ name: 'PrimaryButton' });

const setBirthday = (wrapper: ReturnType<typeof mount>, date: string) =>
  wrapper.getComponent({ name: 'DatePicker' }).vm.$emit('update', date);

beforeEach(() => {
  vi.clearAllMocks();
  h.onDone = undefined;
  h.userResult = { value: { users: [] } };
  h.getError = { value: null };
  h.getLoading = { value: false };
  h.createError = { value: null };
  h.createLoading = { value: false };
});

describe('CreateUsernameForm initial state', () => {
  it('seeds the username from the local part of the email', () => {
    const wrapper = mountForm('bob@example.com');

    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('bob');
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
});

describe('CreateUsernameForm submission', () => {
  it('runs the create mutation when Save is clicked', async () => {
    const wrapper = mountForm();
    await setBirthday(wrapper, '2000-01-01');

    await saveButton(wrapper).trigger('click');

    expect(h.createMutate).toHaveBeenCalled();
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
