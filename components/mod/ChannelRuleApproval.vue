<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { ApproveChannelRuleEnforcementDocument } from '@/__generated__/operations';
import type { IssueSummary } from '@/types/Issue';
import PrimaryButton from '@/components/PrimaryButton.vue';

const props = defineProps<{
  issue: Pick<
    IssueSummary,
    | 'id'
    | 'isOpen'
    | 'channelUniqueName'
    | 'relatedChannelUniqueName'
    | 'requestKind'
    | 'requestedPluginId'
  >;
  isServerAdmin: boolean;
}>();
const emit = defineEmits<{ approved: [] }>();
const isRequest = computed(
  () =>
    props.issue.requestKind === 'CHANNEL_RULE_ENFORCEMENT' &&
    props.issue.requestedPluginId === 'llm-moderation' &&
    !props.issue.channelUniqueName &&
    !!props.issue.relatedChannelUniqueName
);
const { mutate, loading, error, onDone, onError } = useMutation(
  ApproveChannelRuleEnforcementDocument,
  {
    errorPolicy: 'none',
    update(cache, { data }) {
      const request = data?.approveChannelRuleEnforcement;
      if (!request || request.isOpen !== false) return;
      cache.modify({
        id: cache.identify({ __typename: 'Issue', id: request.id }),
        fields: { isOpen: () => false },
      });
      // Eligibility and list membership changed, but owner opt-in did not.
      cache.evict({ id: 'ROOT_QUERY', fieldName: 'getChannelRuleGovernance' });
      cache.evict({ id: 'ROOT_QUERY', fieldName: 'getSiteWideIssueList' });
    },
  }
);
const approved = ref(false);
// Apollo exposes failures through `error`; registering a handler keeps rejected
// mutations out of Vue's event handler while preserving the retry control.
onError(() => {});
onDone(({ data }) => {
  if (
    data?.approveChannelRuleEnforcement?.id === props.issue.id &&
    data.approveChannelRuleEnforcement.isOpen === false
  ) {
    approved.value = true;
    emit('approved');
  }
});
const approve = () => {
  if (
    !isRequest.value ||
    !props.isServerAdmin ||
    !props.issue.isOpen ||
    loading.value ||
    approved.value
  )
    return;
  void mutate({ issueId: props.issue.id });
};
</script>

<template>
  <section
    v-if="isRequest"
    class="mx-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
    aria-labelledby="channel-rule-approval-heading"
  >
    <h2 id="channel-rule-approval-heading" class="text-lg font-semibold">
      Forum-rule enforcement request
    </h2>
    <p class="my-2 text-sm text-gray-700 dark:text-gray-200">
      Approval makes {{ issue.relatedChannelUniqueName }} eligible for automated
      forum-rule enforcement and closes this request. The forum owner must still
      opt in before forum rules are enforced.
    </p>
    <p v-if="approved" role="status">
      Forum-rule enforcement eligibility approved.
    </p>
    <p v-else-if="!issue.isOpen" class="text-sm">This request is closed.</p>
    <p v-if="error" role="alert" class="mb-2 text-red-700 dark:text-red-300">
      {{ error.message }}
    </p>
    <ClientOnly>
      <PrimaryButton
        v-if="isServerAdmin && issue.isOpen && !approved"
        :label="loading ? 'Approving…' : 'Approve eligibility'"
        :loading="loading"
        :disabled="loading"
        @click="approve"
      />
    </ClientOnly>
  </section>
</template>
