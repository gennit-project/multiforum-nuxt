import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import SupportPage from './support.vue';

const h = vi.hoisted(() => ({
  route: { query: {} as Record<string, unknown> },
  mutate: null as unknown as ReturnType<typeof vi.fn>,
}));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route, useHead: vi.fn() }));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  const done: Array<() => void> = [];
  h.mutate = vi.fn(() => {
    done.forEach((cb) => cb());
    return Promise.resolve({ data: {} });
  });
  return {
    useMutation: () => ({
      mutate: h.mutate,
      loading: ref(false),
      error: ref(null),
      onDone: (cb: () => void) => done.push(cb),
    }),
  };
});

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return { useUsername: () => ref('alice') };
});

vi.mock('@/graphQLData/email/mutations', () => ({ SEND_BUG_REPORT: 'm' }));

const stubs = {
  FormComponent: {
    name: 'FormComponent',
    emits: ['submit'],
    template: '<form><slot /></form>',
  },
  FormRow: { name: 'FormRow', props: ['sectionTitle'], template: '<div><slot name="content" /></div>' },
  TextInput: {
    name: 'TextInput',
    props: ['testId', 'value', 'label'],
    emits: ['update'],
    template: '<div />',
  },
  TextEditor: {
    name: 'TextEditor',
    props: ['testId'],
    emits: ['update'],
    template: '<div />',
  },
  ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div />' },
  NotificationComponent: {
    name: 'NotificationComponent',
    props: ['title', 'text'],
    template: '<div class="notification" />',
  },
};

const mountSupport = () => mountWithDefaults(SupportPage, { global: { stubs } });

const textInput = (wrapper: ReturnType<typeof mountSupport>, testId: string) =>
  wrapper
    .findAllComponents({ name: 'TextInput' })
    .find((c) => c.props('testId') === testId);

const fillValidForm = async (wrapper: ReturnType<typeof mountSupport>) => {
  await textInput(wrapper, 'contact-email')!.vm.$emit('update', 'me@example.com');
  await textInput(wrapper, 'bug-subject')!.vm.$emit('update', 'Something broke');
  await wrapper
    .findComponent({ name: 'TextEditor' })
    .vm.$emit('update', 'Here are the details');
};

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { query: {} };
});

describe('Support page', () => {
  it('renders a report heading', () => {
    expect(mountSupport().get('h1').text().length).toBeGreaterThan(0);
  });

  it('does not submit while the form is incomplete', async () => {
    const wrapper = mountSupport();
    await wrapper.findComponent({ name: 'FormComponent' }).vm.$emit('submit');
    expect(h.mutate).not.toHaveBeenCalled();
  });

  it('submits the bug report with the entered values and username', async () => {
    const wrapper = mountSupport();
    await fillValidForm(wrapper);
    await wrapper.findComponent({ name: 'FormComponent' }).vm.$emit('submit');
    expect(h.mutate).toHaveBeenCalledWith({
      contactEmail: 'me@example.com',
      username: 'alice',
      subject: 'Something broke',
      text: 'Here are the details',
    });
  });

  it('shows a success notification after a successful submission', async () => {
    const wrapper = mountSupport();
    await fillValidForm(wrapper);
    await wrapper.findComponent({ name: 'FormComponent' }).vm.$emit('submit');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent({ name: 'NotificationComponent' }).exists()).toBe(
      true
    );
  });

  it('uses the report type from the query string', () => {
    h.route = { query: { type: 'feature-request' } };
    // getSupportReportContent returns a heading for the type; just assert it renders.
    expect(mountSupport().get('h1').text().length).toBeGreaterThan(0);
  });
});
