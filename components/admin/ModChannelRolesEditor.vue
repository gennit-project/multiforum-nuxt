<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { GET_MOD_CHANNEL_ROLES } from '@/graphQLData/admin/queries';
import { UPDATE_MOD_CHANNEL_ROLE } from '@/graphQLData/admin/mutations';

type RoleRecord = Record<string, any> & {
  name?: string | null;
  description?: string | null;
  channelUniqueName?: string | null;
};

const permissionKeys = [
  'canEditComments',
  'canEditDiscussions',
  'canEditEvents',
  'canHideComment',
  'canHideDiscussion',
  'canHideEvent',
  'canGiveFeedback',
  'canReport',
  'canOpenSupportTickets',
  'canCloseSupportTickets',
  'canSuspendUser',
] as const;

const { result, loading, error } = useQuery(GET_MOD_CHANNEL_ROLES, undefined, {
  fetchPolicy: 'cache-first',
});

const mutationError = ref('');
const updatingStates = ref<Record<string, boolean>>({});

const { mutate } = useMutation(UPDATE_MOD_CHANNEL_ROLE);

const roles = computed<RoleRecord[]>(() => {
  if (!result.value?.modChannelRoles) return [];
  return (result.value.modChannelRoles as RoleRecord[]).slice();
});

const sortedRoles = computed(() => {
  return roles.value.slice().sort((a, b) => {
    const channelA = a.channelUniqueName || '';
    const channelB = b.channelUniqueName || '';
    if (channelA !== channelB) return channelA.localeCompare(channelB);
    return (a.name || '').localeCompare(b.name || '');
  });
});

const formatPermissionName = (name: string) => {
  return name
    .replace(/^can/i, '')
    .split(/(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join(' ')
    .replace(/^./, (s) => s.toUpperCase());
};

const updatingKey = (roleName: string, permission: string) =>
  `${roleName}-${permission}`;

const isUpdating = (roleName: string | null | undefined, permission: string) => {
  if (!roleName) return false;
  return updatingStates.value[updatingKey(roleName, permission)] ?? false;
};

const isRoleUpdating = (roleName: string | null | undefined) => {
  if (!roleName) return false;
  return Object.keys(updatingStates.value).some(
    (key) => key.startsWith(`${roleName}-`) && updatingStates.value[key]
  );
};

const onTogglePermission = async (
  role: RoleRecord,
  permission: (typeof permissionKeys)[number],
  value: boolean
) => {
  if (!role?.name) return;
  const key = updatingKey(role.name, permission);
  const previousValue = !!role[permission];
  mutationError.value = '';
  role[permission] = value;
  updatingStates.value[key] = true;
  try {
    await mutate({
      name: role.name,
      input: {
        [permission]: value,
      },
    });
  } catch {
    role[permission] = previousValue;
    mutationError.value =
      'Unable to save changes right now. Please try again.';
  } finally {
    updatingStates.value[key] = false;
  }
};
</script>

<template>
  <div
    class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800"
  >
    <div class="mb-4 space-y-1">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        Channel Mod Roles
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Toggle permissions (including edit permissions) for each channel-specific
        mod role.
      </p>
    </div>

    <div v-if="loading" class="text-sm text-gray-600 dark:text-gray-300">
      Loading roles...
    </div>
    <div v-else-if="error" class="text-sm text-red-600">
      Unable to load roles right now.
    </div>
    <div v-else-if="!sortedRoles.length" class="text-sm text-gray-600 dark:text-gray-300">
      No moderator roles found.
    </div>
    <div v-else class="space-y-4">
      <div
        v-for="(role, roleIndex) in sortedRoles"
        :key="role.name ?? role.channelUniqueName ?? roleIndex"
        class="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-900/60"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Channel: {{ role.channelUniqueName || 'Server default' }}
            </p>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ role.name }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{ role.description || 'No description provided.' }}
            </p>
          </div>
          <div
            v-if="isRoleUpdating(role.name)"
            class="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800"
          >
            Saving...
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label
            v-for="permission in permissionKeys"
            :key="permission"
            class="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800"
            :data-test="`permission-${permission}`"
          >
            <span class="text-gray-800 dark:text-gray-100">
              {{ formatPermissionName(permission) }}
            </span>
            <input
              type="checkbox"
              class="h-4 w-4 accent-blue-600"
              :checked="!!role[permission]"
              :disabled="loading || isUpdating(role.name, permission)"
              @change="
                onTogglePermission(
                  role,
                  permission,
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
      class="mt-3 text-sm text-red-600"
      data-test="mutation-error"
    >
      {{ mutationError }}
    </p>
  </div>
</template>
