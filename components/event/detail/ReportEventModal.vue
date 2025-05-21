<script lang="ts">
  import { defineComponent } from "vue";
  import GenericModal from "@/components/GenericModal.vue";
  import FlagIcon from "@/components/icons/FlagIcon.vue";
  import TextEditor from "@/components/TextEditor.vue";

  export default defineComponent({
    name: "ReportEventModal",
    components: {
      GenericModal,
      FlagIcon,
      TextEditor,
    },
    props: {
      body: {
        type: String,
        require: true,
        default: "",
      },
      open: {
        type: Boolean,
        default: false,
      },
    },
    setup() {},
    methods: {
      updateFeedback() {},
    },
  });
</script>
<template>
  <GenericModal
    :body="'Why should this event be removed? Please be specific about any rule violations.'"
    :highlight-color="'red'"
    :open="open"
    :primary-button-text="'Submit'"
    :secondary-button-text="'Cancel'"
    :title="'Report Event'"
  >
    <template #icon>
      <FlagIcon
        aria-hidden="true"
        class="h-6 w-6 text-red-600 opacity-100"
      />
    </template>
    <template #content>
      <TextEditor
        :allow-image-upload="false"
        :disable-auto-focus="false"
        :initial-value="''"
        :placeholder="'Explain why this event should be removed'"
        :test-id="'event-report-input'"
        @update="updateFeedback"
      />
    </template>
  </GenericModal>
</template>
