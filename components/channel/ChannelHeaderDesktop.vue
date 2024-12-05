<script>
import { defineComponent } from "vue";
import ExpandableImage from "../ExpandableImage.vue";
import CreateAnythingButton from "../nav/CreateAnythingButton.vue";

export default defineComponent({
  name: "ChannelHeaderMobile",
  components: {
    ExpandableImage,
    CreateAnythingButton,
  },
  props: {
    adminList: {
      type: Array,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    channel: {
      type: Object,
      required: true,
    },
    route: {
      type: Object,
      required: true,
    },
    showCreateButton: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    return {};
  },
});
</script>
<template>
  <div class="hidden md:block w-full">
    <img
      v-if="channel?.channelBannerURL"
      :src="channel?.channelBannerURL"
      :alt="'channel banner'"
      class="max-h-36 object-cover w-full"
    >
    <div class="bg-white dark:bg-gray-800 flex justify-center">
      <div class="max-w-screen-2xl w-full">
        <div
          class="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 pr-6"
        >
          <div class="flex items-center w-full gap-4 mb-2">
            <ExpandableImage
              v-if="channel?.channelIconURL"
              class="ml-6 h-10 w-10 shadow-sm dark:border-gray-800"
              :rounded="true"
              :full-width="true"
              :alt="channelId"
              :src="channel?.channelIconURL ?? ''"
            />
            <AvatarComponent
              v-if="!channel?.channelIconURL"
              class="ml-6 h-10 w-10 shadow-sm dark:border-gray-800 mt-2"
              :text="channelId"
              :src="channel?.channelIconURL ?? ''"
              :full-width="true"
              :is-square="false"
            />
            <div v-if="channelId" class="flex items-center">
              <div class="mt-3 mb-1">
                <span
                  class="flex space-y-2 rounded-full border-gray-700 text-2xl leading-6 text-black dark:bg-gray-900 dark:text-gray-200"
                >
                  {{ channel?.displayName ? channel.displayName : channelId }}
                </span>
                <span
                  v-if="channel?.uniqueName && channel?.displayName"
                  class="rounded-full bg-white text-sm font-mono text-gray-500 dark:bg-gray-900 dark:text-gray-300"
                >
                  {{ `${channel.uniqueName}` }}
                </span>
              </div>
            </div>
          </div>
          <CreateAnythingButton
            v-if="showCreateButton"
            :use-primary-button="true"
          />
        </div>
        <slot />
      </div>
    </div>
  </div>
</template>
