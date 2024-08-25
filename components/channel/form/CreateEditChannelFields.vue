<script lang="ts">
import { computed, defineComponent, nextTick, PropType, ref } from "vue";
import { ApolloError } from "@apollo/client/errors";
import Form from "@/components/forms/Form.vue";
import TagPicker from '@/components/forms/TagPicker.vue'
import TextInput from "@/components/forms/TextInput.vue";
import FormRow from "@/components/forms/FormRow.vue";
import TextEditor from "@/components/forms/TextEditor.vue";
import { CreateEditChannelFormValues } from "@/types/Channel";
import AddImage from "@/components/buttons/AddImage.vue";
import {
  getUploadFileName,
  uploadAndGetEmbeddedLink,
} from "@/components/utils";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { CREATE_SIGNED_STORAGE_URL } from "@/graphQLData/discussion/mutations";
import ErrorBanner from "@/components/ErrorBanner.vue";
import XmarkIcon from "@/components/icons/XmarkIcon.vue";

export default defineComponent({
  name: "CreateEditChannelFields",
  components: {
    AddImage,
    ErrorBanner,
    FormRow,
    TextInput,
    TailwindForm: Form,
    TextEditor,
    TagPicker,
    XmarkIcon,
  },
  props: {
    editMode: {
      type: Boolean,
      required: true,
    },
    createChannelError: {
      type: Object as PropType<ApolloError | null>,
      default: () => {
        return null;
      },
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
      default: () => {
        return null;
      },
    },
    getChannelError: {
      type: Object as PropType<ApolloError | null>,
      default: () => {
        return null;
      },
    },
    updateChannelError: {
      type: Object as PropType<ApolloError | null>,
      default: () => {
        return null;
      },
    },
    channelLoading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      let username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });
    const { mutate: createSignedStorageUrl } = useMutation(
      CREATE_SIGNED_STORAGE_URL,
    );

    const isValidTitle = (title: string) => {
      const validTitlePattern = /^[a-zA-Z0-9_]+$/;
      return validTitlePattern.test(title);
    };

    const titleIsInvalid = computed(() => {
      return !isValidTitle(props.formValues?.uniqueName || '');
    });

    return {
      createSignedStorageUrl,
      touched: false,
      titleInputRef: ref(null),
      username,
      getUploadFileName,
      uploadAndGetEmbeddedLink,
      titleIsInvalid,
    };
  },
  computed: {
    needsChanges() {
      const needsChanges = this.titleIsInvalid;
      return needsChanges;
    },
  },
  created() {
    nextTick(() => {
      if (this.titleInputRef) {
        this.titleInputRef?.$el?.children[0].childNodes[0].focus();
      }
    });
  },
  methods: {
    async upload(file: any) {
      if (!this.username) {
        console.error("No username found");
        return;
      }
      try {
        const filename = this.getUploadFileName({
          username: this.username,
          file,
        });

        const getSignedStorageURLInput= {
          filename,
          contentType: file.type,
        }

        const signedUrlResult = await this.createSignedStorageUrl(getSignedStorageURLInput);

        const signedStorageURL =
          signedUrlResult.data?.createSignedStorageURL?.url;

        const embeddedLink = this.uploadAndGetEmbeddedLink({
          file,
          filename,
          signedStorageURL,
        });

        return embeddedLink;
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    },
    async handleImageChange(event: any, fieldName: string) {
      const selectedFile = event.target.files[0];

      if (selectedFile) {
        const embeddedLink = await this.upload(selectedFile);
        if (!embeddedLink) {
          return;
        }
        this.$emit("updateFormValues", { [fieldName]: embeddedLink });

        if (this.editMode) {
          this.$emit("submit");
        }
      }
    },
    updateRule(index: number, field: string, value: string) {
      const updatedRules = [...this.formValues.rules];
      updatedRules[index][field] = value;
      this.$emit("updateFormValues", { rules: updatedRules });
    },
    addNewRule(event: any) {
      event.preventDefault();
      const newRule = { summary: "", detail: "" };
      const updatedRules = [...this.formValues.rules, newRule];
      this.$emit("updateFormValues", { rules: updatedRules });
    },
    deleteRule(index: number) {
      const updatedRules = [...this.formValues.rules];
      updatedRules.splice(index, 1);
      this.$emit("updateFormValues", { rules: updatedRules });
    },
  },
});
</script>
<template>
  <v-container
    fluid
    class="mt-4 max-w-3xl pt-0 px-0"
  >
    <div v-if="channelLoading">
      Loading...
    </div>

    <TailwindForm
      v-else-if="formValues"
      :form-title="editMode ? 'Forum Settings' : 'Create Forum'"
      :needs-changes="needsChanges"
      :loading="createChannelLoading || editChannelLoading"
      @input="touched = true"
      @submit="$emit('submit')"
    >
      <div>
        <div v-if="getChannelError">
          <ErrorBanner
            v-for="(error, i) of getChannelError?.graphQLErrors"
            :key="i"
            :text="error.message"
          />
        </div>

        <div v-if="createChannelError">
          <ErrorBanner
            v-for="(error, i) of createChannelError?.graphQLErrors"
            :key="i"
            :text="error.message"
          />
        </div>
        <div class="mt-5 space-y-4 sm:space-y-5">
          <FormRow
            section-title="Title"
            :required="!editMode"
          >
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
              <p
                v-if="titleIsInvalid && touched"
                class="text-red-500 text-sm mt-2"
              >
                Title can only contain letters, numbers, and underscores.
              </p>
            </template>
          </FormRow>
          <FormRow
            section-title="Display Name"
            :required="false"
          >
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
                @setSelectedTags="
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
            </template>
          </FormRow>
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
          <FormRow section-title="Forum Rules">
            <template #content>
              <div class="divide-y divide-gray-500 ">
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
    <div
      v-for="(error, i) of getChannelError?.graphQLErrors"
      :key="i"
    >
      {{ error.message }}
    </div>
  </v-container>
</template>
