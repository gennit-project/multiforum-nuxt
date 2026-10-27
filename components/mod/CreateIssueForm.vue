<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useRouter } from 'nuxt/app';
import TextInput from '@/components/TextInput.vue';
import TextEditor from '@/components/TextEditor.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import GenericButton from '@/components/GenericButton.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import type { IssueCreateInput } from '@/__generated__/graphql';
import { CREATE_ISSUE } from '@/graphQLData/issue/mutations';
import {
  COUNT_OPEN_ISSUES,
  SERVER_SCOPED_ISSUE_COUNT,
} from '@/graphQLData/mod/queries';
import { useModProfileName, useUsername } from '@/composables/useAuthState';

const modProfileNameVar = useModProfileName();
const usernameVar = useUsername();

const props = defineProps({
  defaultChannelId: {
    type: String,
    default: '',
  },
  // Where to send the user after creating an issue that is not tied to a
  // specific forum (i.e. the server-wide "New Issue" flow). Defaults to the
  // admin issue detail route; the public /server/issues create page overrides
  // this with 'server-issues-issueNumber' so the user stays in the public tree.
  serverDetailRouteName: {
    type: String,
    default: 'admin-issues-issueNumber',
  },
});

const router = useRouter();

const formValues = ref({
  title: '',
  body: '',
});

const selectedChannelId = ref(props.defaultChannelId);

watch(
  () => props.defaultChannelId,
  (newVal) => {
    selectedChannelId.value = newVal;
  }
);

const authorInput = computed(() => {
  if (modProfileNameVar.value) {
    return {
      ModerationProfile: {
        connect: {
          where: { node: { displayName: modProfileNameVar.value } },
        },
      },
    };
  }
  if (usernameVar.value) {
    return {
      User: {
        connect: { where: { node: { username: usernameVar.value } } },
      },
    };
  }
  return null;
});

const authorName = computed(() => {
  if (authorInput.value?.ModerationProfile?.connect?.where?.node?.displayName) {
    return authorInput.value.ModerationProfile.connect.where.node.displayName;
  }
  if (authorInput.value?.User?.connect?.where?.node?.username) {
    return authorInput.value.User.connect.where.node.username;
  }
  return '';
});

const issueInput = computed<IssueCreateInput>(
  () =>
    ({
      title: formValues.value.title.trim(),
      body: formValues.value.body.trim(),
      isOpen: true,
      flaggedServerRuleViolation: false,
      channelUniqueName: selectedChannelId.value || undefined,
      Channel: selectedChannelId.value
        ? {
            connect: {
              where: { node: { uniqueName: selectedChannelId.value } },
            },
          }
        : undefined,
      Author: authorInput.value || undefined,
      authorName: authorName.value || undefined,
      // The custom `createIssue` resolver accepts Channel/Author connect
      // portions that the generated `IssueCreateInput` no longer models, so
      // narrow through `unknown`.
    }) as unknown as IssueCreateInput
);

// Shape of the open-issue count queries after the v7 migration
// (`issuesConnection { aggregate { count { nodes } } }`). Kept loose so the
// optimistic cache write does not need to supply every connection field.
type IssueCountCache = {
  issuesConnection?: {
    aggregate?: { count?: { nodes?: number | null } | null } | null;
  } | null;
};

const canSubmit = computed(() => {
  return (
    !!authorInput.value &&
    formValues.value.title.trim().length > 0 &&
    formValues.value.body.trim().length > 0
  );
});

const {
  mutate: createIssue,
  loading: createIssueLoading,
  error: createIssueError,
  onDone: onCreateIssueDone,
} = useMutation(CREATE_ISSUE, () => ({
  variables: {
    input: issueInput.value,
  },
  update: (cache, { data }) => {
    const createdIssue = data?.createIssue;
    if (!createdIssue) return;

    if (selectedChannelId.value) {
      try {
        const openCount = cache.readQuery<IssueCountCache>({
          query: COUNT_OPEN_ISSUES,
          variables: { channelUniqueName: selectedChannelId.value },
        });
        const currentCount =
          openCount?.issuesConnection?.aggregate?.count?.nodes;
        if (typeof currentCount === 'number') {
          cache.writeQuery<IssueCountCache>({
            query: COUNT_OPEN_ISSUES,
            variables: { channelUniqueName: selectedChannelId.value },
            data: {
              issuesConnection: {
                aggregate: { count: { nodes: currentCount + 1 } },
              },
            },
          });
        }
      } catch {
        // Cache might not have this query yet; ignore.
      }
    }

    try {
      const serverCount = cache.readQuery<IssueCountCache>({
        query: SERVER_SCOPED_ISSUE_COUNT,
      });
      const currentServerCount =
        serverCount?.issuesConnection?.aggregate?.count?.nodes;
      if (typeof currentServerCount === 'number') {
        cache.writeQuery<IssueCountCache>({
          query: SERVER_SCOPED_ISSUE_COUNT,
          data: {
            issuesConnection: {
              aggregate: { count: { nodes: currentServerCount + 1 } },
            },
          },
        });
      }
    } catch {
      // Cache might not have this query yet; ignore.
    }
  },
}));

onCreateIssueDone((result) => {
  const newIssue = result?.data?.createIssue;
  if (!newIssue) return;

  const forumId =
    newIssue.Channel?.uniqueName ||
    newIssue.channelUniqueName ||
    selectedChannelId.value;

  if (forumId) {
    router.push({
      name: 'forums-forumId-issues-issueNumber',
      params: { forumId, issueNumber: newIssue.issueNumber },
      query: { subscribeCta: '1' },
    });
  } else {
    router.push({
      name: props.serverDetailRouteName,
      params: { issueNumber: newIssue.issueNumber },
      query: { subscribeCta: '1' },
    });
  }
});

const submit = async () => {
  if (!canSubmit.value || createIssueLoading.value) return;
  await createIssue();
};
</script>

<template>
  <RequireAuth>
    <template #has-auth>
      <div
        class="space-y-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <div class="space-y-1">
          <h1 class="font-semibold text-2xl dark:text-white">New Issue</h1>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Share a question or request with the moderators. This issue is not
            tied to a specific post, event, or comment.
          </p>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-200"
            >Title</label
          >
          <TextInput
            :value="formValues.title"
            :full-width="true"
            :placeholder="'What do you need help with?'"
            @update="formValues.title = $event"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-200"
            >Details</label
          >
          <TextEditor
            :initial-value="formValues.body"
            :disable-auto-focus="false"
            :placeholder="'Explain the request for the moderators'"
            @update="(value: string) => (formValues.body = value)"
          />
        </div>

        <ErrorBanner v-if="createIssueError" :text="createIssueError.message" />

        <div class="flex justify-end gap-2">
          <GenericButton :text="'Cancel'" @click="router.back()" />
          <PrimaryButton
            :label="'Create Issue'"
            :disabled="!canSubmit"
            :loading="createIssueLoading"
            @click="submit"
          />
        </div>
      </div>
    </template>
    <template #does-not-have-auth>
      <div class="flex justify-center p-8 text-gray-700 dark:text-gray-200">
        You don't have permission to create an issue. Please sign in first.
      </div>
    </template>
  </RequireAuth>
</template>
