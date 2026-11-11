<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import {
  GetChannelRuleGovernanceDocument,
  SetChannelRuleEnforcementDocument,
  RequestChannelRuleEnforcementDocument,
} from '@/__generated__/operations';

const props = defineProps<{
  channelUniqueName: string;
  pluginId: string;
}>();
const emit = defineEmits<{ changed: [] }>();
const { result, loading, error, refetch } = useQuery(
  GetChannelRuleGovernanceDocument,
  () => ({
    channelUniqueName: props.channelUniqueName,
    pluginId: props.pluginId,
  }),
  { fetchPolicy: 'network-only' }
);
const status = computed(() => result.value?.getChannelRuleGovernance);
const message = ref('');
const {
  mutate: setEnabled,
  loading: saving,
  error: saveError,
  onDone: onSaved,
} = useMutation(SetChannelRuleEnforcementDocument, {
  throws: 'never',
  errorPolicy: 'none',
});
const {
  mutate: request,
  loading: requesting,
  error: requestError,
  onDone: onRequested,
} = useMutation(RequestChannelRuleEnforcementDocument, {
  throws: 'never',
  errorPolicy: 'none',
});
const pending = computed(
  () => loading.value || saving.value || requesting.value
);
const actionError = computed(() => saveError.value || requestError.value);

onSaved(({ data }) => {
  if (data?.setChannelRuleEnforcement !== true) return;
  message.value = 'Channel-rule enforcement updated.';
  void refetch();
  emit('changed');
});
onRequested(({ data }) => {
  if (!data?.requestChannelRuleEnforcement?.id) return;
  message.value =
    'Request sent to server admins. Approval makes this forum eligible; you can then enable its rules.';
  void refetch();
});

const toggle = (event: Event) => {
  // Native checkboxes change before the request. Keep the displayed choice
  // authoritative until the backend confirms and the status query refreshes.
  (event.target as HTMLInputElement).checked =
    status.value?.ownerEnabled ?? false;
  if (
    !status.value ||
    pending.value ||
    (!status.value.eligible && !status.value.ownerEnabled)
  )
    return;
  message.value = '';
  saveError.value = null;
  requestError.value = null;
  void setEnabled({
    channelUniqueName: props.channelUniqueName,
    pluginId: props.pluginId,
    enabled: !status.value.ownerEnabled,
  });
};
const requestEligibility = () => {
  if (
    !status.value?.canRequest ||
    pending.value ||
    status.value.pendingRequestId
  )
    return;
  message.value = '';
  saveError.value = null;
  requestError.value = null;
  void request({
    channelUniqueName: props.channelUniqueName,
    pluginId: props.pluginId,
  });
};
</script>

<template>
  <section
    aria-label="Rule enforcement"
    class="space-y-4 rounded-xl border border-gray-300 bg-gray-50 p-6 dark:border-gray-600 dark:bg-gray-800"
  >
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
      Rule enforcement
    </h2>
    <p v-if="error" role="alert" class="text-red-700 dark:text-red-300">
      Could not load rule eligibility: {{ error.message }}
    </p>
    <button
      v-if="error"
      type="button"
      class="min-h-11 rounded border px-4 dark:text-white"
      @click="refetch()"
    >
      Retry
    </button>
    <p
      v-else-if="loading && !status"
      role="status"
      class="text-gray-700 dark:text-gray-300"
    >
      Loading rule eligibility...
    </p>
    <template v-else-if="status">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        <template v-if="status.migrationRequired"
          >Server-rule enforcement uses a legacy allowlist. A server admin must
          choose global On or Off.</template
        >
        <template v-else-if="status.serverRuleEnforcement === 'on'"
          >Server rules are enforced in every forum. Only server admins can
          change this.</template
        >
        <template v-else
          >Server-rule enforcement is off. Only server admins can change
          this.</template
        >
      </p>
      <p
        v-if="!status.version"
        class="text-sm text-gray-700 dark:text-gray-300"
      >
        This plugin is not enabled on the server.
      </p>
      <p
        v-else-if="status.channelRuleEligibility === 'none'"
        class="text-sm text-gray-700 dark:text-gray-300"
      >
        Server policy disables channel-rule enforcement for all forums.
      </p>
      <p
        v-else-if="!status.eligible"
        class="text-sm text-gray-700 dark:text-gray-300"
      >
        This forum is not on the channel-rule eligibility allowlist.
      </p>
      <p v-else class="text-sm text-gray-700 dark:text-gray-300">
        This forum is eligible. Enabling checks its content against its own
        forum rules.
      </p>
      <label
        class="flex min-h-11 items-center gap-3 text-sm font-medium text-gray-900 dark:text-white"
      >
        <input
          type="checkbox"
          :checked="status.ownerEnabled"
          :disabled="pending || (!status.eligible && !status.ownerEnabled)"
          class="h-5 w-5 rounded border-gray-400"
          @change="toggle"
        />
        Enforce this forum's rules
      </label>
      <p
        v-if="status.ownerEnabled && !status.eligible"
        class="text-sm text-gray-700 dark:text-gray-300"
      >
        Your opt-in is saved, but channel-rule enforcement is inactive under the
        current server policy.
      </p>
      <p
        v-if="status.pendingRequestNumber"
        role="status"
        class="text-sm text-gray-700 dark:text-gray-300"
      >
        Request awaiting admin approval.
        <NuxtLink
          :to="`/server/issues/${status.pendingRequestNumber}`"
          class="text-brand-700 dark:text-brand-300 underline"
          >View request #{{ status.pendingRequestNumber }}</NuxtLink
        >
      </p>
      <button
        v-else-if="status.canRequest"
        type="button"
        :disabled="pending"
        class="bg-brand-700 hover:bg-brand-800 min-h-11 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        @click="requestEligibility"
      >
        {{
          requesting ? 'Sending request...' : 'Request channel-rule enforcement'
        }}
      </button>
    </template>
    <p
      v-if="actionError"
      role="alert"
      class="text-sm text-red-700 dark:text-red-300"
    >
      {{ actionError.message }}
    </p>
    <p role="status" class="text-sm text-gray-700 dark:text-gray-300">
      {{ message }}
    </p>
  </section>
</template>
