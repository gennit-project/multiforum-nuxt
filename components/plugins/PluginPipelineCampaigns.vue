<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  useApolloClient,
  useMutation,
  useQuery,
} from '@vue/apollo-composable';
import type { EventPipeline } from '@/utils/pipelineSchema';
import {
  GET_PLUGIN_PIPELINE_CAMPAIGNS,
  GET_PLUGIN_PIPELINE_CAMPAIGN_FAILURES,
  PREVIEW_PLUGIN_PIPELINE_CAMPAIGN,
} from '@/graphQLData/admin/queries';
import {
  CREATE_PLUGIN_PIPELINE_CAMPAIGN,
  PAUSE_PLUGIN_PIPELINE_CAMPAIGN,
  RESUME_PLUGIN_PIPELINE_CAMPAIGN,
} from '@/graphQLData/admin/mutations';

type CampaignPreview = {
  policyId: string;
  eventType: string;
  applicability: string;
  enforcementBehavior: string;
  affectedFileCount: number;
  accessibleFileCount: number;
  unavailableFileCount: number;
  estimatedProviderRuns: number;
};

type Campaign = CampaignPreview & {
  id: string;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'DRAFT';
  concurrency: number;
  rateLimitPerMinute: number;
  completedCount: number;
  runningCount: number;
  failedCount: number;
  timedOutCount: number;
  createdByUsername: string;
};

type CampaignFailure = {
  pipelineId: string;
  targetId: string;
  discussionId: string;
  channelId: string;
  status: string;
  attemptNumber: number;
};

const props = defineProps<{ pipelines?: EventPipeline[] }>();
const { resolveClient } = useApolloClient();
const previews = ref<Record<string, CampaignPreview>>({});
const failures = ref<Record<string, CampaignFailure[]>>({});
const busyPolicyId = ref<string | null>(null);
const errorMessage = ref('');
const concurrency = ref(2);
const rateLimitPerMinute = ref(30);

const eligiblePolicies = computed(() =>
  (props.pipelines || []).filter(
    (pipeline) =>
      pipeline.policyId &&
      pipeline.event.startsWith('downloadableFile.') &&
      ['ALL_FILES_GRADUAL', 'ALL_FILES_IMMEDIATE'].includes(
        pipeline.applicability || ''
      )
  )
);

const { result, refetch } = useQuery(GET_PLUGIN_PIPELINE_CAMPAIGNS, undefined, {
  pollInterval: 5000,
});
const campaigns = computed<Campaign[]>(
  () => result.value?.getPluginPipelineCampaigns || []
);
const activePolicyIds = computed(
  () =>
    new Set(
      campaigns.value
        .filter((campaign) =>
          ['DRAFT', 'RUNNING', 'PAUSED'].includes(campaign.status)
        )
        .map((campaign) => campaign.policyId)
    )
);

const { mutate: createCampaign } = useMutation(
  CREATE_PLUGIN_PIPELINE_CAMPAIGN
);
const { mutate: pauseCampaign } = useMutation(PAUSE_PLUGIN_PIPELINE_CAMPAIGN);
const { mutate: resumeCampaign } = useMutation(RESUME_PLUGIN_PIPELINE_CAMPAIGN);

const preview = async (policyId: string) => {
  busyPolicyId.value = policyId;
  errorMessage.value = '';
  try {
    const response = await resolveClient().query<{
      previewPluginPipelineCampaign: CampaignPreview;
    }>({
      query: PREVIEW_PLUGIN_PIPELINE_CAMPAIGN,
      variables: { policyId },
      fetchPolicy: 'network-only',
    });
    previews.value[policyId] = response.data.previewPluginPipelineCampaign;
  } catch (error: unknown) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Campaign preview failed.';
  } finally {
    busyPolicyId.value = null;
  }
};

const start = async (policyId: string) => {
  busyPolicyId.value = policyId;
  errorMessage.value = '';
  try {
    await createCampaign({
      policyId,
      concurrency: concurrency.value,
      rateLimitPerMinute: rateLimitPerMinute.value,
    });
    await refetch();
  } catch (error: unknown) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Campaign could not start.';
  } finally {
    busyPolicyId.value = null;
  }
};

const changeStatus = async (campaign: Campaign) => {
  busyPolicyId.value = campaign.policyId;
  errorMessage.value = '';
  try {
    const mutate =
      campaign.status === 'RUNNING' ? pauseCampaign : resumeCampaign;
    await mutate({ campaignId: campaign.id });
    await refetch();
  } catch (error: unknown) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Campaign could not be updated.';
  } finally {
    busyPolicyId.value = null;
  }
};

const loadFailures = async (campaignId: string) => {
  const response = await resolveClient().query<{
    getPluginPipelineCampaignFailures: CampaignFailure[];
  }>({
    query: GET_PLUGIN_PIPELINE_CAMPAIGN_FAILURES,
    variables: { campaignId },
    fetchPolicy: 'network-only',
  });
  failures.value[campaignId] =
    response.data.getPluginPipelineCampaignFailures;
};

const failureUrl = (failure: CampaignFailure) =>
  `/forums/${encodeURIComponent(failure.channelId)}/downloads/${encodeURIComponent(
    failure.discussionId
  )}/pipelines?attempt=${encodeURIComponent(
    failure.pipelineId
  )}#attempt-${encodeURIComponent(failure.pipelineId)}`;
</script>

<template>
  <div class="space-y-5">
    <p class="text-sm text-gray-600 dark:text-gray-300">
      Preview and gradually check files that predate a rollout policy. Saving a
      policy does not start a campaign.
    </p>
    <p
      v-if="errorMessage"
      role="alert"
      class="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200"
    >
      {{ errorMessage }}
    </p>

    <div v-if="eligiblePolicies.length" class="space-y-3">
      <article
        v-for="policy in eligiblePolicies"
        :key="policy.policyId"
        class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="font-medium dark:text-white">{{ policy.event }}</h3>
            <p class="text-xs text-gray-500">Policy {{ policy.policyId }}</p>
          </div>
          <button
            type="button"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:text-white"
            :disabled="busyPolicyId === policy.policyId"
            @click="preview(policy.policyId!)"
          >
            Preview existing files
          </button>
        </div>
        <div
          v-if="previews[policy.policyId!]"
          class="mt-4 rounded-md bg-gray-50 p-4 text-sm dark:bg-gray-900 dark:text-gray-200"
        >
          <p>{{ previews[policy.policyId!]?.enforcementBehavior }}</p>
          <dl class="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <dt class="text-gray-500">Affected</dt>
              <dd class="font-semibold">{{ previews[policy.policyId!]?.affectedFileCount }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Accessible</dt>
              <dd class="font-semibold">{{ previews[policy.policyId!]?.accessibleFileCount }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Unavailable</dt>
              <dd class="font-semibold">{{ previews[policy.policyId!]?.unavailableFileCount }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Provider runs</dt>
              <dd class="font-semibold">{{ previews[policy.policyId!]?.estimatedProviderRuns }}</dd>
            </div>
          </dl>
          <div class="mt-4 flex flex-wrap items-end gap-3">
            <label class="text-xs">
              Concurrency
              <input v-model.number="concurrency" type="number" min="1" max="20" class="mt-1 block w-24 rounded border px-2 py-1 dark:bg-gray-800">
            </label>
            <label class="text-xs">
              Runs/minute
              <input v-model.number="rateLimitPerMinute" type="number" min="1" max="1000" class="mt-1 block w-28 rounded border px-2 py-1 dark:bg-gray-800">
            </label>
            <button
              type="button"
              class="rounded-md bg-orange-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              :disabled="activePolicyIds.has(policy.policyId!) || busyPolicyId === policy.policyId"
              @click="start(policy.policyId!)"
            >
              Start campaign
            </button>
          </div>
        </div>
      </article>
    </div>
    <p v-else class="text-sm text-gray-500">
      Save a gradual or immediate existing-file rollout policy to create a campaign.
    </p>

    <div v-if="campaigns.length" class="space-y-3">
      <h3 class="font-semibold dark:text-white">Campaign history</h3>
      <article
        v-for="campaign in campaigns"
        :key="campaign.id"
        class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
      >
        <div class="flex flex-wrap justify-between gap-3">
          <div>
            <p class="font-medium dark:text-white">{{ campaign.eventType }}</p>
            <p class="text-xs text-gray-500">
              {{ campaign.status }} · concurrency {{ campaign.concurrency }} ·
              {{ campaign.rateLimitPerMinute }}/minute
            </p>
          </div>
          <button
            v-if="['RUNNING', 'PAUSED'].includes(campaign.status)"
            type="button"
            class="rounded-md border px-3 py-1.5 text-sm dark:text-white"
            @click="changeStatus(campaign)"
          >
            {{ campaign.status === 'RUNNING' ? 'Pause' : 'Resume' }}
          </button>
        </div>
        <dl class="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div><dt class="text-gray-500">Completed</dt><dd>{{ campaign.completedCount }}</dd></div>
          <div><dt class="text-gray-500">Running</dt><dd>{{ campaign.runningCount }}</dd></div>
          <div><dt class="text-gray-500">Failed</dt><dd>{{ campaign.failedCount }}</dd></div>
          <div><dt class="text-gray-500">Timed out</dt><dd>{{ campaign.timedOutCount }}</dd></div>
        </dl>
        <button
          v-if="campaign.failedCount + campaign.timedOutCount > 0"
          type="button"
          class="mt-3 text-sm text-orange-700 underline dark:text-orange-300"
          @click="loadFailures(campaign.id)"
        >
          View failures
        </button>
        <ul v-if="failures[campaign.id]" class="mt-2 space-y-1 text-sm">
          <li v-for="failure in failures[campaign.id]" :key="failure.pipelineId">
            <a :href="failureUrl(failure)" class="text-orange-700 underline dark:text-orange-300">
              Attempt {{ failure.attemptNumber }} · {{ failure.status }}
            </a>
          </li>
        </ul>
      </article>
    </div>
  </div>
</template>
