<script lang="ts">
  import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
  import { UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/discussion/mutations";
  import { defineComponent, computed, ref } from "vue";
  import { useRouter, useRoute } from "nuxt/app";
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
    name: "EditDiscussion",
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

      const discussion = computed<Discussion>(() => {
        if (getDiscussionError.value || getDiscussionLoading.value) {
          return null;
        }
        return getDiscussionResult.value.discussions[0];
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
              imageOrder: imageOrder.value, // Add imageOrder
            },
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
            imageOrder: [], // Add empty imageOrder
          },
        };
      };

      const formValues = ref<CreateEditDiscussionFormValues>(getDefaultFormValues());

      const dataLoaded = ref(false);

      onGetDiscussionResult((value) => {
        if (value.loading === true) {
          return;
        }
        const discussion = value.data.discussions[0];

        // Create a map of valid images with their IDs
        const validImages = (discussion.Album?.Images ?? [])
          .filter((image: Image) => image.id && image.url) // Only include images with valid IDs and URLs
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
            typeof id === "string" && id.length > 0 && validImages.some((img) => img.id === id)
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
            imageOrder: validImageOrder, // Add the validated imageOrder
          },
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
        return getDiscussionResult.value.discussions[0].Tags.map((tag: TagData) => {
          return tag.text;
        });
      });

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

        const tagDisconnections: DiscussionTagsDisconnectFieldInput[] = existingTags.value
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

        const result: DiscussionUpdateInput = {
          title: formValues.value.title,
          body: formValues.value.body,
          Tags: [
            {
              connectOrCreate: tagConnections,
              disconnect: tagDisconnections,
            },
          ],
        };
        return result;
      });

      const channelConnections = computed(() => {
        // Keep track of what channels were added so that we can
        // connect the relevant DiscussionChannel nodes to the discussion.
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
          channelDisconnections: discussion.value.DiscussionChannels.filter((dc) => {
            return !channelConnections.value.includes(dc.Channel?.uniqueName || "");
          }).map((dc) => {
            return dc.Channel?.uniqueName;
          }),
        },
      }));

      onDone(() => {
        router.push({
          name: "forums-forumId-discussions-discussionId",
          params: {
            forumId: formValues.value.selectedChannels[0],
            discussionId: discussionId.value,
          },
        });
      });

      return {
        channelId,
        dataLoaded,
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
      updateFormValues(data: CreateEditDiscussionFormValues) {
        const existingValues = this.formValues;
        this.formValues = {
          ...existingValues,
          ...data,
        };
      },
    },
  });
</script>
<template>
  <RequireAuth
    :loading="getDiscussionLoading"
    :owners="ownerList"
    :require-ownership="true"
  >
    {{ formValues }}
    <template #has-auth>
      <CreateEditDiscussionFields
        :key="dataLoaded.toString()"
        :discussion-loading="getDiscussionLoading"
        :edit-mode="true"
        :form-values="formValues"
        :get-discussion-error="getDiscussionError"
        :update-discussion-error="updateDiscussionError"
        :update-discussion-loading="updateDiscussionLoading"
        @submit="submit"
        @update-form-values="updateFormValues"
      />
    </template>
    <template #does-not-have-auth>
      <div class="flex justify-center p-8 dark:text-white">
        You don't have permission to see this page.
      </div>
    </template>
  </RequireAuth>
</template>

<style></style>
