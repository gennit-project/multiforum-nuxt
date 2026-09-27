import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type * as Vue from 'vue';
import type { Ref } from 'vue';
import AgeGatedDiscussionNotice from './AgeGatedDiscussionNotice.vue';

type Check = {
  requiresAgeCheck: boolean;
  status: string;
  minimumAge: number | null;
} | null;

// Real refs, so the template unwraps them the way it does Apollo's.
const h = vi.hoisted(() => ({
  check: undefined as unknown as Ref<{
    getDiscussionAgeGateCheck: Check;
  } | null>,
  loading: undefined as unknown as Ref<boolean>,
  saveError: undefined as unknown as Ref<{ message: string } | null>,
  mutate: vi.fn(),
  onDone: undefined as undefined | (() => Promise<void>),
  refetchQueries: vi.fn(),
  head: undefined as undefined | { value: { title?: string } },
  queryVariables: undefined as undefined | (() => unknown),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    fullPath: '/forums/f/discussions/d#comments',
    params: { forumId: 'f' },
  }),
  useHead: (head: unknown) => {
    h.head = head as { value: { title?: string } };
  },
}));
vi.mock('@/composables/useAuthNavigation', () => ({
  useAuthNavigation: () => ({
    getLoginUrl: (returnTo: string) => `/auth/login?returnTo=${returnTo}`,
  }),
}));
vi.mock('@/graphQLData/age/queries', () => ({
  GET_DISCUSSION_AGE_GATE_CHECK: 'GET_DISCUSSION_AGE_GATE_CHECK',
}));
vi.mock('@/graphQLData/age/mutations', () => ({
  SET_MY_BIRTHDAY: 'SET_MY_BIRTHDAY',
}));
vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await vi.importActual<typeof Vue>('vue');
  h.check = ref(null);
  h.loading = ref(false);
  h.saveError = ref(null);
  return {
    useQuery: (_query: unknown, variables: () => unknown) => {
      h.queryVariables = variables;
      return { result: h.check, loading: h.loading, error: { value: null } };
    },
    useMutation: () => ({
      mutate: h.mutate,
      loading: { value: false },
      error: h.saveError,
      onDone: (callback: () => Promise<void>) => {
        h.onDone = callback;
      },
    }),
    useApolloClient: () => ({ client: { refetchQueries: h.refetchQueries } }),
  };
});

const DatePickerStub = {
  name: 'DatePicker',
  props: ['value'],
  emits: ['update'],
  template: '<div />',
};

const mountNotice = () =>
  mount(AgeGatedDiscussionNotice, {
    props: { discussionId: 'discussion-1' },
    slots: { default: '<p data-testid="not-found">Not found</p>' },
    global: { stubs: { DatePicker: DatePickerStub } },
  });

const withCheck = (check: Check) => {
  h.check.value = { getDiscussionAgeGateCheck: check };
};

const gated = (status: string) =>
  withCheck({ requiresAgeCheck: true, status, minimumAge: 18 });

beforeEach(() => {
  vi.clearAllMocks();
  h.check.value = null;
  h.loading.value = false;
  h.saveError.value = null;
  h.onDone = undefined;
});

describe('AgeGatedDiscussionNotice', () => {
  it('asks about the discussion it was given', () => {
    mountNotice();
    expect(h.queryVariables?.()).toEqual({ discussionId: 'discussion-1' });
  });

  it('holds its place while the check is loading', () => {
    h.loading.value = true;
    expect(
      mountNotice().find('[data-testid="age-gate-checking"]').exists()
    ).toBe(true);
  });

  it.each([
    [
      'no age check applies',
      { requiresAgeCheck: false, status: 'ALLOWED', minimumAge: null },
    ],
    ['the check returned nothing', null],
  ])('shows the not-found page when %s', (_label, check) => {
    withCheck(check);
    expect(mountNotice().find('[data-testid="not-found"]').exists()).toBe(true);
  });

  it('never shows the not-found page alongside the gate', () => {
    gated('SIGN_IN_REQUIRED');
    expect(mountNotice().find('[data-testid="not-found"]').exists()).toBe(
      false
    );
  });

  it('titles a gated page as sensitive content, without its real title', () => {
    gated('SIGN_IN_REQUIRED');
    mountNotice();
    expect(h.head?.value.title).toBe('Sensitive content | f');
  });

  it('leaves the page title alone when no age check applies', () => {
    withCheck({ requiresAgeCheck: false, status: 'ALLOWED', minimumAge: null });
    mountNotice();
    expect(h.head?.value).toEqual({});
  });

  describe('signed out', () => {
    it('links to sign-in and back to this page, without the fragment', () => {
      gated('SIGN_IN_REQUIRED');
      expect(
        mountNotice().get('[data-testid="age-gate-sign-in"]').attributes('href')
      ).toBe('/auth/login?returnTo=/forums/f/discussions/d');
    });
  });

  describe('no birthday on file', () => {
    it('shows the birthday form', () => {
      gated('BIRTHDAY_REQUIRED');
      expect(mountNotice().findComponent(DatePickerStub).exists()).toBe(true);
    });

    it('keeps save disabled until a birthday is entered', () => {
      gated('BIRTHDAY_REQUIRED');
      expect(
        mountNotice()
          .get('[data-testid="age-gate-save-birthday"]')
          .attributes('disabled')
      ).toBeDefined();
    });

    it('saves the entered birthday', async () => {
      gated('BIRTHDAY_REQUIRED');
      const wrapper = mountNotice();
      wrapper.findComponent(DatePickerStub).vm.$emit('update', '1990-05-01');
      await wrapper.vm.$nextTick();
      await wrapper.get('form').trigger('submit');
      expect(h.mutate).toHaveBeenCalled();
    });

    it('reloads the page queries once the birthday is saved', async () => {
      gated('BIRTHDAY_REQUIRED');
      mountNotice();
      await h.onDone?.();
      expect(h.refetchQueries).toHaveBeenCalledWith({ include: 'active' });
    });

    it('shows a save error', () => {
      gated('BIRTHDAY_REQUIRED');
      h.saveError.value = { message: 'Something went wrong' };
      expect(mountNotice().text()).toContain('Something went wrong');
    });
  });

  describe('under the minimum age', () => {
    it('refuses with the minimum age', () => {
      gated('UNDER_MINIMUM_AGE');
      expect(
        mountNotice().get('[data-testid="age-gate-refusal"]').text()
      ).toContain('18 or older');
    });
  });
});
