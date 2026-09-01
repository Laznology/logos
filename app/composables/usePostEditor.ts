type SavingStatus = "idle" | "saving" | "saved" | "error";

interface PostApiResponse {
  success: boolean;
  data: PostSelectType;
}

export const usePostEditor = () => {
  const route = useRoute();
  const savingStatus = ref<SavingStatus>("idle");
  const slug = computed(() => (route.params.slug as string) || "untitled");
  const isNew = computed(() => !slug.value || slug.value === "untitled");

  const post = ref<PostSelectType>({
    id: "",
    userId: "",
    title: "",
    slug: "untitled",
    metadata: { status: "draft" },
    content: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const { $csrfFetch } = useNuxtApp();
  const requestFetch = useRequestFetch();

  const {
    data: postData,
    error,
    pending,
  } = useAsyncData<PostApiResponse>(
    `admin-post-editor-${slug.value}`,
    () => requestFetch<PostApiResponse>(`/api/posts/${slug.value}`),
    {
      immediate: !isNew.value,
      watch: [slug],
    }
  );

  watchEffect(() => {
    if (postData.value?.data) {
      post.value = { ...postData.value.data };
    }
  });

  const performAutoSave = useDebounceFn(async () => {
    if (!post.value) {
      return;
    }
    savingStatus.value = "saving";
    try {
      if (isNew.value) {
        const response = await $csrfFetch<PostApiResponse>("/api/posts", {
          method: "POST",
          body: {
            title: post.value.title || "Untitled",
            content: post.value.content,
          },
        });

        if (response?.data) {
          post.value.id = response.data.id;
          post.value.slug = response.data.slug;
          post.value.metadata = response.data.metadata;
          post.value.updatedAt = response.data.updatedAt;
          if (
            response.data.slug &&
            response.data.slug !== slug.value &&
            import.meta.client
          ) {
            useRouter().replace(`/admin/posts/${response.data.slug}`);
          }
          refreshNuxtData("admin-sidebar-posts");
          refreshNuxtData("admin-posts-list-page");
          refreshNuxtData("admin-command-palette-posts");
        }
      } else {
        const previousTitle = postData.value?.data.title;
        const previousSlug = postData.value?.data.slug;
        const response = await $csrfFetch<PostApiResponse>(
          `/api/posts/${slug.value}`,
          {
            method: "PUT",
            body: {
              title: post.value.title || "Untitled",
              content: post.value.content,
            },
          }
        );
        if (response?.data) {
          const listsNeedRefresh =
            response.data.title !== previousTitle ||
            response.data.slug !== previousSlug;
          postData.value = response;
          post.value.id = response.data.id;
          post.value.metadata = response.data.metadata;
          post.value.updatedAt = response.data.updatedAt;
          if (
            response.data.slug &&
            response.data.slug !== slug.value &&
            import.meta.client
          ) {
            post.value.slug = response.data.slug;
            useRouter().replace(`/admin/posts/${response.data.slug}`);
          }
          if (listsNeedRefresh) {
            refreshNuxtData("admin-sidebar-posts");
            refreshNuxtData("admin-posts-list-page");
            refreshNuxtData("admin-command-palette-posts");
          }
        }
      }
      savingStatus.value = "saved";
    } catch {
      savingStatus.value = "error";
    }
  }, 1000);

  return {
    post,
    performAutoSave,
    pending,
    error,
    savingStatus,
  };
};
