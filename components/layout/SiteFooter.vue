<script lang="ts" setup>
import { computed } from 'vue';
import { useBranding } from '@/composables/useBranding';

const { branding } = useBranding();

const builtInLinks = [
  {
    text: 'Privacy Policy',
    to: '/privacy-policy',
  },
  {
    text: 'Terms of Use',
    to: '/terms-of-use',
  },
  {
    text: 'About',
    to: '/about',
  },
  {
    text: 'Moderation Issues',
    to: '/server/issues',
  },
  {
    text: 'Report a Bug',
    to: '/support',
  },
  {
    text: 'Report Harmful or Illegal Content',
    to: '/support?type=content-report',
  },
];

// Operator-configured links follow the built-in ones so the statutory links
// (privacy, terms, content reporting) keep a stable position.
const links = computed(() => [
  ...builtInLinks.map((link) => ({ ...link, external: false })),
  ...branding.value.customFooterLinks.map((link) => ({
    text: link.label,
    to: link.url,
    // Operator links may point off-site; those open in a new tab and carry the
    // same screen-reader warning as the other external links below.
    external: !link.url.startsWith('/'),
  })),
]);

// The upstream issue tracker is only offered when this instance still presents
// itself as Multiforum; a re-branded deployment directs users to its own
// support address instead.
const showIssuesLink = computed(
  () => branding.value.showUpstreamLinks && Boolean(branding.value.issuesUrl)
);
const showSupportEmail = computed(() => Boolean(branding.value.supportEmail));
const showSupportRow = computed(
  () => showIssuesLink.value || showSupportEmail.value
);
const showAttributionRow = computed(
  () =>
    branding.value.showUpstreamLinks &&
    Boolean(branding.value.docsUrl || branding.value.sourceUrl)
);
</script>
<template>
  <div class="mt-auto w-full">
    <div
      class="flex flex-wrap justify-center gap-x-4 gap-y-2 bg-black p-4 text-xs text-white"
    >
      <nuxt-link
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :target="link.external ? '_blank' : undefined"
        :rel="link.external ? 'noopener noreferrer' : undefined"
        :external="link.external"
        class="cursor-pointer whitespace-nowrap text-white underline"
      >
        {{ link.text
        }}<span v-if="link.external" class="sr-only">
          (opens in a new tab)</span
        >
      </nuxt-link>
    </div>
    <div
      v-if="showSupportRow"
      class="w-full bg-gray-800 px-8 py-4 text-center text-xs text-white"
    >
      <template v-if="showIssuesLink">
        If you have feedback or technical problems, please open an issue in the
        <a
          class="ml-1 text-orange-400 underline"
          target="_blank"
          rel="noopener noreferrer"
          :href="branding.issuesUrl"
          >GitHub repo<span class="sr-only"> (opens in a new tab)</span></a
        ><template v-if="showSupportEmail">
          , or email support at
          <a
            class="ml-1 text-orange-400 underline"
            :href="`mailto:${branding.supportEmail}`"
            >{{ branding.supportEmail }}</a
          ></template
        >.
      </template>
      <template v-else-if="showSupportEmail">
        If you have feedback or technical problems, please email support at
        <a
          class="ml-1 text-orange-400 underline"
          :href="`mailto:${branding.supportEmail}`"
          >{{ branding.supportEmail }}</a
        >.
      </template>
    </div>
    <div
      v-if="showAttributionRow"
      class="flex w-full flex-wrap justify-center gap-x-4 gap-y-2 bg-gray-900 px-8 py-3 text-center text-xs text-gray-300"
    >
      <span>Powered by {{ branding.productName }}</span>
      <a
        v-if="branding.docsUrl"
        class="text-orange-400 underline"
        target="_blank"
        rel="noopener noreferrer"
        :href="branding.docsUrl"
        >Documentation<span class="sr-only"> (opens in a new tab)</span></a
      >
      <a
        v-if="branding.sourceUrl"
        class="text-orange-400 underline"
        target="_blank"
        rel="noopener noreferrer"
        :href="branding.sourceUrl"
        >Source code<span class="sr-only"> (opens in a new tab)</span></a
      >
    </div>
  </div>
</template>
