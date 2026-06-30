import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import ServerSettingsPage from './settings.vue';

const h = vi.hoisted(() => ({
  result: null as unknown as { value: unknown },
  error: null as unknown as { value: unknown },
  loading: null as unknown as { value: boolean },
  mutate: null as unknown as ReturnType<typeof vi.fn>,
  onResultCb: null as unknown as (r: unknown) => void,
  onDoneCb: null as unknown as () => void,
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.result = ref(null);
  h.error = ref(null);
  h.loading = ref(false);
  h.mutate = vi.fn();
  return {
    useQuery: () => ({
      result: h.result,
      error: h.error,
      loading: h.loading,
      onResult: (cb: (r: unknown) => void) => {
        h.onResultCb = cb;
      },
    }),
    useMutation: () => ({
      mutate: h.mutate,
      loading: ref(false),
      error: ref(null),
      onDone: (cb: () => void) => {
        h.onDoneCb = cb;
      },
    }),
  };
});

vi.mock('@/config', () => ({ config: { serverName: 'test-server' } }));
vi.mock('@/graphQLData/admin/queries', () => ({ GET_SERVER_CONFIG: 'q' }));
vi.mock('@/graphQLData/admin/mutations', () => ({ UPDATE_SERVER_CONFIG: 'm' }));

const FieldsStub = {
  name: 'CreateEditServerFields',
  props: ['formValues'],
  emits: ['submit', 'update-form-values'],
  template: '<div class="server-fields" />',
};

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots['does-not-have-auth']?.());
  },
});

const mountPage = () =>
  mountWithDefaults(ServerSettingsPage, {
    global: {
      stubs: {
        CreateEditServerFields: FieldsStub,
        Notification: { name: 'Notification', props: ['title'], template: '<div class="notification" />' },
      },
    },
  });

const fields = (wrapper: ReturnType<typeof mountPage>) =>
  wrapper.findComponent(FieldsStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.result.value = null;
  h.error.value = null;
  h.loading.value = false;
});

describe('Admin server settings page', () => {
  it('renders the server settings form', () => {
    expect(fields(mountPage()).exists()).toBe(true);
  });

  it('populates the form when the server config query resolves', async () => {
    const wrapper = mountPage();
    h.onResultCb({
      data: {
        serverConfigs: [
          {
            serverDescription: 'My server',
            rules: '[{"summary":"Be nice"}]',
            allowedFileTypes: ['pdf'],
            enableDownloads: true,
            enableEvents: false,
            pluginRegistries: ['https://r'],
          },
        ],
      },
    });
    await wrapper.vm.$nextTick();
    const fv = fields(wrapper).props('formValues') as {
      serverDescription: string;
      enableDownloads: boolean;
      rules: unknown[];
    };
    expect(fv.serverDescription).toBe('My server');
    expect(fv.enableDownloads).toBe(true);
    expect(fv.rules).toHaveLength(1);
  });

  it('merges field updates into the form values', async () => {
    const wrapper = mountPage();
    await fields(wrapper).vm.$emit('update-form-values', {
      serverDescription: 'Updated',
    });
    expect(fields(wrapper).props('formValues').serverDescription).toBe('Updated');
  });

  it('submits the server update input built from the form values', async () => {
    const wrapper = mountPage();
    await fields(wrapper).vm.$emit('update-form-values', {
      serverDescription: 'Updated',
      rules: [{ summary: 'Rule' }],
    });
    await fields(wrapper).vm.$emit('submit');
    expect(h.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          serverDescription: 'Updated',
          rules: JSON.stringify([{ summary: 'Rule' }]),
        }),
      })
    );
  });

  it('shows a saved-changes notification when the update completes', async () => {
    const wrapper = mountPage();
    h.onDoneCb();
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent({ name: 'Notification' }).exists()).toBe(true);
  });

  it('shows the permission denied message when auth is missing', async () => {
    const Page = (await import('./settings.vue')).default;
    const wrapper = mountWithDefaults(Page, {
      global: {
        stubs: {
          RequireAuth: RequireAuthStub,
        },
      },
    });

    expect(wrapper.text()).toContain("You don't have permission to see this page.");
  });
});
