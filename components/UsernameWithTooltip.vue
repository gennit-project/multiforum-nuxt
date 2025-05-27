<<<<<<< HEAD
<script setup lang="ts">
  import { timeAgo } from "@/utils";
  import FloatingTooltip from "@/components/FloatingTooltip.vue";
  import AvatarComponent from "@/components/AvatarComponent.vue";

  interface Props {
    username: string;
    displayName?: string;
    src?: string;
    accountCreated?: string;
    commentKarma?: number;
    discussionKarma?: number;
    isAdmin?: boolean;
    isMod?: boolean;
    isOriginalPoster?: boolean;
  }

  withDefaults(defineProps<Props>(), {
    displayName: "",
    src: "",
    accountCreated: "",
    commentKarma: 0,
    discussionKarma: 0,
    isAdmin: false,
    isMod: false,
    isOriginalPoster: false,
  });
</script>
<template>
  <FloatingTooltip 
    placement="bottom"
    content-class="w-64 p-3"
  >
    <button>
      <slot>
=======
<script lang="ts">
import { defineComponent } from "vue";
import { timeAgo } from "@/utils";

export default defineComponent({
  name: "UsernameWithTooltip",
  props: {
    username: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: false,
      default: "",
    },
    src: {
      type: String,
      required: false,
      default: "",
    },
    accountCreated: {
      type: String,
      required: false,
      default: "",
    },
    commentKarma: {
      type: Number,
      required: false,
      default: 0,
    },
    discussionKarma: {
      type: Number,
      required: false,
      default: 0,
    },
    isAdmin: {
      type: Boolean,
      required: false,
      default: false,
    },
    isMod: {
      type: Boolean,
      required: false,
      default: false,
    },
    isOriginalPoster: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup() {
    return {
      timeAgo,
    };
  },
});
</script>
<template>
  <client-only>
    <v-tooltip
      location="bottom"
      content-class="custom-tooltip"
    >
      <template #activator="{ props }">
        <button v-bind="props">
          <slot>
            <div class="flex flex-row items-center gap-1">
              <nuxt-link
                :to="{
                  name: 'u-username',
                  params: { username },
                }"
                class="flex flex-row items-center gap-1 hover:underline"
              >
                <span
                  v-if="!displayName"
                  class="font-bold"
                >{{ username }}</span>
                <span
                  v-if="displayName"
                  class="font-bold"
                >{{
                  displayName
                }}</span>
                <span
                  v-if="displayName"
                  class="text-gray-500 dark:text-gray-300"
                >{{ `(u/${username})` }}</span>
              </nuxt-link>
              <span
                v-if="isAdmin"
                class="rounded-md border border-gray-500 dark:border-gray-300 px-1 py-0 text-xs text-gray-500 dark:text-gray-300"
              >Admin</span>
              <span
                v-else-if="isMod"
                class="rounded-md border border-blue-500 dark:border-gray-300 px-1 py-0 text-xs text-gray-500 dark:text-gray-300"
              >
                Mod
              </span>
              <span
                v-if="isOriginalPoster"
                class="rounded-md border border-gray-500 dark:border-gray-300 px-1 py-0 text-xs text-gray-500 dark:text-gray-300"
              >OP</span>
            </div>
          </slot>
        </button>
      </template>
      <template #default>
        <div>
          <div
            v-if="!displayName"
            class="text-md flex w-full flex-col"
          >
            <AvatarComponent
              :text="username"
              :src="src"
              :is-medium="true"
            />{{ username }}
          </div>
          <div
            v-if="displayName"
            class="text-md flex w-full flex-col"
          >
            <AvatarComponent
              :text="username"
              :src="src"
              :is-medium="true"
            />
            <p class="text-xs font-bold">
              {{ displayName }}
            </p>
            <p class="text-xs text-gray-600 dark:text-white">
              {{ `u/${username}` }}
            </p>
          </div>
          <ul class="text-xs">
            <li>
              {{ `account created ${timeAgo(new Date(accountCreated))}` }}
            </li>
            <li>{{ `${commentKarma ?? 0} comment karma` }}</li>
            <li>{{ `${discussionKarma ?? 0} discussion karma` }}</li>
          </ul>
        </div>
      </template>
    </v-tooltip>
    
    <!-- SSR Fallback -->
    <template #fallback>
      <button>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
        <div class="flex flex-row items-center gap-1">
          <nuxt-link
            :to="{
              name: 'u-username',
              params: { username },
            }"
            class="flex flex-row items-center gap-1 hover:underline"
          >
            <span
              v-if="!displayName"
              class="font-bold"
            >{{ username }}</span>
            <span
              v-if="displayName"
              class="font-bold"
            >{{ displayName }}</span>
            <span
              v-if="displayName"
              class="text-gray-500 dark:text-gray-300"
            >{{ `(u/${username})` }}</span>
          </nuxt-link>
          <span
            v-if="isAdmin"
<<<<<<< HEAD
            class="rounded-md border border-gray-300 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
            >Admin</span
          >
          <span
            v-else-if="isMod"
            class="rounded-md border border-orange-500 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
=======
            class="rounded-md border border-gray-500 dark:border-gray-300 px-1 py-0 text-xs text-gray-500 dark:text-gray-300"
          >Admin</span>
          <span
            v-else-if="isMod"
            class="rounded-md border border-blue-500 dark:border-gray-300 px-1 py-0 text-xs text-gray-500 dark:text-gray-300"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          >
            Mod
          </span>
          <span
            v-if="isOriginalPoster"
<<<<<<< HEAD
            class="rounded-md border border-gray-300 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
            >OP</span
          >
=======
            class="rounded-md border border-gray-500 dark:border-gray-300 px-1 py-0 text-xs text-gray-500 dark:text-gray-300"
          >OP</span>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
        </div>
      </slot>
    </button>

    <template #tooltip>
      <div class="flex w-full flex-col space-y-2">
        <div class="flex items-center space-x-3">
          <AvatarComponent
            :is-medium="true"
            :src="src"
            :text="username"
          />
          <div>
            <template v-if="!displayName">
              <p class="font-bold text-white">{{ username }}</p>
            </template>
            <template v-else>
              <p class="font-bold text-white">{{ displayName }}</p>
              <p class="text-xs text-gray-300">{{ `u/${username}` }}</p>
            </template>
          </div>
        </div>
        <ul class="space-y-1 text-xs text-gray-300">
          <li v-if="accountCreated">
            {{ `account created ${timeAgo(new Date(accountCreated))}` }}
          </li>
          <li>{{ `${commentKarma ?? 0} comment karma` }}</li>
          <li>{{ `${discussionKarma ?? 0} discussion karma` }}</li>
        </ul>
      </div>
    </template>
<<<<<<< HEAD
  </FloatingTooltip>
</template>
=======
  </client-only>
</template>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
