<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import type { ApolloError } from "@apollo/client/errors";
import TagPicker from "@/components/TagPicker.vue";
import TextInput from "@/components/TextInput.vue";
import FormRow from "@/components/FormRow.vue";
import TextEditor from "@/components/TextEditor.vue";
import AddImage from "@/components/AddImage.vue";
import { getUploadFileName, uploadAndGetEmbeddedLink } from "@/utils";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { CREATE_SIGNED_STORAGE_URL } from "@/graphQLData/discussion/mutations";
import ErrorBanner from "@/components/ErrorBanner.vue";
import XmarkIcon from "@/components/icons/XmarkIcon.vue";
import type { CreateEditChannelFormValues } from "@/types/Channel";

const props = defineProps({
  editMode: {
    type: Boolean,
    required: true,
  },
  createChannelError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  createChannelLoading: {
    type: Boolean,
    default: false,
  },
  editChannelLoading: {
    type: Boolean,
    default: false,
  },
  formValues: {
    type: Object as PropType<CreateEditChannelFormValues | null>,
    required: false,
    default: null,
  },
  getChannelError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  updateChannelError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  channelLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit", "updateFormValues"]);

// Query for the local username
const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

const username = computed(() => {
  return localUsernameResult.value?.username || "";
});

// Mutation to create a signed storage URL
const { mutate: createSignedStorageUrl } = useMutation(CREATE_SIGNED_STORAGE_URL);

// Validation function for the title
const isValidTitle = (title: string) => /^[a-zA-Z0-9_]+$/.test(title);

const titleIsInvalid = computed(() => !isValidTitle(props.formValues?.uniqueName || ""));

const titleInputRef = ref(null);

const touched = ref(false);

nextTick(() => {
  if (titleInputRef.value) {
    titleInputRef.value?.$el?.children[0].childNodes[0].focus();
  }
});

// File upload handler
const upload = async (file: File) => {
  if (!username.value) {
    console.error("No username found");
    return;
  }

  try {
    const filename = getUploadFileName({
      username: username.value,
      file,
    });

    const getSignedStorageURLInput = {
      filename,
      contentType: file.type,
    };

    const signedUrlResult = await createSignedStorageUrl(getSignedStorageURLInput);
    const signedStorageURL = signedUrlResult?.data?.createSignedStorageURL?.url;

    const embeddedLink = uploadAndGetEmbeddedLink({
      file,
      filename,
      signedStorageURL,
      fileType: file.type,
    });

    return embeddedLink;
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};

// Handler for image changes
const handleImageChange = async (event: Event, fieldName: string) => {
  const selectedFile = (event.target as HTMLInputElement).files?.[0];

  if (selectedFile) {
    const embeddedLink = await upload(selectedFile);
    if (!embeddedLink) return;

    emit("updateFormValues", { [fieldName]: embeddedLink });

    if (props.editMode) {
      emit("submit");
    }
  }
};

// Methods for handling rules
const updateRule = (index: number, field: string, value: string) => {
  const updatedRules = [...(props.formValues?.rules || [])];
  updatedRules[index][field] = value;
  emit("updateFormValues", { rules: updatedRules });
};

const addNewRule = (event: Event) => {
  event.preventDefault();
  const newRule = { summary: "", detail: "" };
  const updatedRules = [...(props.formValues?.rules || []), newRule];
  emit("updateFormValues", { rules: updatedRules });
};

const deleteRule = (index: number) => {
  const updatedRules = [...(props.formValues?.rules || [])];
  updatedRules.splice(index, 1);
  emit("updateFormValues", { rules: updatedRules });
};

</script>

<template>
  <v-container fluid class="mt-4 max-w-3xl pt-0 px-0">
    <div v-if="channelLoading">Loading...</div>

    <TailwindForm
      v-else-if="formValues"
      :form-title="editMode ? 'Forum Settings' : 'Create Forum'"
      :needs-changes="titleIsInvalid"
      :loading="createChannelLoading || editChannelLoading"
      @input="touched = true"
      @submit="emit('submit')"
    >
      <div>
        <!-- Error Banners -->
        <div v-if="getChannelError">
          <ErrorBanner
            v-for="(error, i) in getChannelError?.graphQLErrors"
            :key="i"
            :text="error.message"
          />
        </div>
        <div v-if="createChannelError">
          <ErrorBanner
            v-for="(error, i) in createChannelError?.graphQLErrors"
            :key="i"
            :text="error.message"
          />
        </div>

        <!-- Form Fields -->
        <div class="mt-5 space-y-4 sm:space-y-5">
          <FormRow section-title="Title" :required="!editMode">
            <template #content>
              <TextInput
                ref="titleInputRef"
                :test-id="'title-input'"
                :disabled="editMode"
                :value="formValues.uniqueName"
                :placeholder="'Add unique name'"
                :full-width="true"
                @update="$emit('updateFormValues', { uniqueName: $event })"
              />
              <p v-if="titleIsInvalid && touched" class="text-red-500 text-sm mt-2">
                Title can only contain letters, numbers, and underscores.
              </p>
            </template>
          </FormRow>

          <FormRow section-title="Display Name">
            <template #content>
              <TextInput
                ref="displayNameInputRef"
                :test-id="'display-name-input'"
                :value="formValues.displayName"
                :placeholder="'A more human readable display name'"
                :full-width="true"
                @update="$emit('updateFormValues', { displayName: $event })"
              />
            </template>
          </FormRow>

          <FormRow section-title="Tags">
            <template #content>
              <TagPicker
                data-testid="tag-input"
                :selected-tags="formValues.selectedTags"
                @set-selected-tags="$emit('updateFormValues', { selectedTags: $event })"
              />
            </template>
          </FormRow>

          <FormRow section-title="Description">
            <template #content>
              <TextEditor
                class="my-3"
                :test-id="'description-input'"
                :initial-value="formValues.description || ''"
                :placeholder="'Add description'"
                :disable-auto-focus="true"
                :allow-image-upload="false"
                @update="$emit('updateFormValues', { description: $event })"
              />
            </template>
          </FormRow>

          <!-- Forum Icon Upload -->
          <FormRow section-title="Forum Icon">
            <template #content>
              <Avatar
                class="shadow-sm"
                :src="formValues.channelIconURL"
                :text="formValues.uniqueName"
                :is-square="true"
                :is-medium="true"
              />
              <AddImage
                key="channel-icon-url"
                :field-name="'channelIconURL'"
                @change="handleImageChange"
              />
            </template>
          </FormRow>

          <!-- Forum Banner Upload -->
          <FormRow section-title="Forum Banner">
            <template #content>
              <img
                v-if="formValues.channelBannerURL"
                class="w-full shadow-sm"
                :src="formValues.channelBannerURL"
                :alt="formValues.uniqueName"
              >
              <AddImage
                key="channel-banner-url"
                :field-name="'channelBannerURL'"
                @change="handleImageChange"
              />
            </template>
          </FormRow>

          <!-- Forum Rules -->
          <FormRow section-title="Forum Rules">
            <template #content>
              <div class="divide-y divide-gray-500">
                <div
                  v-for="(rule, index) in formValues.rules"
                  :key="index"
                  class="mb-4 flex flex-col gap-2"
                >
                  <div class="flex justify-between">
                    <span class="font-bold mt-3">Rule {{ index + 1 }}</span>
                    <button
                      class="mt-2 rounded border border-blue-500 px-2 py-1 text-blue-500 flex items-center gap-1"
                      @click="deleteRule(index)"
                    >
                      <XmarkIcon class="h-4" />
                      Delete Rule
                    </button>
                  </div>
                  <TextInput
                    :test-id="'rule-short-name-input-' + index"
                    :value="rule.summary"
                    :placeholder="'Rule short name'"
                    :full-width="true"
                    @update="updateRule(index, 'summary', $event)"
                  />
                  <TextEditor
                    :test-id="'rule-detail-input-' + index"
                    :initial-value="rule.detail || ''"
                    :placeholder="'Rule details'"
                    :rows="4"
                    :disable-auto-focus="true"
                    :allow-image-upload="false"
                    @update="updateRule(index, 'detail', $event)"
                  />
                </div>
              </div>
              <button
                class="mt-2 rounded border border-blue-500 px-2 py-1 text-blue-500"
                @click="addNewRule"
              >
                + Add New Rule
              </button>
            </template>
          </FormRow>
        </div>
      </div>
    </TailwindForm>

    <div v-for="(error, i) in getChannelError?.graphQLErrors" :key="i">
      {{ error.message }}
    </div>
  </v-container>
</template>
