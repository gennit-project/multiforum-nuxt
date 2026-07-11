import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import ServerRolesPanel from './ServerRolesPanel.vue';

// Plain {value} holders (set before each mount) stand in for the query refs.
const { query } = vi.hoisted(() => ({
  query: {
    result: { value: null as unknown },
    error: { value: null as unknown },
    loading: { value: false },
  },
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: query.result,
    error: query.error,
    loading: query.loading,
  })),
}));

const role = (name: string) => ({
  name,
  description: `${name} description`,
  __typename: 'ServerRole',
});

const fullConfig = {
  DefaultServerRole: role('Server Role'),
  DefaultModRole: role('Mod Role'),
  DefaultElevatedModRole: role('Elevated Mod Role'),
  DefaultSuspendedRole: role('Suspended Role'),
  DefaultSuspendedModRole: role('Suspended Mod Role'),
};

const RoleSectionStub = {
  name: 'RoleSection',
  props: ['sectionTitle', 'roleTitle', 'roleDescription', 'permissions'],
  template: '<div class="role-section" />',
};

const mountPanel = () =>
  mountWithDefaults(ServerRolesPanel, {
    global: { stubs: { RoleSection: RoleSectionStub } },
  });

const roleSections = (wrapper: ReturnType<typeof mountPanel>) =>
  wrapper.findAllComponents({ name: 'RoleSection' });

beforeEach(() => {
  query.result.value = null;
  query.error.value = null;
  query.loading.value = false;
});

describe('ServerRolesPanel', () => {
  it('renders no panel when the query errors', () => {
    query.error.value = new Error('boom');
    query.result.value = { serverConfigs: [fullConfig] };
    expect(mountPanel().find('h1').exists()).toBe(false);
  });

  it('renders no panel when there are no server configs', () => {
    query.result.value = { serverConfigs: [] };
    expect(mountPanel().find('h1').exists()).toBe(false);
  });

  it('renders the panel heading once a server config loads', () => {
    query.result.value = { serverConfigs: [fullConfig] };
    expect(mountPanel().find('h1').text()).toBe('Server Roles');
  });

  it('renders a role section for every default role present', () => {
    query.result.value = { serverConfigs: [fullConfig] };
    expect(roleSections(mountPanel())).toHaveLength(5);
  });

  it('omits the section for a role that is absent', () => {
    query.result.value = {
      serverConfigs: [{ DefaultServerRole: role('Server Role') }],
    };
    expect(roleSections(mountPanel())).toHaveLength(1);
  });

  it('passes the role details to the section', () => {
    query.result.value = {
      serverConfigs: [{ DefaultServerRole: role('Server Role') }],
    };
    expect(roleSections(mountPanel())[0]!.props()).toMatchObject({
      sectionTitle: 'Default Server Role',
      roleTitle: 'Server Role',
      roleDescription: 'Server Role description',
    });
  });

  it('shows a permission message to unauthenticated users', () => {
    query.result.value = { serverConfigs: [fullConfig] };
    const wrapper = mountWithDefaults(ServerRolesPanel, {
      global: {
        stubs: {
          RoleSection: RoleSectionStub,
          // Render the unauthenticated branch instead of the default has-auth slot.
          RequireAuth: {
            name: 'RequireAuth',
            template: '<div><slot name="does-not-have-auth" /></div>',
          },
        },
      },
    });
    expect(wrapper.text()).toContain("You don't have permission");
  });
});
