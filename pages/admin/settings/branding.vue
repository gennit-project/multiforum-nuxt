<script setup lang="ts">
import { computed, ref, type PropType } from 'vue';
import type { ServerConfigUpdateInput } from '@/__generated__/graphql';
import FormRow from '@/components/FormRow.vue';
import { useBrandingLock } from '@/composables/useBranding';
import { useImageUpload } from '@/composables/useImageUpload';
import {
  BRAND_DARK_SURFACE,
  BRAND_LIGHT_SURFACE,
  MAX_CUSTOM_FOOTER_LINKS,
  UPSTREAM_BRANDING,
  getContrastRatio,
  isSafeBrandingUrl,
  isValidHexColor,
  type BrandingLink,
} from '@/utils/branding';

const props = defineProps({
  editMode: {
    type: Boolean,
    required: true,
  },
  formValues: {
    type: Object as PropType<ServerConfigUpdateInput | null>,
    default: null,
  },
});

// True when NUXT_PUBLIC_BRANDING_LOCKED pins branding to deployment config, in
// which case the stored values are overridden at render time and editing them
// here would be misleading.
const locked = useBrandingLock();

const emit = defineEmits<{
  updateFormValues: [value: ServerConfigUpdateInput];
}>();

type UrlField = 'brandingDocsURL' | 'brandingSourceURL' | 'brandingIssuesURL';
type ImageUrlField =
  'serverIconURL' | 'brandingLogoDarkURL' | 'brandingFaviconURL';

const imageFields: {
  field: ImageUrlField;
  label: string;
  hint: string;
  accept: string;
}[] = [
  {
    field: 'serverIconURL',
    label: 'Light-mode logo',
    hint: 'Shown in the navigation in light mode.',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif',
  },
  {
    field: 'brandingLogoDarkURL',
    label: 'Dark-mode logo',
    hint: 'Optional. The light-mode logo is used when this is blank.',
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif',
  },
  {
    field: 'brandingFaviconURL',
    label: 'Favicon',
    hint: 'Shown in browser tabs and bookmarks.',
    accept: 'image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon',
  },
];

const urlFields: { field: UrlField; label: string; hint: string }[] = [
  {
    field: 'brandingDocsURL',
    label: 'Documentation URL',
    hint: `Where the footer's documentation link goes. Defaults to ${UPSTREAM_BRANDING.docsUrl}`,
  },
  {
    field: 'brandingSourceURL',
    label: 'Source code URL',
    hint: 'Where the footer’s source code link goes. Point this at your own fork if you maintain one.',
  },
  {
    field: 'brandingIssuesURL',
    label: 'Issue tracker URL',
    hint: 'Where people are sent to report problems with the software itself.',
  },
];

const customLinks = computed<BrandingLink[]>(() => {
  const value = props.formValues?.brandingCustomFooterLinks;
  return Array.isArray(value) ? (value as BrandingLink[]) : [];
});

const hasLogo = computed(() =>
  Boolean(
    props.formValues?.serverIconURL?.trim() ||
    props.formValues?.brandingLogoDarkURL?.trim()
  )
);
const logoAltIsMissing = computed(
  () => hasLogo.value && !props.formValues?.brandingLogoAlt?.trim()
);

const primaryColor = computed(
  () => props.formValues?.brandingPrimaryColor?.trim() || ''
);
const primaryColorIsInvalid = computed(
  () => Boolean(primaryColor.value) && !isValidHexColor(primaryColor.value)
);
const lightContrast = computed(() =>
  getContrastRatio(primaryColor.value, BRAND_LIGHT_SURFACE)
);
const darkContrast = computed(() =>
  getContrastRatio(primaryColor.value, BRAND_DARK_SURFACE)
);
const hasLowContrast = computed(
  () =>
    (lightContrast.value !== null && lightContrast.value < 4.5) ||
    (darkContrast.value !== null && darkContrast.value < 4.5)
);

const { uploadFile, validateFileSize, isUploading } = useImageUpload();
const uploadingField = ref<ImageUrlField | null>(null);
const uploadError = ref('');

const canAddLink = computed(
  () => customLinks.value.length < MAX_CUSTOM_FOOTER_LINKS
);

const emailIsInvalid = computed(() => {
  const value = props.formValues?.brandingSupportEmail?.trim();
  return Boolean(value) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value ?? '');
});

// An empty value is a deliberate opt-out, so only non-empty values are checked.
const urlIsInvalid = (field: UrlField): boolean => {
  const value = props.formValues?.[field]?.trim();
  return Boolean(value) && !isSafeBrandingUrl(value ?? '');
};

const imageUrlIsInvalid = (field: ImageUrlField): boolean => {
  const value = props.formValues?.[field]?.trim();
  return Boolean(value) && !isSafeBrandingUrl(value ?? '');
};

const linkUrlIsInvalid = (link: BrandingLink): boolean =>
  Boolean(link.url.trim()) && !isSafeBrandingUrl(link.url.trim());

const updateText = ({ field, event }: { field: string; event: Event }) => {
  emit('updateFormValues', {
    [field]: (event.target as HTMLInputElement).value,
  });
};

const updateShowUpstreamLinks = (event: Event) => {
  emit('updateFormValues', {
    brandingShowUpstreamLinks: (event.target as HTMLInputElement).checked,
  });
};

const uploadBrandingImage = async ({
  field,
  event,
}: {
  field: ImageUrlField;
  event: Event;
}) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploadError.value = '';
  const validation = validateFileSize(file);
  if (!validation.valid) {
    uploadError.value =
      validation.message || 'The selected image is too large.';
    input.value = '';
    return;
  }

  uploadingField.value = field;
  const result = await uploadFile(file);
  uploadingField.value = null;
  input.value = '';

  if (!result.success || !result.embeddedLink) {
    uploadError.value = result.error || 'The image could not be uploaded.';
    return;
  }

  emit('updateFormValues', { [field]: result.embeddedLink });
};

const updateLinks = (links: BrandingLink[]) => {
  emit('updateFormValues', { brandingCustomFooterLinks: links });
};

const updateLinkField = ({
  index,
  key,
  event,
}: {
  index: number;
  key: keyof BrandingLink;
  event: Event;
}) => {
  const next = customLinks.value.map((link, i) =>
    i === index
      ? { ...link, [key]: (event.target as HTMLInputElement).value }
      : link
  );
  updateLinks(next);
};

const addLink = () => {
  if (!canAddLink.value) return;
  updateLinks([...customLinks.value, { label: '', url: '' }]);
};

const removeLink = (index: number) => {
  updateLinks(customLinks.value.filter((_, i) => i !== index));
};
</script>

<template>
  <div class="space-y-6">
    <p
      v-if="locked"
      class="rounded-md bg-gray-100 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200"
      data-testid="branding-locked-notice"
    >
      Branding for this instance is managed by your operator through deployment
      configuration, so it cannot be edited here.
    </p>

    <FormRow section-title="Logo and favicon">
      <template #content>
        <div class="space-y-5">
          <div v-for="imageField in imageFields" :key="imageField.field">
            <label
              :for="imageField.field"
              class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {{ imageField.label }} URL
            </label>
            <input
              :id="imageField.field"
              type="url"
              :data-testid="`${imageField.field}-input`"
              class="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800"
              :disabled="locked"
              :value="formValues?.[imageField.field] || ''"
              :aria-invalid="imageUrlIsInvalid(imageField.field)"
              :aria-describedby="
                imageUrlIsInvalid(imageField.field)
                  ? `${imageField.field}-error`
                  : `${imageField.field}-hint`
              "
              @input="updateText({ field: imageField.field, event: $event })"
            />
            <p
              v-if="imageUrlIsInvalid(imageField.field)"
              :id="`${imageField.field}-error`"
              role="alert"
              class="mt-1 text-xs text-red-700 dark:text-red-400"
            >
              Enter a full http:// or https:// address, or a path beginning with
              a slash.
            </p>
            <p
              v-else
              :id="`${imageField.field}-hint`"
              class="mt-1 text-xs text-gray-600 dark:text-gray-400"
            >
              {{ imageField.hint }} Enter a URL or upload an image below.
            </p>
            <input
              :id="`${imageField.field}-upload`"
              type="file"
              :accept="imageField.accept"
              :disabled="locked || isUploading"
              :aria-label="`Upload ${imageField.label.toLowerCase()}`"
              class="file:bg-brand-100 file:text-brand-900 hover:file:bg-brand-200 dark:file:bg-brand-900 dark:file:text-brand-100 mt-2 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium disabled:opacity-50 dark:text-gray-300"
              @change="
                uploadBrandingImage({ field: imageField.field, event: $event })
              "
            />
            <p
              v-if="uploadingField === imageField.field"
              class="mt-1 text-xs text-gray-600 dark:text-gray-400"
              role="status"
            >
              Uploading…
            </p>
          </div>

          <p
            v-if="uploadError"
            class="text-sm text-red-700 dark:text-red-400"
            role="alert"
          >
            {{ uploadError }}
          </p>

          <div>
            <label
              for="branding-logo-alt"
              class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Logo accessible name
              <span v-if="hasLogo" aria-hidden="true" class="text-red-600"
                >*</span
              >
            </label>
            <input
              id="branding-logo-alt"
              type="text"
              data-testid="branding-logo-alt-input"
              class="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800"
              :disabled="locked"
              :required="hasLogo"
              :value="formValues?.brandingLogoAlt || ''"
              :aria-invalid="logoAltIsMissing"
              :aria-describedby="
                logoAltIsMissing
                  ? 'branding-logo-alt-error'
                  : 'branding-logo-alt-hint'
              "
              @input="updateText({ field: 'brandingLogoAlt', event: $event })"
            />
            <p
              v-if="logoAltIsMissing"
              id="branding-logo-alt-error"
              class="mt-1 text-xs text-red-700 dark:text-red-400"
              role="alert"
            >
              Enter a name for the logo’s home link.
            </p>
            <p
              v-else
              id="branding-logo-alt-hint"
              class="mt-1 text-xs text-gray-600 dark:text-gray-400"
            >
              Describe the site, not the image—for example, “Acme Forum”.
            </p>
          </div>
        </div>
      </template>
    </FormRow>

    <FormRow section-title="Primary colour">
      <template #content>
        <label
          for="branding-primary-color"
          class="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Brand colour
        </label>
        <div class="mt-1 flex items-center gap-3">
          <input
            id="branding-primary-color"
            type="text"
            inputmode="text"
            pattern="#[0-9A-Fa-f]{6}"
            placeholder="#f97316"
            data-testid="branding-primary-color-input"
            class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800"
            :disabled="locked"
            :value="formValues?.brandingPrimaryColor || ''"
            :aria-invalid="primaryColorIsInvalid"
            :aria-describedby="
              primaryColorIsInvalid
                ? 'branding-primary-color-error'
                : 'branding-primary-color-hint'
            "
            @input="
              updateText({ field: 'brandingPrimaryColor', event: $event })
            "
          />
          <span
            v-if="!primaryColorIsInvalid && primaryColor"
            class="h-10 w-10 shrink-0 rounded-md border border-gray-400"
            :style="{ backgroundColor: primaryColor }"
            aria-hidden="true"
          />
        </div>
        <p
          v-if="primaryColorIsInvalid"
          id="branding-primary-color-error"
          class="mt-1 text-xs text-red-700 dark:text-red-400"
          role="alert"
        >
          Enter a six-digit hex colour such as #2563eb.
        </p>
        <div
          v-else-if="lightContrast !== null && darkContrast !== null"
          id="branding-primary-color-hint"
          class="mt-2 space-y-1 text-xs text-gray-700 dark:text-gray-300"
        >
          <p>Contrast on light surfaces: {{ lightContrast.toFixed(2) }}:1</p>
          <p>Contrast on dark surfaces: {{ darkContrast.toFixed(2) }}:1</p>
          <p
            v-if="hasLowContrast"
            class="font-medium text-red-700 dark:text-red-400"
            role="alert"
          >
            This colour is below the WCAG AA 4.5:1 text contrast threshold on at
            least one surface. Choose a different colour or avoid using it for
            text.
          </p>
          <p v-else class="font-medium text-green-700 dark:text-green-400">
            This colour meets the WCAG AA 4.5:1 text contrast threshold on both
            surfaces.
          </p>
        </div>
        <p
          v-else
          id="branding-primary-color-hint"
          class="mt-1 text-xs text-gray-600 dark:text-gray-400"
        >
          Leave blank to use the default orange palette.
        </p>
      </template>
    </FormRow>

    <FormRow section-title="Product name">
      <template #content>
        <label
          for="branding-product-name"
          class="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Name shown in the footer attribution
        </label>
        <input
          id="branding-product-name"
          type="text"
          data-testid="branding-product-name-input"
          class="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800"
          :disabled="locked"
          :value="formValues?.brandingProductName || ''"
          :placeholder="UPSTREAM_BRANDING.productName"
          aria-describedby="branding-product-name-hint"
          @input="updateText({ field: 'brandingProductName', event: $event })"
        />
        <p
          id="branding-product-name-hint"
          class="mt-1 text-xs text-gray-600 dark:text-gray-400"
        >
          Leave blank to keep the default name.
        </p>
      </template>
    </FormRow>

    <FormRow section-title="Links">
      <template #content>
        <div class="space-y-4">
          <div v-for="urlField in urlFields" :key="urlField.field">
            <label
              :for="urlField.field"
              class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {{ urlField.label }}
            </label>
            <input
              :id="urlField.field"
              type="url"
              :data-testid="`${urlField.field}-input`"
              class="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800"
              :disabled="locked"
              :value="formValues?.[urlField.field] || ''"
              :aria-invalid="urlIsInvalid(urlField.field)"
              :aria-describedby="
                urlIsInvalid(urlField.field)
                  ? `${urlField.field}-error`
                  : `${urlField.field}-hint`
              "
              @input="updateText({ field: urlField.field, event: $event })"
            />
            <p
              v-if="urlIsInvalid(urlField.field)"
              :id="`${urlField.field}-error`"
              role="alert"
              class="mt-1 text-xs text-red-700 dark:text-red-400"
            >
              Enter a full http:// or https:// address, or a path beginning with
              a slash.
            </p>
            <p
              v-else
              :id="`${urlField.field}-hint`"
              class="mt-1 text-xs text-gray-600 dark:text-gray-400"
            >
              {{ urlField.hint }} Leave blank to hide the link.
            </p>
          </div>
        </div>
      </template>
    </FormRow>

    <FormRow section-title="Support contact">
      <template #content>
        <label
          for="branding-support-email"
          class="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Support email address
        </label>
        <input
          id="branding-support-email"
          type="email"
          data-testid="branding-support-email-input"
          class="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800"
          :disabled="locked"
          :value="formValues?.brandingSupportEmail || ''"
          :aria-invalid="emailIsInvalid"
          :aria-describedby="
            emailIsInvalid
              ? 'branding-support-email-error'
              : 'branding-support-email-hint'
          "
          @input="updateText({ field: 'brandingSupportEmail', event: $event })"
        />
        <p
          v-if="emailIsInvalid"
          id="branding-support-email-error"
          role="alert"
          class="mt-1 text-xs text-red-700 dark:text-red-400"
        >
          Enter a valid email address.
        </p>
        <p
          v-else
          id="branding-support-email-hint"
          class="mt-1 text-xs text-gray-600 dark:text-gray-400"
        >
          Shown in the footer. Leave blank to omit the address entirely.
        </p>
      </template>
    </FormRow>

    <FormRow section-title="Upstream links">
      <template #content>
        <label class="flex items-start gap-3 text-sm dark:text-gray-200">
          <input
            id="branding-show-upstream-links"
            type="checkbox"
            data-testid="branding-show-upstream-links-input"
            class="text-brand-600 focus:ring-brand-500 mt-0.5 rounded border-gray-300"
            :disabled="locked"
            :checked="formValues?.brandingShowUpstreamLinks !== false"
            @change="updateShowUpstreamLinks"
          />
          <span>
            Show documentation, source and attribution links
            <span class="mt-1 block text-xs text-gray-600 dark:text-gray-400">
              Turn this off to present this instance under its own name only.
              The support address above is unaffected.
            </span>
          </span>
        </label>
      </template>
    </FormRow>

    <FormRow section-title="Extra footer links">
      <template #content>
        <div class="space-y-4">
          <p
            aria-live="polite"
            class="text-xs text-gray-600 dark:text-gray-400"
          >
            {{ customLinks.length }} of {{ MAX_CUSTOM_FOOTER_LINKS }} links used
          </p>

          <div
            v-for="(link, index) in customLinks"
            :key="index"
            class="flex flex-wrap items-start gap-3"
          >
            <div class="grow">
              <label
                :for="`branding-link-label-${index}`"
                class="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Link {{ index + 1 }} label
              </label>
              <input
                :id="`branding-link-label-${index}`"
                type="text"
                :data-testid="`branding-link-label-${index}`"
                class="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                :disabled="locked"
                :value="link.label"
                @input="updateLinkField({ index, key: 'label', event: $event })"
              />
            </div>
            <div class="grow">
              <label
                :for="`branding-link-url-${index}`"
                class="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Link {{ index + 1 }} URL
              </label>
              <input
                :id="`branding-link-url-${index}`"
                type="url"
                :data-testid="`branding-link-url-${index}`"
                class="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                :disabled="locked"
                :value="link.url"
                :aria-invalid="linkUrlIsInvalid(link)"
                :aria-describedby="
                  linkUrlIsInvalid(link)
                    ? `branding-link-url-${index}-error`
                    : undefined
                "
                @input="updateLinkField({ index, key: 'url', event: $event })"
              />
              <p
                v-if="linkUrlIsInvalid(link)"
                :id="`branding-link-url-${index}-error`"
                role="alert"
                class="mt-1 text-xs text-red-700 dark:text-red-400"
              >
                Enter a full http:// or https:// address, or a path beginning
                with a slash.
              </p>
            </div>
            <button
              type="button"
              class="mt-6 min-h-[44px] rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              :data-testid="`branding-link-remove-${index}`"
              :disabled="locked"
              :aria-label="`Remove footer link ${index + 1}`"
              @click="removeLink(index)"
            >
              Remove
            </button>
          </div>

          <button
            type="button"
            data-testid="branding-link-add"
            class="min-h-[44px] rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            :disabled="locked || !canAddLink"
            @click="addLink"
          >
            Add link
          </button>
          <p
            v-if="!canAddLink"
            class="text-xs text-gray-600 dark:text-gray-400"
            role="status"
          >
            The footer holds at most {{ MAX_CUSTOM_FOOTER_LINKS }} extra links.
          </p>
        </div>
      </template>
    </FormRow>
  </div>
</template>
