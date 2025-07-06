<script lang="ts">
import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
import { GET_CHANNEL } from "@/graphQLData/channel/queries";
import { UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/discussion/mutations";
import { defineComponent, computed, ref } from "vue";
import { useRouter, useRoute, useHead } from "nuxt/app";
import { useQuery, useMutation } from "@vue/apollo-composable";
import type { CreateEditDiscussionFormValues } from "@/types/Discussion";
import CreateEditDiscussionFields from "@/components/discussion/form/CreateEditDiscussionFields.vue";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import type {
  Discussion,
  DiscussionChannel,
  Tag as TagData,
  DiscussionTagsConnectOrCreateFieldInput,
  DiscussionTagsDisconnectFieldInput,
  DiscussionUpdateInput,
  Image,
} from "@/__generated__/graphql";
import { modProfileNameVar } from "@/cache";

export default defineComponent({
  name: "EditDownload",
  components: {
    CreateEditDiscussionFields,
    RequireAuth,
  },
  apollo: {},
  setup() {
    const route = useRoute();
    const router = useRouter();

    const channelId = computed(() => {
      if (typeof route.params.forumId !== "string") {
        return "";
      }
      return route.params.forumId;
    });

    const discussionId = computed(() => {
      if (typeof route.params.discussionId !== "string") {
        return "";
      }
      return route.params.discussionId;
    });

    const {
      result: getDiscussionResult,
      onResult: onGetDiscussionResult,
      loading: getDiscussionLoading,
      error: getDiscussionError,
    } = useQuery(GET_DISCUSSION, {
      id: discussionId,
      loggedInModName: modProfileNameVar.value,
      channelUniqueName: channelId.value,
    });

    const {
      result: getChannelResult,
      loading: getChannelLoading,
      error: getChannelError,
    } = useQuery(GET_CHANNEL, {
      uniqueName: channelId.value,
    });

    const discussion = computed<Discussion>(() => {
      if (getDiscussionError.value || getDiscussionLoading.value) {
        return null;
      }
      return getDiscussionResult.value.discussions[0];
    });

    const channelData = computed(() => {
      if (getChannelError.value || getChannelLoading.value || !getChannelResult.value) {
        return null;
      }
      return getChannelResult.value.channels[0];
    });

    const images = computed(() => {
      if (!discussion.value?.Album?.Images) return [];
      return discussion.value.Album.Images.map((image: Image) => {
        return {
          url: image.url || "",
          alt: image.alt || "",
          caption: image.caption || "",
          isCoverImage: false,
          hasSensitiveContent: false,
          hasSpoiler: false,
          copyright: image.copyright || "",
        };
      });
    });

    const imageOrder = computed<string[]>(() => {
      return (discussion.value.Album?.imageOrder ?? []).filter(
        (imageId): imageId is string => !!imageId
      );
    });

    const orderedImages = computed(() => {
      return imageOrder.value
        .map((imageId) => {
          const image = images.value.find((image) => imageId === image.id);
          return image || null;
        })
        .filter((image): image is NonNullable<typeof image> => image !== null);
    });

    const ownerList = computed(() => {
      if (discussion.value && discussion.value.Author) {
        return [discussion.value.Author.username];
      }
      return [];
    });

    const getDefaultFormValues = (): CreateEditDiscussionFormValues => {
      if (discussion.value) {
        return {
          title: discussion.value.title,
          body: discussion.value?.body || "",
          selectedTags: discussion.value.Tags.map((tag: TagData) => {
            return tag.text;
          }),
          selectedChannels: discussion.value.DiscussionChannels.map(
            (discussionChannel: DiscussionChannel) => {
              return discussionChannel?.Channel?.uniqueName || "";
            }
          ),
          author: discussion.value.Author?.username || "",
          album: {
            images: orderedImages.value,
            imageOrder: imageOrder.value,
          },
          downloadableFiles: discussion.value.DownloadableFiles?.map((file) => ({
            id: file.id || "",
            fileName: file.fileName || "",
            url: file.url || "",
            kind: file.kind || "OTHER",
            size: file.size || 0,
            license: file.license?.id || "",
            priceModel: file.priceModel || "FREE",
            priceCents: file.priceCents || 0,
            priceCurrency: file.priceCurrency || "USD",
          })) || [],
        };
      }
      return {
        title: "",
        body: "",
        selectedTags: [],
        selectedChannels: [],
        author: "",
        album: {
          images: [],
          imageOrder: [],
        },
        downloadableFiles: [],
      };
    };

    const formValues = ref<CreateEditDiscussionFormValues>(
      getDefaultFormValues()
    );

    const dataLoaded = ref(false);

    onGetDiscussionResult((value) => {
      if (value.loading === true) {
        return;
      }
      const discussion = value.data.discussions[0];

      // Set page title and meta tags
      const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME;
      useHead({
        title: `Edit Download | ${channelId.value} | ${serverName}`,
        meta: [
          { name: 'description', content: `Edit download: ${discussion.title}` },
        ],
      });

      // Create a map of valid images with their IDs
      const validImages = (discussion.Album?.Images ?? [])
        .filter((image: Image) => image.id && image.url)
        .map((image: Image) => ({
          id: image.id,
          url: image.url,
          alt: image.alt || "",
          caption: image.caption || "",
          copyright: image.copyright || "",
        }));

      // Filter out any null or undefined values from imageOrder and ensure they exist in images
      const validImageOrder = (discussion.Album?.imageOrder ?? []).filter(
        (id): id is string =>
          typeof id === "string" &&
          id.length > 0 &&
          validImages.some((img) => img.id === id)
      );

      const formFields: CreateEditDiscussionFormValues = {
        title: discussion.title,
        body: discussion.body,
        selectedTags: discussion.Tags.map((tag: TagData) => {
          return tag.text;
        }),
        selectedChannels: discussion.DiscussionChannels.map(
          (discussionChannel: DiscussionChannel) => {
            return discussionChannel?.Channel?.uniqueName;
          }
        ),
        author: discussion.Author.username,
        album: {
          images: validImages,
          imageOrder: validImageOrder,
        },
        downloadableFiles: discussion.DownloadableFiles?.map((file) => ({
          id: file.id || "",
          fileName: file.fileName || "",
          url: file.url || "",
          kind: file.kind || "OTHER",
          size: file.size || 0,
          license: file.license?.id || "",
          priceModel: file.priceModel || "FREE",
          priceCents: file.priceCents || 0,
          priceCurrency: file.priceCurrency || "USD",
        })) || [],
      };
      formValues.value = formFields;
      dataLoaded.value = true;
    });

    // Remember the existing tags so that if the user removes
    // one or more tags, we will know to manually disconnect
    // the nodes in the async call when the discussion is updated.
    const existingTags = computed(() => {
      if (
        getDiscussionLoading.value ||
        getDiscussionError.value ||
        !getDiscussionResult.value.discussions[0].Tags
      ) {
        return [];
      }
      return getDiscussionResult.value.discussions[0].Tags.map(
        (tag: TagData) => {
          return tag.text;
        }
      );
    });

    // Function to get album update input
    const getAlbumUpdateInput = () => {
      const albumData = formValues.value.album;
      if (!albumData || (!albumData.images?.length && !albumData.imageOrder?.length)) {
        return {}; // No album data to update
      }

      const albumId = discussion.value?.Album?.id;
      
      // If the album doesn't exist yet, CREATE it and connect to existing images
      if (!albumId) {
        const newImages = albumData.images || [];
        
        // Filter out images without IDs (shouldn't happen with our new flow)
        const validImages = newImages.filter(img => img.id);
        
        if (validImages.length === 0) {
          return {}; // No valid images to connect
        }
        
        return {
          Album: {
            create: {
              node: {
                imageOrder: albumData.imageOrder || [],
                Images: {
                  connect: validImages.map(img => ({
                    where: { node: { id: img.id } }
                  }))
                },
              },
            },
          },
        };
      }

      // If the album already exists, build the connect/update/delete arrays
      const oldImages = discussion.value?.Album?.Images ?? [];
      const newImages = albumData.images || [];

      // CONNECT array: new images that need to be connected to this album
      const connectImageArray = newImages
        .filter((img) => img.id && !oldImages.some((old) => old.id === img.id))
        .map((img) => ({
          connect: {
            where: { node: { id: img.id } }
          }
        }));

      // UPDATE array: existing images that need updates
      const updateImageArray = newImages
        .filter((img) => img.id && oldImages.some((old) => old.id === img.id))
        .map((img) => ({
          where: { node: { id: img.id } },
          update: {
            node: {
              url: img.url,
              alt: img.alt,
              caption: img.caption,
              copyright: img.copyright,
            },
          },
        }));
        
      // DISCONNECT array: old images that are no longer present
      const disconnectImageArray = oldImages
        .filter((old) => !newImages.some((img) => img.id === old.id))
        .map((old) => ({
          disconnect: {
            where: { node: { id: old.id } },
          },
        }));
        
      // Combine all operations
      const imagesOps = [
        ...connectImageArray,
        ...updateImageArray,
        ...disconnectImageArray,
      ];

      return {
        Album: {
          update: {
            node: {
              imageOrder: albumData.imageOrder || [],
              Images: imagesOps,
            },
          },
        },
      };
    };

    const updateDiscussionInput = computed<DiscussionUpdateInput>(() => {
      const tagConnections: DiscussionTagsConnectOrCreateFieldInput[] =
        formValues.value.selectedTags.map((tag: string) => {
          return {
            onCreate: {
              node: {
                text: tag,
              },
            },
            where: {
              node: {
                text: tag,
              },
            },
          };
        });

      const tagDisconnections: DiscussionTagsDisconnectFieldInput[] =
        existingTags.value
          .filter((tag: string) => {
            return !formValues.value.selectedTags.includes(tag);
          })
          .map((tag: string) => {
            return {
              where: {
                node: {
                  text: tag,
                },
              },
            };
          });

      // Get album update input
      const albumUpdateInput = getAlbumUpdateInput();

      const result: DiscussionUpdateInput = {
        title: formValues.value.title,
        body: formValues.value.body,
        Tags: [
          {
            connectOrCreate: tagConnections,
            disconnect: tagDisconnections,
          },
        ],
        ...albumUpdateInput, // Include album data
      };
      return result;
    });

    const channelConnections = computed(() => {
      return formValues.value.selectedChannels;
    });

    const {
      mutate: updateDiscussion,
      error: updateDiscussionError,
      loading: updateDiscussionLoading,
      onDone,
    } = useMutation(UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS, () => ({
      variables: {
        where: {
          id: discussionId.value,
        },
        updateDiscussionInput: updateDiscussionInput.value,
        channelConnections: channelConnections.value,
        channelDisconnections: discussion.value.DiscussionChannels.filter(
          (dc) => {
            return !channelConnections.value.includes(
              dc.Channel?.uniqueName || ""
            );
          }
        ).map((dc) => {
          return dc.Channel?.uniqueName;
        }),
      },
    }));

    onDone(() => {
      router.push({
        name: "forums-forumId-downloads-discussionId",
        params: {
          forumId: formValues.value.selectedChannels[0],
          discussionId: discussionId.value,
        },
      });
    });

    return {
      channelId,
      channelData,
      dataLoaded,
      discussion,
      discussionId,
      existingTags,
      formValues,
      getDiscussionError,
      getDiscussionLoading,
      ownerList,
      updateDiscussion,
      updateDiscussionError,
      updateDiscussionInput,
      updateDiscussionLoading,
      router,
    };
  },
  methods: {
    async submit() {
      this.updateDiscussion();
    },
    updateFormValues(data: Partial<CreateEditDiscussionFormValues>) {
      const existingValues = this.formValues;
      this.formValues = {
        ...existingValues,
        ...data,
      };
    },
    handleCancel() {
      this.router.push({
        name: "forums-forumId-downloads-discussionId",
        params: {
          forumId: this.formValues.selectedChannels[0],
          discussionId: this.discussionId,
        },
      });
    },
  },
});
</script>
<template>
  <RequireAuth
    :require-ownership="true"
    :owners="ownerList"
    :loading="getDiscussionLoading"
  >
    <template #has-auth>
      <CreateEditDiscussionFields
        :key="dataLoaded.toString()"
        :edit-mode="true"
        :discussion-loading="getDiscussionLoading"
        :get-discussion-error="getDiscussionError"
        :update-discussion-error="updateDiscussionError"
        :form-values="formValues"
        :update-discussion-loading="updateDiscussionLoading"
        :download-mode="true"
        :discussion="discussion"
        :channel-data="channelData"
        @submit="submit"
        @update-form-values="updateFormValues"
        @cancel="handleCancel"
      />
    </template>
    <template #does-not-have-auth>
      <div class="flex justify-center p-8 dark:text-white">
        You do not have permission to see this page.
      </div>
    </template>
  </RequireAuth>
</template>

<style></style>