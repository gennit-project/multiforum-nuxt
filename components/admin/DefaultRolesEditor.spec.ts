import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import DefaultRolesEditor from './DefaultRolesEditor.vue';

const updateServerRole = vi.fn();
const updateModServerRole = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (fn: any) => {
    if (fn && (fn.definitions?.[0]?.name?.value || '').includes('ModServerRole')) {
      return { mutate: updateModServerRole };
    }
    return { mutate: updateServerRole };
  },
}));

describe('DefaultRolesEditor', () => {
  beforeEach(() => {
    updateServerRole.mockReset();
    updateModServerRole.mockReset();
    updateServerRole.mockResolvedValue({});
    updateModServerRole.mockResolvedValue({});
  });

  const serverConfig = ref({
    DefaultServerRole: {
      name: 'ServerRole',
      canCreateChannel: false,
      canCreateDiscussion: true,
      canCreateEvent: false,
      canCreateComment: true,
      canUpvoteDiscussion: true,
      canUpvoteComment: true,
      canUploadFile: false,
      canGiveFeedback: false,
      showAdminTag: false,
    },
    DefaultModRole: {
      name: 'ModRole',
      canHideComment: true,
      canHideEvent: true,
      canHideDiscussion: false,
      canEditComments: false,
      canEditDiscussions: false,
      canEditEvents: false,
      canGiveFeedback: true,
      canOpenSupportTickets: false,
      canCloseSupportTickets: false,
      canReport: true,
      canSuspendUser: false,
      canLockChannel: false,
    },
  });

  it('renders role cards for available default roles', () => {
    const wrapper = mount(DefaultRolesEditor, {
      props: { serverConfig: serverConfig.value },
    });
    expect(wrapper.text()).toContain('Default Server Role');
    expect(wrapper.text()).toContain('Default Mod Role');
  });

  it('toggles a permission and calls the right mutation', async () => {
    const wrapper = mount(DefaultRolesEditor, {
      props: { serverConfig: serverConfig.value },
    });
    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);
    expect(updateServerRole).toHaveBeenCalled();
  });

  it('updates a role name on blur', async () => {
    const wrapper = mount(DefaultRolesEditor, {
      props: { serverConfig: serverConfig.value },
    });
    const input = wrapper.find('input[type="text"]');
    await input.setValue('ServerRoleUpdated');
    await input.trigger('blur');
    expect(updateServerRole).toHaveBeenCalledWith({
      name: 'ServerRole',
      input: { name: 'ServerRoleUpdated' },
    });
  });
});
