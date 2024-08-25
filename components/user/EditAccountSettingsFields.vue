<script lang="ts">
import { computed, defineComponent, nextTick, PropType, ref } from "vue";
import { ApolloError } from "@apollo/client/errors";
import Form from "@/components/forms/Form.vue";
import TextInput from "@/components/forms/TextInput.vue";
import FormRow from "@/components/forms/FormRow.vue";
import TextEditor from "@/components/forms/TextEditor.vue";
import { EditAccountSettingsFormValues } from "@/types/User";
import { useRoute } from "vue-router";
import AddImage from "../buttons/AddImage.vue";
import { getUploadFileName, uploadAndGetEmbeddedLink } from "../utils";
import { CREATE_SIGNED_STORAGE_URL } from "@/graphQLData/discussion/mutations";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";

export default defineComponent({
  name: "EditAccountSettingsFields",
  components: {
    AddImage,
    TextInput,
    FormRow,
    TailwindForm: Form,
    TextEditor,
  },
  props: {
    formValues: {
      type: Object as PropType<EditAccountSettingsFormValues | null>,
      required: true,
    },
    getUserError: {
      type: Object as PropType<ApolloError | null>,
      default: () => {
        return null;
      },
    },
    updateUserError: {
      type: Object as PropType<ApolloError | null>,
      default: () => {
        return null;
      },
    },
    userLoading: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const route = useRoute();
    const usernameInParams = computed(() => {
      if (typeof route.params.username === "string") {
        return route.params.username;
      }
      return "";
    });
    const { mutate: createSignedStorageUrl } = useMutation(
      CREATE_SIGNED_STORAGE_URL,
    );
    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      let username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    return {
      createSignedStorageUrl,
      getUploadFileName,
      uploadAndGetEmbeddedLink,
      titleInputRef: ref(null),
      touched: false,
      username,
      usernameInParams,
    };
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

        // Call the uploadFile mutation with the selected file
        const signedUrlResult = await this.createSignedStorageUrl({
          filename,
          contentType: file.type,
        });

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
    async handleProfilePicChange(event: any) {
      const selectedFile = event.target.files[0];

      if (selectedFile) {
        const embeddedLink = await this.upload(selectedFile);

        if (!embeddedLink) {
          return;
        }
        this.$emit("updateFormValues", { profilePicURL: embeddedLink });
        this.$emit("submit");
      }
    },
  },
});
</script>
<template>
  <v-container
    fluid
    class="max-w-4xl p-0"
  >
    <div v-if="userLoading">
      Loading...
    </div>
    <div v-else-if="getUserError">
      <div
        v-for="(error, i) of getUserError?.graphQLErrors"
        :key="i"
      >
        {{ error.message }}
      </div>
    </div>
    <TailwindForm
      v-else-if="formValues"
      :form-title="'Edit Account Settings'"
      :needs-changes="false"
      :show-cancel-button="false"
      @input="touched = true"
      @submit="$emit('submit')"
    >
      <div class="space-y-8 divide-y divide-gray-200">
        <div class="space-y-4">
          <FormRow section-title="Username">
            <template #content>
              <TextInput
                ref="titleInputRef"
                :test-id="'username-input'"
                :disabled="true"
                :value="usernameInParams"
                :placeholder="'Add unique name'"
                :full-width="true"
              />
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
                :placeholder="'Add a more human readable display name'"
                :full-width="true"
                @update="$emit('updateFormValues', { displayName: $event })"
              />
            </template>
          </FormRow>
          <FormRow section-title="Bio">
            <template #content>
              <TextEditor
                id="editExistingComment"
                class="mb-2 mt-3 p-1"
                :initial-value="formValues.bio || ''"
                :editor-id="'bio-input'"
                :rows="6"
                :allow-image-upload="false"
                @update="$emit('updateFormValues', { bio: $event })"
              />
            </template>
          </FormRow>
          <FormRow section-title="Profile Picture">
            <template #content>
              <Avatar
                class="shadow-sm"
                :src="formValues.profilePicURL"
                :text="username"
                :is-square="false"
                :is-large="true"
              />
              <AddImage @change="handleProfilePicChange" />
            </template>
          </FormRow>
        </div>
      </div>
    </TailwindForm>
    <div
      v-for="(error, i) of getUserError?.graphQLErrors"
      :key="i"
    >
      {{ error.message }}
    </div>
  </v-container>
</template>
