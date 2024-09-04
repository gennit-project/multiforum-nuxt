<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import type { Issue } from "@/__generated__/graphql";
import { DateTime } from "luxon";
import { useRoute } from "vue-router";
import GenericButton from "../buttons/GenericButton.vue";
import PrimaryButton from "../buttons/PrimaryButton.vue";
import ModerationStep from "./ModerationStep.vue";

export default defineComponent({
  components: {
    GenericButton,
    ModerationStep,
    PrimaryButton,
  },
  props: {
    issue: {
      type: Object as () => Issue,
      required: true,
    },
  },
  setup() {
    const route = useRoute();

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const stepNames = {
      ViolatesRules: {
        id: "ViolatesRules",
        title: "Does the post violate the rules?",
      },
      SelectRules: {
        id: "SelectRules",
        title: "What rules were broken?",
      },
      SelectAction: {
        id: "SelectAction",
        title: "What do you want to do with the post?",
      },
      SuspensionNeeded: {
        id: "SuspensionNeeded",
        title: "Should the author be suspended from this forum?",
      },
      SuspensionLength: {
        id: "SuspensionLength",
        title: "What should be the length of the suspension?",
      },
      SuspensionMessage: {
        id: "SuspensionMessage",
        title:
          "This is the message that will be sent to the author to notify them of their suspension. You can edit the message before sending it.",
      },
      RequestChangeMessage: {
        id: "RequestChangeMessage",
        title:
          "This is the message that will be sent to the author to request changes to their post. Would you like to edit it?",
      },
      CloseIssue: {
        id: "CloseIssue",
        title: "Do you want to close the issue?",
      },
      CloseIssueComment: {
        id: "CloseIssueComment",
        title: "Please leave a comment explaining your decision",
      },
      FinishedWizard: {
        id: "FinishedWizard",
        title: "Thank you for your help moderating this forum."
      },
    };

    const activeStep = ref(stepNames.ViolatesRules.id);
    const explanationComment = ref("");
    const brokenRules = ref("");
    const selectedPostAction = ref("");
    const selectedSuspensionLength = ref("");

    const postActions = [
      {
        id: "remove",
        title: `Remove the post from ${channelId.value}`,
      },
      {
        id: "hide",
        title: "Temporarily hide the post and request changes",
      },
      {
        id: "nothing",
        title: "Do nothing",
      },
    ];

    const suspensionLengths = [
      {
        id: "2days",
        title: "2 days",
      },
      {
        id: "2weeks",
        title: "2 weeks",
      },
      {
        id: "2months",
        title: "2 months",
      },
      {
        id: "indefinitely",
        title: "Indefinitely",
      },
    ];

    const suspensionMessage = computed(() => {
      return `
        Your post has been removed from ${
          channelId.value
        } for violating the following rules:
        ${brokenRules.value}

        As a result, you have been suspended from posting in ${
          channelId.value
        } ${
          selectedSuspensionLength.value === "indefinitely"
            ? "indefinitely"
            : `for ${selectedSuspensionLength.value}`
        }.

        If you believe this was done in error, please open a support ticket.
        `;
    });

    const requestChangeMessage = computed(() => {
      return `
        Your post has been hidden from ${channelId.value} for violating the following rules:
        ${brokenRules.value}

        Please edit your post to comply with the rules and then click the "Request Review" button.
        `;
    });

    return {
      activeStep,
      brokenRules,
      channelId,
      // discussion,
      explanationComment,
      // getDiscussionError,
      // getDiscussionLoading,
      postActions,
      requestChangeMessage,
      selectedPostAction,
      selectedSuspensionLength,
      stepNames,
      suspensionLengths,
      suspensionMessage,
    };
  },
  methods: {
    formatDate(date: string) {
      return DateTime.fromISO(date).toLocaleString(DateTime.DATE_FULL);
    },
  },
});
</script>

<template>
  <div class="flex flex-col justify-center w-full">
    <h1 class="text-xl font-bold">
      Moderation Wizard
    </h1>
    <hr>
    <div class="mt-6 flex justify-center space-y-4">
      <ModerationStep
        v-if="activeStep === stepNames.ViolatesRules.id"
        :title="stepNames.ViolatesRules.title"
        :enable-back="false"
      >
        <div class="flex justify-center gap-2">
          <GenericButton
            class="btn btn-primary"
            :text="'Yes'"
            @click="activeStep = stepNames.SelectRules.id"
          />
          <GenericButton
            class="btn btn-primary"
            :text="'No'"
            @click="activeStep = stepNames.CloseIssue.id"
          />
        </div>
      </ModerationStep>

      <ModerationStep
        v-if="activeStep === stepNames.SelectRules.id"
        :title="stepNames.SelectRules.title"
        @click-back="activeStep = stepNames.ViolatesRules.id"
      >
        <textarea
          class="h-24 w-full rounded-lg border border-gray-300 p-2 text-black"
          :value="brokenRules"
          @input="brokenRules = $event?.target?.value || ''"
        />
        <div class="flex justify-center gap-2">
          <PrimaryButton
            class="btn btn-primary"
            :disabled="!brokenRules"
            :label="'Continue'"
            @click="activeStep = stepNames.SelectAction.id"
          />
        </div>
      </ModerationStep>

      <ModerationStep
        v-if="activeStep === stepNames.SelectAction.id"
        :title="stepNames.SelectAction.title"
        @click-back="activeStep = stepNames.SelectRules.id"
      >
        <fieldset class="mt-4">
          <legend class="sr-only">
            Post actions
          </legend>
          <div class="space-y-4">
            <div
              v-for="action in postActions"
              :key="action.id"
              class="flex items-center"
            >
              <input
                :id="action.id"
                name="post-action"
                type="radio"
                :checked="action.id === selectedPostAction"
                class="text-indigo-600 focus:ring-indigo-600 h-4 w-4 border-gray-300"
                @change="selectedPostAction = action.id"
              >
              <label
                :for="action.id"
                class="font-medium ml-3 block text-sm leading-6 text-gray-900 dark:text-gray-100"
              >
                {{ action.title }}</label>
            </div>
          </div>
        </fieldset>

        <div class="flex justify-center gap-2">
          <PrimaryButton
            class="btn btn-primary"
            :disabled="!selectedPostAction"
            :label="'Continue'"
            @click="
              () => {
                if (selectedPostAction === 'hide') {
                  activeStep = stepNames.RequestChangeMessage.id;
                } else if (selectedPostAction === 'remove') {
                  activeStep = stepNames.SuspensionNeeded.id;
                } else {
                  activeStep = stepNames.CloseIssue.id;
                }
              }
            "
          />
        </div>
      </ModerationStep>

      <ModerationStep
        v-if="activeStep === stepNames.RequestChangeMessage.id"
        :title="stepNames.RequestChangeMessage.title"
        @click-back="activeStep = stepNames.SelectAction.id"
      >
        <textarea
          class="w-full rounded-lg border border-gray-300 p-2 text-black"
          :rows="10"
          :value="requestChangeMessage"
          @input="requestChangeMessage = $event?.target?.value || ''"
        />

        <div class="flex justify-center gap-2">
          <PrimaryButton
            class="btn btn-primary"
            :label="'Send Message'"
            @click="activeStep = stepNames.FinishedWizard.id"
          />
        </div>
      </ModerationStep>

      <ModerationStep
        v-if="activeStep === stepNames.SuspensionNeeded.id"
        :title="stepNames.SuspensionNeeded.title"
        @click-back="activeStep = stepNames.SelectAction.id"
      >
        <div class="flex justify-center gap-2">
          <GenericButton
            class="btn btn-primary"
            :text="'Yes'"
            @click="activeStep = stepNames.SuspensionLength.id"
          />
          <GenericButton
            class="btn btn-primary"
            :text="'No'"
            @click="activeStep = stepNames.CloseIssue.id"
          />
        </div>
      </ModerationStep>

      <ModerationStep
        v-if="activeStep === stepNames.SuspensionLength.id"
        :title="stepNames.SuspensionLength.title"
        @click-back="activeStep = stepNames.SuspensionNeeded.id"
      >
        <fieldset class="mt-4">
          <legend class="sr-only">
            Suspension Lengths
          </legend>
          <div class="space-y-4">
            <div
              v-for="length in suspensionLengths"
              :key="length.id"
              class="flex items-center"
            >
              <input
                :id="length.id"
                name="suspension-length"
                type="radio"
                :checked="length.title === selectedSuspensionLength"
                class="text-indigo-600 focus:ring-indigo-600 h-4 w-4 border-gray-300"
                @change="selectedSuspensionLength = length.title"
              >
              <label
                :for="length.id"
                class="font-medium ml-3 block text-sm leading-6 text-gray-900 dark:text-gray-100"
              >
                {{ length.title }}</label>
            </div>
          </div>
        </fieldset>
        <div class="flex justify-center gap-2">
          <PrimaryButton
            class="btn btn-primary"
            :disabled="!selectedSuspensionLength"
            :label="'Continue'"
            @click="activeStep = stepNames.SuspensionMessage.id"
          />
        </div>
      </ModerationStep>

      <ModerationStep
        v-if="activeStep === stepNames.SuspensionMessage.id"
        :title="stepNames.SuspensionMessage.title"
        @click-back="activeStep = stepNames.SuspensionLength.id"
      >
        <textarea
          class="w-full rounded-lg border border-gray-300 p-2 text-black"
          :rows="10"
          :value="suspensionMessage"
          @input="suspensionMessage = $event?.target?.value || ''"
        />
        <div class="flex justify-center gap-2">
          <PrimaryButton
            class="btn btn-primary"
            :label="'Send Message'"
            @click="activeStep = stepNames.FinishedWizard.id"
          />
        </div>
      </ModerationStep>

      <ModerationStep
        v-if="activeStep === stepNames.CloseIssue.id"
        :title="stepNames.CloseIssue.title"
        @click-back="activeStep = stepNames.SelectAction.id"
      >
        <div class="flex justify-center gap-2">
          <GenericButton
            class="btn btn-primary"
            :text="'No'"
            @click="activeStep = stepNames.CloseIssueComment.id"
          />
          <PrimaryButton
            class="btn btn-primary"
            :label="'Yes'"
            @click="
              () => {
                $emit('close-issue', issue.id);
                activeStep = stepNames.CloseIssueComment.id;
              }
            "
          />
        </div>
      </ModerationStep>

      <ModerationStep
        v-if="activeStep === stepNames.CloseIssueComment.id"
        :title="stepNames.CloseIssueComment.title"
        @click-back="activeStep = stepNames.CloseIssue.id"
      >
        <textarea
          class="w-full rounded-lg border border-gray-300 p-2 text-black"
          :value="explanationComment"
          @input="explanationComment = $event?.target?.value || ''"
        />
        <div class="flex justify-center gap-2">
          <GenericButton
            class="btn"
            :text="'Skip'"
            @click="activeStep = stepNames.FinishedWizard.id"
          />
          <PrimaryButton
            class="btn btn-primary"
            :label="'Submit'"
            :disabled="!explanationComment"
            @click="activeStep = stepNames.FinishedWizard.id"
          />
        </div>
      </ModerationStep>

      <ModerationStep
        v-if="activeStep === stepNames.FinishedWizard.id"
        :title="stepNames.FinishedWizard.title"
        :enable-back="false"
      />
    </div> 
  </div>
</template>
