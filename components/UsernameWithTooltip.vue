<script setup lang="ts">
import { computed } from 'vue';
import { timeAgo } from '@/utils';

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
  disableTooltip?: boolean;
  lightText?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  displayName: '',
  src: '',
  accountCreated: '',
  commentKarma: 0,
  discussionKarma: 0,
  isAdmin: false,
  isMod: false,
  isOriginalPoster: false,
  disableTooltip: false,
  lightText: false,
});

const accountCreatedText = computed(() => {
  if (!props.accountCreated) return '';
  try {
    return `account created ${timeAgo(new Date(props.accountCreated))}`;
  } catch {
    return '';
  }
});

const tooltipAriaLabel = computed(() => {
  const name = props.displayName || props.username;
  return `User info for ${name}`;
});

const usernameClasses = computed(() => {
  if (props.lightText) {
    return 'text-gray-200';
  }
  return 'text-gray-500 dark:text-gray-300';
});

const badgeClasses = computed(() => {
  if (props.lightText) {
    return 'rounded-md border border-gray-300 px-1 py-0 text-xs text-gray-200';
  }
  return 'rounded-md border border-gray-500 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300';
});

const modBadgeClasses = computed(() => {
  if (props.lightText) {
    return 'rounded-md border border-orange-400 px-1 py-0 text-xs text-orange-300';
  }
  return 'rounded-md border border-orange-500 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300';
});
</script>
<template>
  <client-only>
    <v-tooltip
      v-if="!disableTooltip"
      location="bottom"
      content-class="custom-tooltip"
      :aria-label="tooltipAriaLabel"
      :content-props="{ 'aria-label': tooltipAriaLabel }"
    >
      <template #activator="{ props: activatorProps }">
        <slot>
          <div class="flex flex-row items-center gap-1">
            <nuxt-link
              v-bind="activatorProps"
              :to="{
                name: 'u-username',
                params: { username },
              }"
              class="flex flex-row items-center gap-1 hover:underline"
            >
              <span v-if="!displayName" class="font-bold">{{ username }}</span>
              <span v-if="displayName" class="font-bold">{{ displayName }}</span>
              <span
                v-if="displayName"
                :class="usernameClasses"
                >{{ `(u/${username})` }}</span
              >
            </nuxt-link>
            <span
              v-if="isAdmin"
              :class="badgeClasses"
              >Admin</span
            >
            <span
              v-else-if="isMod"
              :class="modBadgeClasses"
            >
              Mod
            </span>
            <span
              v-if="isOriginalPoster"
              :class="badgeClasses"
              >OP</span
            >
          </div>
        </slot>
      </template>
      <template #default>
        <div>
          <div v-if="!displayName" class="text-md flex w-full flex-col">
            <AvatarComponent :text="username" :src="src" :is-medium="true" />{{
              username
            }}
          </div>
          <div v-if="displayName" class="text-md flex w-full flex-col">
            <AvatarComponent :text="username" :src="src" :is-medium="true" />
            <p class="text-xs font-bold">
              {{ displayName }}
            </p>
            <p class="text-xs text-gray-600 dark:text-white">
              {{ `u/${username}` }}
            </p>
          </div>
          <ul class="text-xs">
            <li v-if="accountCreatedText">
              {{ accountCreatedText }}
            </li>
            <li>{{ `${commentKarma ?? 0} comment karma` }}</li>
            <li>{{ `${discussionKarma ?? 0} discussion karma` }}</li>
          </ul>
        </div>
      </template>
    </v-tooltip>

    <template v-else>
      <div class="flex flex-row items-center gap-1">
        <nuxt-link
          :to="{
            name: 'u-username',
            params: { username },
          }"
          class="flex flex-row items-center gap-1 hover:underline"
        >
          <span v-if="!displayName" class="font-bold">{{ username }}</span>
          <span v-if="displayName" class="font-bold">{{ displayName }}</span>
          <span v-if="displayName" :class="usernameClasses">{{
            `(u/${username})`
          }}</span>
        </nuxt-link>
        <span
          v-if="isAdmin"
          :class="badgeClasses"
          >Admin</span
        >
        <span
          v-else-if="isMod"
          :class="modBadgeClasses"
        >
          Mod
        </span>
        <span
          v-if="isOriginalPoster"
          :class="badgeClasses"
          >OP</span
        >
      </div>
    </template>

    <!-- SSR Fallback -->
    <template #fallback>
      <div class="flex flex-row items-center gap-1">
        <nuxt-link
          :to="{
            name: 'u-username',
            params: { username },
          }"
          class="flex flex-row items-center gap-1 hover:underline"
        >
          <span v-if="!displayName" class="font-bold">{{ username }}</span>
          <span v-if="displayName" class="font-bold">{{ displayName }}</span>
          <span v-if="displayName" :class="usernameClasses">{{
            `(u/${username})`
          }}</span>
        </nuxt-link>
        <span
          v-if="isAdmin"
          :class="badgeClasses"
          >Admin</span
        >
        <span
          v-else-if="isMod"
          :class="modBadgeClasses"
        >
          Mod
        </span>
        <span
          v-if="isOriginalPoster"
          :class="badgeClasses"
          >OP</span
        >
      </div>
    </template>
  </client-only>
</template>
