<script setup lang="ts">
import { computed, reactive, watch, ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import {
  UPDATE_MOD_SERVER_ROLE,
  UPDATE_SERVER_ROLE,
} from '@/graphQLData/admin/mutations';
import PermissionsList from '@/components/admin/PermissionsList.vue';
import GenericModal from '@/components/GenericModal.vue';
import PencilIcon from '@/components/icons/PencilIcon.vue';

interface RoleNode {
  name?: string | null;
  description?: string | null;
  [key: string]: any;
}

interface RoleDefinition {
  key: string;
  label: string;
  type: 'server' | 'mod';
  permissions: string[];
  node: RoleNode | null | undefined;
}

const props = defineProps<{
  serverConfig: Record<string, any> | null;
  title?: string;
  types?: Array<'server' | 'mod'>;
  showTitle?: boolean;
}>();

const roleHelpCopy: Record<string, string> = {
  DefaultServerRole:
    'By default in a new forum, users have these permissions.',
  DefaultSuspendedRole:
    'By default in a new forum with no configuration, suspended users have these permissions.',
  DefaultModRole:
    'By default in a new forum, new users have these default content moderation permissions.',
  DefaultElevatedModRole:
    'By default in a new forum, users added as moderators at the forum scope have these permissions.',
  DefaultSuspendedModRole:
    'By default in a new forum, mod profiles who are suspended have these permissions.',
};

const serverPermissionKeys = [
  'canCreateChannel',
  'canCreateDiscussion',
  'canCreateEvent',
  'canCreateComment',
  'canUpvoteDiscussion',
  'canUpvoteComment',
  'canUploadFile',
  'canGiveFeedback',
  'showAdminTag',
];

const modPermissionKeys = [
  'canHideComment',
  'canHideDiscussion',
  'canHideEvent',
  'canEditComments',
  'canEditDiscussions',
  'canEditEvents',
  'canGiveFeedback',
  'canOpenSupportTickets',
  'canCloseSupportTickets',
  'canReport',
  'canSuspendUser',
  'canLockChannel',
];

const roleState = reactive<
  Record<string, { name: string; values: Record<string, boolean> }>
>({});
const mutationError = ref('');
const saving = reactive<Record<string, boolean>>({});
const editingRoleKey = ref<string | null>(null);
const showModal = ref(false);

const { mutate: updateServerRole } = useMutation(UPDATE_SERVER_ROLE);
const { mutate: updateModRole } = useMutation(UPDATE_MOD_SERVER_ROLE);

const definitions = computed<RoleDefinition[]>(() => {
  if (!props.serverConfig) return [];
  const cfg = props.serverConfig;
  const allowedTypes = props.types ?? ['server', 'mod'];
  return [
    {
      key: 'DefaultServerRole',
      label: 'Default Server Role',
      type: 'server',
      permissions: serverPermissionKeys,
      node: cfg.DefaultServerRole,
    },
    {
      key: 'DefaultModRole',
      label: 'Default Mod Role',
      type: 'mod',
      permissions: modPermissionKeys,
      node: cfg.DefaultModRole,
    },
    {
      key: 'DefaultElevatedModRole',
      label: 'Default Elevated Mod Role',
      type: 'mod',
      permissions: modPermissionKeys,
      node: cfg.DefaultElevatedModRole,
    },
    {
      key: 'DefaultSuspendedRole',
      label: 'Default Suspended Role',
      type: 'server',
      permissions: serverPermissionKeys,
      node: cfg.DefaultSuspendedRole,
    },
    {
      key: 'DefaultSuspendedModRole',
      label: 'Default Suspended Mod Role',
      type: 'mod',
      permissions: modPermissionKeys,
      node: cfg.DefaultSuspendedModRole,
    },
  ].filter((def) => !!def.node && allowedTypes.includes(def.type));
});

watch(
  definitions,
  (defs) => {
    defs.forEach((def) => {
      if (!def.node) return;
      roleState[def.key] = {
        name: def.node.name || '',
        values: def.permissions.reduce<Record<string, boolean>>((acc, perm) => {
          acc[perm] = !!def.node?.[perm];
          return acc;
        }, {}),
      };
    });
  },
  { immediate: true }
);

const formatPermissionName = (name: string) =>
  name
    .replace(/^can/i, '')
    .split(/(?=[A-Z])/)
    .map((w) => w.toLowerCase())
    .join(' ')
    .replace(/^./, (c) => c.toUpperCase());

const setSaving = (key: string, value: boolean) => {
  saving[key] = value;
};

const editingDefinition = computed(() =>
  definitions.value.find((def) => def.key === editingRoleKey.value)
);

const openModal = (key: string) => {
  editingRoleKey.value = key;
  showModal.value = true;
};

const resetEditingState = () => {
  const def = editingDefinition.value;
  if (!def?.node) return;
  roleState[def.key].name = def.node.name || '';
  def.permissions.forEach((perm) => {
    roleState[def.key].values[perm] = !!def.node?.[perm];
  });
};

const closeModal = () => {
  resetEditingState();
  showModal.value = false;
  editingRoleKey.value = null;
};

const saveRole = async () => {
  const def = editingDefinition.value;
  if (!def?.node) return;
  const state = roleState[def.key];
  mutationError.value = '';
  setSaving(def.key, true);
  try {
    const input = {
      name: state.name,
      ...state.values,
    };
    if (def.type === 'server') {
      await updateServerRole({ name: def.node.name, input });
    } else {
      await updateModRole({ name: def.node.name, input });
    }
    def.node.name = state.name;
    def.permissions.forEach((perm) => {
      def.node![perm] = state.values[perm];
    });
    showModal.value = false;
    editingRoleKey.value = null;
  } catch {
    mutationError.value = 'Unable to save changes. Please try again.';
    resetEditingState();
  } finally {
    setSaving(def.key, false);
  }
};
</script>

<template>
  <div
    class="dark:border-slate-800 dark:bg-slate-950 space-y-4 rounded-lg border-gray-200 bg-white shadow-sm"
  >
    <div v-if="showTitle !== false" class="space-y-1">
      <h2 class="font-semibold text-lg text-gray-900 dark:text-gray-100">
        {{ title || 'Default Roles' }}
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Edit the fallback roles used across all channels. Changes apply
        immediately.
      </p>
    </div>

    <div
      v-if="!definitions.length"
      class="text-sm text-gray-600 dark:text-gray-300"
    >
      No default roles found.
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="def in definitions"
        :key="def.key"
        class="bg-gray-50 dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3 rounded-md border border-gray-200 p-4"
      >
        <div class="flex items-center justify-between gap-2">
          <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {{ def.label }}
          </h3>
          <p class="flex-1 text-xs text-gray-600 dark:text-gray-400">
            {{ roleHelpCopy[def.key] || '' }}
          </p>
          <button
            type="button"
            class="dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:text-gray-100"
            :data-test="`edit-${def.key}`"
            @click="openModal(def.key)"
          >
            <PencilIcon class="h-4 w-4" />
            Edit
          </button>
        </div>

        <PermissionsList :permissions="def.node || {}" />
      </div>
    </div>

    <p
      v-if="mutationError"
      class="text-sm text-red-600"
      data-test="default-roles-error"
    >
      {{ mutationError }}
    </p>

    <GenericModal
      :open="showModal"
      :title="editingDefinition?.label || 'Edit Role'"
      @close="closeModal"
    >
      <div v-if="editingDefinition" class="space-y-4">
        <div class="space-y-1">
          <label
            class="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            Role name
          </label>
          <input
            v-model="roleState[editingDefinition.key].name"
            type="text"
            class="dark:border-slate-700 dark:bg-slate-800 w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:text-gray-100"
            :disabled="saving[editingDefinition.key]"
          >
        </div>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label
            v-for="perm in editingDefinition.permissions"
            :key="perm"
            class="dark:border-slate-700 dark:bg-slate-900 flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <span class="text-gray-800 dark:text-gray-100">
              {{ formatPermissionName(perm) }}
            </span>
            <input
              v-model="roleState[editingDefinition.key].values[perm]"
              type="checkbox"
              class="h-4 w-4 accent-blue-600 dark:accent-blue-400"
            >
          </label>
        </div>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100"
            @click="closeModal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="font-semibold rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="saving[editingDefinition.key]"
            data-test="save-role"
            @click="saveRole"
          >
            Save
          </button>
        </div>
      </div>
    </GenericModal>
  </div>
</template>
