<script setup lang="ts">
import type { PropType } from "vue";
import type { ApolloError } from "@apollo/client/errors";
import type { ServerConfigUpdateInput } from "@/__generated__/graphql";
import FormRow from "@/components/FormRow.vue";
import TextEditor from "@/components/TextEditor.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import TailwindForm from "@/components/FormComponent.vue";


const props = defineProps({
  editMode: {
    type: Boolean,
    required: true,
  },
  createServerError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  createServerLoading: {
    type: Boolean,
    default: false,
  },
  editServerLoading: {
    type: Boolean,
    default: false,
  },
  formValues: {
    type: Object as PropType<ServerConfigUpdateInput | null>,
    required: false,
    default: null,
  },
  getServerError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  updateServerError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  serverLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit", "updateFormValues"]);

</script>

<template>
  <div class="mt-4 w-full pt-0 px-0">
    <div v-if="serverLoading">Loading...</div>

    <TailwindForm
      v-else-if="formValues"
      :form-title="editMode ? 'Server Settings' : 'Create a Server'"
      :needs-changes="false"
      :loading="createServerLoading || editServerLoading"
      @submit="emit('submit')"
    >
      <div>
        <ErrorBanner
          v-if="updateServerError"
          :text="updateServerError.message"
        />
        <div v-if="getServerError">
          <ErrorBanner
            v-for="(error, i) in getServerError?.graphQLErrors"
            :key="i"
            :text="error.message"
          />
        </div>
        <div v-if="createServerError">
          <ErrorBanner
            v-for="(error, i) in createServerError?.graphQLErrors"
            :key="i"
            :text="`${error.message}`"
          />
        </div>

        <div class="mt-5 space-y-4 sm:space-y-5">
          <FormRow section-title="Description">
            <template #content>
              <TextEditor
                class="my-3"
                :test-id="'description-input'"
                :initial-value="formValues.serverDescription || ''"
                :placeholder="'Add description'"
                :disable-auto-focus="false"
                :allow-image-upload="false"
                @update="$emit('updateFormValues', { serverDescription: $event })"
              />
            </template>
          </FormRow>
          <FormRow section-title="Forum Rules">
            <template #content>
              <RulesEditor 
                :form-values="formValues"
                @update-form-values="$emit('updateFormValues', $event)"
              />
            </template>
          </FormRow>
        </div>
      </div>
    </TailwindForm>

    <div v-for="(error, i) in getServerError?.graphQLErrors" :key="i">
      {{ error.message }}
    </div>
  </div>
</template>
