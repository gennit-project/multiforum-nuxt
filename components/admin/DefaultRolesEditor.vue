<script setup lang="ts">
import { computed, reactive, watch, ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { UPDATE_MOD_SERVER_ROLE, UPDATE_SERVER_ROLE } from '@/graphQLData/admin/mutations';

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
}>();

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

const roleState = reactive<Record<string, { name: string; values: Record<string, boolean> }>>({});
const mutationError = ref('');
const saving = reactive<Record<string, boolean>>({});

const { mutate: updateServerRole } = useMutation(UPDATE_SERVER_ROLE);
const { mutate: updateModRole } = useMutation(UPDATE_MOD_SERVER_ROLE);

const definitions = computed<RoleDefinition[]>(() => {
  if (!props.serverConfig) return [];
  const cfg = props.serverConfig;
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
  ].filter((def) => !!def.node);
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

const saveName = async (def: RoleDefinition) => {
  if (!def.node) return;
  const state = roleState[def.key];
  if (!state || state.name === def.node.name) return;
  mutationError.value = '';
  setSaving(def.key, true);
  try {
    if (def.type === 'server') {
      await updateServerRole({
        name: def.node.name,
        input: { name: state.name },
      });
    } else {
      await updateModRole({
        name: def.node.name,
        input: { name: state.name },
      });
    }
    def.node.name = state.name;
  } catch {
    mutationError.value = 'Unable to save changes. Please try again.';
    state.name = def.node.name || '';
  } finally {
    setSaving(def.key, false);
  }
};

const togglePermission = async (
  def: RoleDefinition,
  permission: string,
  value: boolean
) => {
  if (!def.node) return;
  const state = roleState[def.key];
  if (!state) return;
  const previous = state.values[permission];
  state.values[permission] = value;
  mutationError.value = '';
  setSaving(`${def.key}-${permission}`, true);
  try {
    const input = { [permission]: value };
    if (def.type === 'server') {
      await updateServerRole({ name: def.node.name, input });
    } else {
      await updateModRole({ name: def.node.name, input });
    }
    def.node[permission] = value;
  } catch {
    state.values[permission] = previous;
    mutationError.value = 'Unable to save changes. Please try again.';
  } finally {
    setSaving(`${def.key}-${permission}`, false);
  }
};
</script>

<template>
  <div class="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Default Server Roles
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Edit the fallback roles used across all channels. Changes apply
        immediately.
      </p>
    </div>

    <div v-if="!definitions.length" class="text-sm text-gray-600 dark:text-gray-300">
      No default roles found.
    </div>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div
        v-for="def in definitions"
        :key="def.key"
        class="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ def.label }}
          </h3>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Role name
          </label>
          <input
            v-model="roleState[def.key].name"
            type="text"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100"
            :disabled="saving[def.key]"
            @blur="saveName(def)"
            @keyup.enter="saveName(def)"
          >
          <p class="text-xs text-gray-600 dark:text-gray-400">
            This is the default fallback role.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-2">
          <label
            v-for="perm in def.permissions"
            :key="perm"
            class="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <span class="text-gray-800 dark:text-gray-100">
              {{ formatPermissionName(perm) }}
            </span>
            <input
              type="checkbox"
              class="h-4 w-4 accent-blue-600 dark:accent-blue-400"
              :checked="roleState[def.key]?.values[perm]"
              :disabled="saving[`${def.key}-${perm}`]"
              @change="
                togglePermission(
                  def,
                  perm,
                  ($event.target as HTMLInputElement).checked
                )
              "
            >
          </label>
        </div>
      </div>
    </div>

    <p
      v-if="mutationError"
      class="text-sm text-red-600"
      data-test="default-roles-error"
    >
      {{ mutationError }}
    </p>
  </div>
</template>
