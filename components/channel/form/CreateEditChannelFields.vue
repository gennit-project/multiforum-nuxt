<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import type { PropType } from "vue";
import type { ApolloError } from "@apollo/client/errors";
import TagPicker from "@/components/TagPicker.vue";
import TextInput from "@/components/TextInput.vue";
import FormRow from "@/components/FormRow.vue";
import TextEditor from "@/components/TextEditor.vue";
import AddImage from "@/components/AddImage.vue";
import { getUploadFileName, uploadAndGetEmbeddedLink } from "@/utils";
import { useMutation } from "@vue/apollo-composable";
import { CREATE_SIGNED_STORAGE_URL } from "@/graphQLData/discussion/mutations";
import ErrorBanner from "@/components/ErrorBanner.vue";
import type { CreateEditChannelFormValues } from "@/types/Channel";
import TailwindForm from "@/components/FormComponent.vue";
import { usernameVar } from "@/cache";
import {
  MAX_CHARS_IN_CHANNEL_DESCRIPTION,
  MAX_CHARS_IN_CHANNEL_NAME,
  MAX_CHARS_IN_CHANNEL_DISPLAY_NAME,
} from "@/utils/constants";
import ForumOwnerList from "@/components/channel/form/ForumOwnerList.vue";
import ModList from "@/components/channel/form/ModList.vue";

type FileChangeInput = {
  // event of HTMLInputElement;
  event: Event;
  fieldName: string;
};

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
// Mutation to create a signed storage URL
const { mutate: createSignedStorageUrl } = useMutation(
  CREATE_SIGNED_STORAGE_URL
);

// Validation function for the title
const isValidTitle = (title: string) => /^[a-zA-Z0-9_]+$/.test(title);

const titleIsInvalid = computed(
  () => !isValidTitle(props.formValues?.uniqueName || "")
);

const titleInputRef = ref(null);

const touched = ref(false);

nextTick(() => {
  if (titleInputRef.value) {
    // @ts-ignore - titleInputRef is not null
    titleInputRef.value?.focus();
  }
});

// File upload handler
const upload = async (file: File) => {
  if (!usernameVar.value) {
    console.error("No username found");
    return;
  }

  try {
    const filename = getUploadFileName({
      username: usernameVar.value,
      file,
    });

    const getSignedStorageURLInput = {
      filename,
      contentType: file.type,
    };

    const signedUrlResult = await createSignedStorageUrl(
      getSignedStorageURLInput
    );
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
const handleImageChange = async (input: FileChangeInput) => {
  const { event, fieldName } = input;
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

const CHANNEL_ALREADY_EXISTS_ERROR = "Constraint validation failed";

const activeTab = ref("basic");

const tabs = [
  {
    key: "basic",
    label: "Basic Settings",
  },
  {
    key: "rules",
    label: "Rules",
  },
  {
    key: "mods",
    label: "Moderators",
  },
  {
    key: "owners",
    label: "Forum Owners",
  }
];

const setActiveTab = (tab: string) => {
  activeTab.value = tab;
};
</script>

<template>
  <div class="mt-4 w-full pt-0 px-0">
    <div v-if="channelLoading">Loading...</div>

    <div>
      <div v-if="updateChannelError" class="mt-6">
        <ErrorBanner :text="updateChannelError.message" />
      </div>
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
          :text="`${error.message.split(CHANNEL_ALREADY_EXISTS_ERROR).join('Channel name is already taken')}`"
        />
      </div>

      <TailwindForm
        v-if="formValues"
        :form-title="editMode ? 'Forum Settings' : 'Create a Forum'"
        :description="'Forums are where you can start discussions and share content with others.'"
        :needs-changes="titleIsInvalid"
        :loading="createChannelLoading || editChannelLoading"
        @input="touched = true"
        @submit="emit('submit')"
      >
        <div>
          <div class="mt-5 flex w-full">
            <div
              class="w-1/4 border-r border-gray-200 dark:border-gray-500 mr-4 bg-gray-50"
            >
              <ul class="flex flex-col space-y-2">
                <li
                  v-for="tab in tabs"
                  :key="tab.key"
                  :class="{
                    'text-blue-600 dark:text-blue-500 font-bold border-r-2 border-blue-500':
                      activeTab === tab.key,
                    'text-gray-600 dark:text-gray-300 hover:text-blue-600':
                      activeTab !== tab.key,
                  }"
                  class="py-2 cursor-pointer"
                  @click="setActiveTab(tab.key)"
                >
                  {{ tab.label }}
                </li>
              </ul>
            </div>

            <div
              v-if="activeTab === 'basic'"
              class="space-y-4 sm:space-y-5 flex-1"
            >
              <FormRow section-title="Forum Unique Name" :required="!editMode">
                <template #content>
                  <TextInput
                    ref="titleInputRef"
                    :test-id="'title-input'"
                    :disabled="editMode"
                    :value="formValues.uniqueName"
                    :placeholder="'Add unique name with no spaces. Ex. forum_name'"
                    :full-width="true"
                    @update="$emit('updateFormValues', { uniqueName: $event })"
                  />
                  <CharCounter
                    :current="formValues.uniqueName?.length || 0"
                    :max="MAX_CHARS_IN_CHANNEL_NAME"
                  />
                  <p
                    v-if="titleIsInvalid && touched"
                    class="text-red-500 text-sm mt-2"
                  >
                    Title can only contain letters, numbers, and underscores.
                  </p>
                </template>
              </FormRow>

              <FormRow section-title="Forum Display Name">
                <template #content>
                  <TextInput
                    ref="displayNameInputRef"
                    :test-id="'display-name-input'"
                    :value="formValues.displayName"
                    :placeholder="'A more human readable display name'"
                    :full-width="true"
                    @update="$emit('updateFormValues', { displayName: $event })"
                  />
                  <CharCounter
                    :current="formValues.displayName?.length || 0"
                    :max="MAX_CHARS_IN_CHANNEL_DISPLAY_NAME"
                  />
                </template>
              </FormRow>

              <FormRow section-title="Tags">
                <template #content>
                  <TagPicker
                    data-testid="tag-input"
                    :selected-tags="formValues.selectedTags"
                    @set-selected-tags="
                      $emit('updateFormValues', { selectedTags: $event })
                    "
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
                  <CharCounter
                    :current="formValues.description?.length || 0"
                    :max="MAX_CHARS_IN_CHANNEL_DESCRIPTION"
                  />
                </template>
              </FormRow>

              <!-- Forum Icon Upload -->
              <FormRow section-title="Forum Icon">
                <template #content>
                  <AvatarComponent
                    class="shadow-sm"
                    :src="formValues.channelIconURL"
                    :text="formValues.uniqueName"
                    :is-square="true"
                    :is-medium="true"
                  />
                  <AddImage
                    key="channel-icon-url"
                    :field-name="'channelIconURL'"
                    @file-change="
                      (input: FileChangeInput) => {
                        handleImageChange(input);
                      }
                    "
                  />
                </template>
              </FormRow>
              <FormRow section-title="Forum Banner">
                <template #content>
                  <img
                    v-if="formValues.channelBannerURL"
                    class="w-full shadow-sm"
                    :src="formValues.channelBannerURL"
                    :alt="formValues.uniqueName"
                  />
                  <AddImage
                    key="channel-banner-url"
                    :field-name="'channelBannerURL'"
                    @file-change="
                      (input: FileChangeInput) => {
                        handleImageChange(input);
                      }
                    "
                  />
                </template>
              </FormRow>
            </div>
            <FormRow v-if="activeTab === 'rules'" section-title="Forum Rules">
              <template #content>
                <RulesEditor
                  :form-values="formValues"
                  @update-form-values="$emit('updateFormValues', $event)"
                />
              </template>
            </FormRow>
            <FormRow v-if="activeTab === 'mods'" section-title="Moderators">
              <template #content>
                <ModList />
              </template>
            </FormRow>
            <FormRow v-if="activeTab === 'owners'" section-title="Forum Owners">
              <template #content>
                <ForumOwnerList />
              </template>
            </FormRow>
          </div>
        </div>
      </TailwindForm>
      <div v-for="(error, i) in getChannelError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
  </div>
</template>
