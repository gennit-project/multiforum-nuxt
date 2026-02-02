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

type RoleState = {
  name: string;
  description: string;
  values: Record<string, boolean>;
};

const props = defineProps<{
  serverConfig: Record<string, any> | null;
  title?: string;
  types?: Array<'server' | 'mod'>;
  showTitle?: boolean;
  onUpdated?: () => void;
}>();

const roleHelpCopy: Record<string, string> = {
  DefaultServerRole: 'By default in a new forum, users have these permissions.',
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

const roleState = reactive<Record<string, RoleState>>({});
const editingRoleKey = ref<string | null>(null);
const showModal = ref(false);

const {
  mutate: updateServerRole,
  onDone: onUpdateServerRoleDone,
  loading: updateServerRoleLoading,
  error: updateServerRoleError,
} = useMutation(UPDATE_SERVER_ROLE);
const {
  mutate: updateModRole,
  onDone: onUpdateModRoleDone,
  loading: updateModRoleLoading,
  error: updateModRoleError,
} = useMutation(UPDATE_MOD_SERVER_ROLE);

const mutationLoading = computed(() => {
  const def = editingDefinition.value;
  if (!def) return false;
  return def.type === 'server'
    ? updateServerRoleLoading.value
    : updateModRoleLoading.value;
});

const handleMutationDone = () => {
  showModal.value = false;
  editingRoleKey.value = null;
  props.onUpdated?.();
};

onUpdateServerRoleDone(handleMutationDone);
onUpdateModRoleDone(handleMutationDone);

const definitions = computed<RoleDefinition[]>(() => {
  if (!props.serverConfig) return [];
  const cfg = props.serverConfig;
  const allowedTypes = (props.types ?? [
    'server',
    'mod',
  ]) as RoleDefinition['type'][];
  return [
    {
      key: 'DefaultServerRole',
      label: 'Default Server Role',
      type: 'server' as const,
      permissions: serverPermissionKeys,
      node: cfg.DefaultServerRole,
    },
    {
      key: 'DefaultModRole',
      label: 'Default Mod Role',
      type: 'mod' as const,
      permissions: modPermissionKeys,
      node: cfg.DefaultModRole,
    },
    {
      key: 'DefaultElevatedModRole',
      label: 'Default Elevated Mod Role',
      type: 'mod' as const,
      permissions: modPermissionKeys,
      node: cfg.DefaultElevatedModRole,
    },
    {
      key: 'DefaultSuspendedRole',
      label: 'Default Suspended Role',
      type: 'server' as const,
      permissions: serverPermissionKeys,
      node: cfg.DefaultSuspendedRole,
    },
    {
      key: 'DefaultSuspendedModRole',
      label: 'Default Suspended Mod Role',
      type: 'mod' as const,
      permissions: modPermissionKeys,
      node: cfg.DefaultSuspendedModRole,
    },
  ].filter((def) => !!def.node && allowedTypes.includes(def.type));
});

const ensureRoleState = (def: RoleDefinition): RoleState => {
  if (!roleState[def.key]) {
    roleState[def.key] = {
      name: def.node?.name || '',
      description: def.node?.description || '',
      values: def.permissions.reduce<Record<string, boolean>>((acc, perm) => {
        acc[perm] = !!def.node?.[perm];
        return acc;
      }, {}),
    };
  }
  return roleState[def.key]!;
};

watch(
  definitions,
  (defs) => {
    defs.forEach((def) => {
      if (!def.node) return;
      ensureRoleState(def);
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
  const state = ensureRoleState(def);
  state.name = def.node.name || '';
  state.description = def.node.description || '';
  def.permissions.forEach((perm) => {
    state.values[perm] = !!def.node?.[perm];
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
  const state = ensureRoleState(def);
  try {
    const input = {
      name: state.name,
      description: state.description,
      ...state.values,
    };
    if (def.type === 'server') {
      await updateServerRole({ name: def.node.name, input });
    } else {
      await updateModRole({ name: def.node.name, input });
    }
    roleState[def.key] = {
      name: state.name,
      description: state.description,
      values: { ...state.values },
    };
    if (def.node) {
      def.node.name = state.name;
      def.node.description = state.description;
      def.permissions.forEach((perm) => {
        def.node![perm] = state.values[perm];
      });
    }
  } catch {
    resetEditingState();
  }
};
</script>

<template>
  <div
    class="space-y-4 rounded-lg border shadow-sm dark:border-gray-800 dark:bg-gray-800"
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
        class="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-100 p-4 dark:border-gray-900 dark:bg-black"
      >
        <div class="flex items-center justify-between gap-2">
          <h3 class="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {{ def.label }}
          </h3>
          <button
            type="button"
            class="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            :data-test="`edit-${def.key}`"
            @click="openModal(def.key)"
          >
            <PencilIcon class="h-4 w-4" />
            Edit
          </button>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          {{ roleHelpCopy[def.key] || '' }}
        </p>
        <p
          v-if="def.node?.description"
          class="text-xs text-gray-700 dark:text-gray-300"
        >
          {{ def.node.description }}
        </p>

        <PermissionsList :permissions="def.node || {}" />
      </div>
    </div>

    <p
      v-if="updateServerRoleError || updateModRoleError"
      class="text-sm text-red-600"
      data-test="default-roles-error"
    >
      {{
        updateServerRoleError?.message ||
        updateModRoleError?.message ||
        'Unable to save changes. Please try again.'
      }}
    </p>

    <GenericModal
      :open="showModal"
      data-testid="default-roles-modal"
      :title="editingDefinition?.label || 'Edit Role'"
      primary-button-text="Save"
      secondary-button-text="Cancel"
      :loading="mutationLoading"
      :primary-button-disabled="mutationLoading"
      @close="closeModal"
      @primary-button-click="saveRole"
    >
      <template #icon>
        <PencilIcon class="h-6 w-6 text-orange-500" />
      </template>
      <template #content>
        <div v-if="editingDefinition" class="space-y-4">
          <p class="text-xs text-gray-600 dark:text-gray-300">
            {{ roleHelpCopy[editingDefinition.key] || '' }}
          </p>
          <div class="space-y-1">
            <label
              for="role-name-input"
              class="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              Role name
            </label>
            <input
              id="role-name-input"
              v-model="roleState[editingDefinition.key]!.name"
              type="text"
              class="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              :disabled="mutationLoading"
            >
          </div>
          <div class="space-y-1">
            <label
              for="role-description-input"
              class="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
            >
              Role description
            </label>
            <textarea
              id="role-description-input"
              v-model="roleState[editingDefinition.key]!.description"
              rows="3"
              class="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              :disabled="mutationLoading"
            />
          </div>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label
              v-for="perm in editingDefinition.permissions"
              :key="perm"
              class="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <span class="text-gray-800 dark:text-gray-100">
                {{ formatPermissionName(perm) }}
              </span>
              <input
                v-model="roleState[editingDefinition.key]!.values[perm]"
                type="checkbox"
                class="h-4 w-4 rounded border border-gray-300 accent-blue-600 dark:border-gray-600 dark:accent-blue-400"
                :disabled="mutationLoading"
                :aria-label="formatPermissionName(perm)"
              >
            </label>
          </div>
        </div>
      </template>
    </GenericModal>
  </div>
</template>
