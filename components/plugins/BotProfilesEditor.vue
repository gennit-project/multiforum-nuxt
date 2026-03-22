<script setup lang="ts">
import { computed } from 'vue';

export interface BotProfile {
  id: string;
  label: string;
  prompt: string;
}

export interface ExistingBot {
  username: string;
  botProfileId?: string | null;
  isDeprecated?: boolean | null;
}

const props = defineProps<{
  profiles: BotProfile[];
  channelUniqueName: string;
  botName: string;
  existingBots?: ExistingBot[];
  scope?: 'server' | 'channel';
  serverProfiles?: BotProfile[];
}>();

const emit = defineEmits<{
  'update:profiles': [profiles: BotProfile[]];
}>();

const isChannelScope = computed(() => props.scope === 'channel');

// Combined profiles for preview (server + channel in channel scope)
const allProfiles = computed(() => {
  if (isChannelScope.value) {
    // In channel scope, combine server profiles with channel profiles
    // Channel profiles can override server profiles with same ID
    const channelOverrides = props.profiles.filter((p) => p.id?.trim());
    const channelIds = new Set(channelOverrides.map((p) => p.id));

    // Server profiles that aren't overridden by channel
    const serverOnly = (props.serverProfiles || []).filter((p) => !channelIds.has(p.id));

    return [...serverOnly, ...channelOverrides];
  }
  // In server scope, just use the editable profiles
  return props.profiles;
});

// Build bot username matching backend logic
function buildBotUsername(profileId?: string | null): string {
  const normalizeId = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-_]+|[-_]+$/g, '');

  const normalizedChannel = normalizeId(props.channelUniqueName);
  const normalizedBot = normalizeId(props.botName);

  if (profileId) {
    const normalizedProfile = normalizeId(profileId);
    return `bot-${normalizedChannel}-${normalizedBot}-${normalizedProfile}`;
  }

  return `bot-${normalizedChannel}-${normalizedBot}`;
}

// Build the invoke handle from profile ID (what users type after /bot/)
function buildInvokeHandle(profileId?: string | null): string {
  const normalizeId = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-_]+|[-_]+$/g, '');

  const normalizedBot = normalizeId(props.botName);
  if (profileId) {
    const normalizedProfile = normalizeId(profileId);
    return `${normalizedBot}-${normalizedProfile}`;
  }
  return normalizedBot;
}

type BotPreviewEntry = {
  username: string;
  profileId: string | null;
  invokeHandle: string;
  label: string | null;
};

// Normalize ID helper (matches backend logic)
function normalizeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');
}

// Compute preview data for the bot status section
const botStatusPreview = computed(() => {
  const existing: BotPreviewEntry[] = [];
  const newBots: BotPreviewEntry[] = [];
  const deprecated: BotPreviewEntry[] = [];

  // Filter existingBots to only include bots belonging to this plugin
  const normalizedChannel = normalizeId(props.channelUniqueName);
  const normalizedBot = normalizeId(props.botName);
  const botPrefix = `bot-${normalizedChannel}-${normalizedBot}`;

  const relevantBots = (props.existingBots || []).filter(
    (bot) => bot.username.startsWith(botPrefix)
  );

  const existingBotMap = new Map<string, ExistingBot>();
  for (const bot of relevantBots) {
    existingBotMap.set(bot.username, bot);
  }

  // Get valid profiles from allProfiles (includes server profiles in channel scope)
  const validProfiles = allProfiles.value.filter((p) => p.id?.trim());

  // Only profile-specific bots are created (no base bot)
  const desiredUsernames = new Set<string>();

  // Profile bots only
  for (const profile of validProfiles) {
    const username = buildBotUsername(profile.id);
    desiredUsernames.add(username);

    const entry: BotPreviewEntry = {
      username,
      profileId: profile.id,
      invokeHandle: buildInvokeHandle(profile.id),
      label: profile.label || null,
    };

    if (existingBotMap.has(username)) {
      existing.push(entry);
    } else {
      newBots.push(entry);
    }
  }

  // Find bots that will be deprecated (exist but not in desired set)
  // Only check bots belonging to this plugin (already filtered in relevantBots)
  for (const bot of relevantBots) {
    if (!desiredUsernames.has(bot.username)) {
      deprecated.push({
        username: bot.username,
        profileId: bot.botProfileId || null,
        invokeHandle: '', // Can't determine for deprecated bots
        label: null,
      });
    }
  }

  return { existing, newBots, deprecated };
});

function updateProfile(index: number, field: keyof BotProfile, value: string) {
  const updated = [...props.profiles];
  const current = updated[index];
  if (!current) return;
  updated[index] = {
    id: current.id,
    label: current.label,
    prompt: current.prompt,
    [field]: value,
  };
  emit('update:profiles', updated);
}

function addProfile() {
  const updated = [...props.profiles, { id: '', label: '', prompt: '' }];
  emit('update:profiles', updated);
}

function removeProfile(index: number) {
  const updated = [...props.profiles];
  updated.splice(index, 1);
  emit('update:profiles', updated);
}

// Validate profile ID format
function isValidProfileId(id: string): boolean {
  if (!id.trim()) return false;
  const normalized = id
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');
  return /^[a-z0-9_-]+$/.test(normalized) && normalized.length > 0;
}

function getIdValidationError(id: string): string {
  if (!id.trim()) return 'Profile ID is required';
  if (!isValidProfileId(id)) {
    return 'Profile ID must contain only lowercase letters, numbers, hyphens, and underscores';
  }
  return '';
}
</script>

<template>
  <div class="space-y-6">
    <!-- Server Profiles (read-only in channel scope) -->
    <div v-if="isChannelScope && serverProfiles && serverProfiles.length > 0" class="space-y-4">
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
        <i class="fa-solid fa-server mr-2" />
        Server-configured Profiles
        <span class="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
          (read-only, configured in server settings)
        </span>
      </p>

      <div
        v-for="(profile, index) in serverProfiles"
        :key="`server-${index}`"
        class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
      >
        <div class="mb-3 flex items-center justify-between">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ profile.label || profile.id }}
          </span>
          <span class="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-800 dark:text-blue-200">
            Server Profile
          </span>
        </div>

        <div class="space-y-2 text-sm">
          <div>
            <span class="font-medium text-gray-600 dark:text-gray-400">Profile ID:</span>
            <span class="ml-2 font-mono text-gray-800 dark:text-gray-200">{{ profile.id }}</span>
          </div>
          <div v-if="profile.label">
            <span class="font-medium text-gray-600 dark:text-gray-400">Display Label:</span>
            <span class="ml-2 text-gray-800 dark:text-gray-200">{{ profile.label }}</span>
          </div>
          <div v-if="profile.prompt">
            <span class="font-medium text-gray-600 dark:text-gray-400">System Prompt:</span>
            <div class="mt-1 rounded bg-white p-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <MarkdownPreview :text="profile.prompt.replace(/\\n/g, '\n')" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Editable Profiles Section -->
    <div class="space-y-4">
      <p v-if="isChannelScope && serverProfiles && serverProfiles.length > 0" class="text-sm font-medium text-gray-700 dark:text-gray-300">
        <i class="fa-solid fa-layer-group mr-2" />
        Channel-specific Profiles
        <span class="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
          (optional, add profiles specific to this channel)
        </span>
      </p>

      <div
        v-for="(profile, index) in profiles"
        :key="index"
        class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="mb-3 flex items-center justify-between">
          <span class="font-medium text-gray-900 dark:text-white">
            Profile {{ index + 1 }}
          </span>
          <button
            type="button"
            class="flex items-center gap-1 rounded border border-red-500 px-2 py-1 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            @click="removeProfile(index)"
          >
            <i class="fa-solid fa-xmark" />
            Remove
          </button>
        </div>

        <div class="space-y-3">
          <!-- Profile ID -->
          <div class="space-y-1">
            <label
              :for="`profile-id-${index}`"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Profile ID
              <span class="text-red-500">*</span>
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Unique identifier used in the bot username. Cannot be changed after first save.
            </p>
            <input
              :id="`profile-id-${index}`"
              type="text"
              :value="profile.id"
              placeholder="e.g., helper, reviewer, translator"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              :class="{ 'border-red-500': profile.id && getIdValidationError(profile.id) }"
              @input="updateProfile(index, 'id', ($event.target as HTMLInputElement).value)"
            >
            <p
              v-if="profile.id && getIdValidationError(profile.id)"
              class="text-xs text-red-600 dark:text-red-400"
            >
              {{ getIdValidationError(profile.id) }}
            </p>
          </div>

          <!-- Profile Label -->
          <div class="space-y-1">
            <label
              :for="`profile-label-${index}`"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Display Label
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Human-readable name shown in the sidebar and comments.
            </p>
            <input
              :id="`profile-label-${index}`"
              type="text"
              :value="profile.label"
              placeholder="e.g., Code Helper, PR Reviewer"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              @input="updateProfile(index, 'label', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <!-- Profile Prompt -->
          <div class="space-y-1">
            <label
              :for="`profile-prompt-${index}`"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              System Prompt
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Instructions that define this bot's personality and behavior.
            </p>
            <textarea
              :id="`profile-prompt-${index}`"
              :value="profile.prompt"
              rows="4"
              placeholder="e.g., You are a helpful code reviewer..."
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              @input="updateProfile(index, 'prompt', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="profiles.length === 0 && (!isChannelScope || !serverProfiles || serverProfiles.length === 0)"
        class="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-600 dark:bg-amber-900/20"
      >
        <p class="text-amber-700 dark:text-amber-300">
          <i class="fa-solid fa-triangle-exclamation mr-2" />
          At least one bot profile is required. Add a profile to create bot users.
        </p>
      </div>

      <!-- Add Profile Button -->
      <button
        type="button"
        class="flex items-center gap-2 rounded border border-orange-500 px-3 py-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
        @click="addProfile"
      >
        <i class="fa-solid fa-plus" />
        Add {{ isChannelScope ? 'Channel' : '' }} Profile
      </button>
    </div>

    <!-- Bot Status Preview -->
    <div
      v-if="botName && channelUniqueName"
      class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
    >
      <p class="mb-3 font-medium text-gray-900 dark:text-white">
        Bot Users Preview
      </p>
      <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
        The following bot user accounts will be managed for this channel:
      </p>

      <div class="space-y-3 text-sm">
        <!-- Existing Bots -->
        <div
          v-for="bot in botStatusPreview.existing"
          :key="bot.username"
          class="flex items-start gap-2"
        >
          <span class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <i class="fa-solid fa-check text-xs" />
          </span>
          <div>
            <span class="flex flex-wrap items-center gap-x-2">
              <span class="font-mono text-gray-700 dark:text-gray-300">{{ bot.username }}</span>
              <span v-if="bot.label" class="text-gray-500 dark:text-gray-400">({{ bot.label }})</span>
              <span class="text-green-600 dark:text-green-400">(active)</span>
            </span>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Invoke with /bot/{{ bot.invokeHandle }}
            </div>
          </div>
        </div>

        <!-- New Bots -->
        <div
          v-for="bot in botStatusPreview.newBots"
          :key="bot.username"
          class="flex items-start gap-2"
        >
          <span class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <i class="fa-solid fa-plus text-xs" />
          </span>
          <div>
            <span class="flex flex-wrap items-center gap-x-2">
              <span class="font-mono text-gray-700 dark:text-gray-300">{{ bot.username }}</span>
              <span v-if="bot.label" class="text-gray-500 dark:text-gray-400">({{ bot.label }})</span>
              <span class="text-blue-600 dark:text-blue-400">(will be created)</span>
            </span>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Invoke with /bot/{{ bot.invokeHandle }}
            </div>
          </div>
        </div>

        <!-- Deprecated Bots -->
        <div
          v-for="bot in botStatusPreview.deprecated"
          :key="bot.username"
          class="flex items-start gap-2"
        >
          <span class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-200">
            <i class="fa-solid fa-archive text-xs" />
          </span>
          <div>
            <span class="flex flex-wrap items-center gap-x-2">
              <span class="font-mono text-gray-700 dark:text-gray-300">{{ bot.username }}</span>
              <span class="text-amber-600 dark:text-yellow-300">(will be deprecated)</span>
            </span>
          </div>
        </div>

        <!-- No Changes -->
        <p
          v-if="botStatusPreview.newBots.length === 0 && botStatusPreview.deprecated.length === 0 && botStatusPreview.existing.length === 0"
          class="text-gray-500 dark:text-gray-400"
        >
          No bot users to preview. Configure the bot name in server settings first.
        </p>
      </div>
    </div>
  </div>
</template>
