import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import DefaultRolesEditor from './DefaultRolesEditor.vue';

const updateServerRole = vi.fn();
const updateModServerRole = vi.fn();
const refetchMock = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (fn: any) => {
    const isMod =
      fn && (fn.definitions?.[0]?.name?.value || '').includes('ModServerRole');
    const mutateFn = isMod ? updateModServerRole : updateServerRole;
    const doneHandlers: Array<() => void> = [];
    const loading = ref(false);
    return {
      mutate: async (vars?: any) => {
        loading.value = true;
        const res = await mutateFn(vars);
        doneHandlers.forEach((cb) => cb());
        loading.value = false;
        return res;
      },
      onDone: (cb: () => void) => doneHandlers.push(cb),
      loading,
    };
  },
}));

vi.mock('@/components/admin/PermissionsList.vue', () => ({
  default: {
    name: 'PermissionsList',
    template: '<div><slot /></div>',
    props: ['permissions'],
  },
}));

vi.mock('@/components/GenericModal.vue', () => ({
  default: {
    name: 'GenericModal',
    props: [
      'open',
      'title',
      'dataTestid',
      'primaryButtonText',
      'secondaryButtonText',
      'loading',
      'primaryButtonDisabled',
    ],
    emits: ['close', 'primaryButtonClick'],
    template: `
      <div v-if="open">
        <div class="modal">
          <slot name="icon"></slot>
          <slot name="content"></slot>
          <button
            :data-testid="\`\${dataTestid}-primary-button\`"
            @click="$emit('primaryButtonClick')"
          >
            {{ primaryButtonText || 'Delete' }}
          </button>
          <button data-test="modal-close" @click="$emit('close')">
            {{ secondaryButtonText || 'Cancel' }}
          </button>
        </div>
      </div>
    `,
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

  it('opens modal and saves via server role mutation', async () => {
    const wrapper = mount(DefaultRolesEditor, {
      props: { serverConfig: serverConfig.value, onUpdated: refetchMock },
    });
    const editBtn = wrapper.find('[data-test="edit-DefaultServerRole"]');
    await editBtn.trigger('click');
    const nameInput = wrapper.find('input[type="text"]');
    await nameInput.setValue('ServerRoleUpdated');
    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);
    const saveBtn = wrapper.find(
      '[data-testid="default-roles-modal-primary-button"]'
    );
    await saveBtn.trigger('click');
    expect(updateServerRole).toHaveBeenCalledWith({
      name: 'ServerRole',
      input: expect.objectContaining({ name: 'ServerRoleUpdated' }),
    });
    expect(refetchMock).toHaveBeenCalled();
  });

  it('uses mod server role mutation for mod defaults', async () => {
    const wrapper = mount(DefaultRolesEditor, {
      props: { serverConfig: serverConfig.value },
    });
    const editBtn = wrapper.find('[data-test="edit-DefaultModRole"]');
    await editBtn.trigger('click');
    const saveBtn = wrapper.find(
      '[data-testid="default-roles-modal-primary-button"]'
    );
    await saveBtn.trigger('click');
    expect(updateModServerRole).toHaveBeenCalled();
  });
});
