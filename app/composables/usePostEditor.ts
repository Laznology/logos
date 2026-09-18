type SavingStatus = "idle" | "saving" | "saved" | "error";

interface PostApiResponse {
  success: boolean;
  data: PostSelectType;
}

interface SavePayload {
  title: string;
  content: PostSelectType["content"];
  metadata: PostSelectType["metadata"];
}

interface SaveRequest {
  payload: SavePayload;
  snapshot: string;
}

type AutoSave = (() => void) & {
  flush: () => Promise<void>;
};

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
  let savedSnapshot: string | undefined;
  let pendingSave: SaveRequest | undefined;
  let activeSave: SaveRequest | undefined;
  let saveInFlight: Promise<void> | undefined;
  let autoSaveTimer: ReturnType<typeof setTimeout> | undefined;
  let hydratedPostId: string | undefined;

  const {
    data: postData,
    error,
    pending,
  } = useAsyncData<PostApiResponse>(
    `studio-post-editor-${slug.value}`,
    () => requestFetch<PostApiResponse>(`/api/posts/${slug.value}`),
    {
      immediate: !isNew.value,
      watch: [slug],
    }
  );

  const captureSaveRequest = (): SaveRequest => {
    const payload: SavePayload = {
      title: post.value.title || "Untitled",
      content: post.value.content,
      metadata: post.value.metadata,
    };
    return { payload, snapshot: JSON.stringify(payload) };
  };

  watchEffect(() => {
    const incomingPost = postData.value?.data;
    if (!incomingPost || incomingPost.id === hydratedPostId) {
      return;
    }
    post.value = { ...incomingPost };
    savedSnapshot = captureSaveRequest().snapshot;
    pendingSave = undefined;
    hydratedPostId = incomingPost.id;
  });

  const flushPendingSaves = async (): Promise<void> => {
    if (saveInFlight) {
      await saveInFlight;
      if (pendingSave && savingStatus.value !== "error") {
        await flushPendingSaves();
      }
      return;
    }

    const nextSave = pendingSave;
    if (!nextSave) {
      return;
    }

    pendingSave = undefined;
    activeSave = nextSave;
    savingStatus.value = "saving";
    let saved = false;

    saveInFlight = (async () => {
      try {
        if (post.value.id) {
          const requestSlug = post.value.slug;
          const response = await $csrfFetch<PostApiResponse>(
            `/api/posts/${requestSlug}`,
            {
              method: "PUT",
              body: nextSave.payload,
            }
          );

          if (response?.data) {
            const localSnapshot = captureSaveRequest().snapshot;
            const listsNeedRefresh =
              response.data.title !== nextSave.payload.title ||
              response.data.slug !== requestSlug;
            post.value.id = response.data.id;
            post.value.updatedAt = response.data.updatedAt;
            if (
              localSnapshot === nextSave.snapshot &&
              response.data.metadata !== undefined
            ) {
              post.value.metadata = response.data.metadata;
            }
            if (
              response.data.slug &&
              response.data.slug !== slug.value &&
              import.meta.client
            ) {
              post.value.slug = response.data.slug;
              useRouter().replace(`/studio/posts/${response.data.slug}`);
            }
            if (listsNeedRefresh) {
              refreshNuxtData("studio-sidebar-posts");
              refreshNuxtData("studio-posts-list-page");
              refreshNuxtData("studio-command-palette-posts");
            }
          }
        } else {
          const response = await $csrfFetch<PostApiResponse>("/api/posts", {
            method: "POST",
            body: nextSave.payload,
          });

          if (response?.data) {
            const localSnapshot = captureSaveRequest().snapshot;
            post.value.id = response.data.id;
            post.value.slug = response.data.slug;
            post.value.updatedAt = response.data.updatedAt;
            if (
              localSnapshot === nextSave.snapshot &&
              response.data.metadata !== undefined
            ) {
              post.value.metadata = response.data.metadata;
            }
            if (
              response.data.slug &&
              response.data.slug !== slug.value &&
              import.meta.client
            ) {
              useRouter().replace(`/studio/posts/${response.data.slug}`);
            }
            refreshNuxtData("studio-sidebar-posts");
            refreshNuxtData("studio-posts-list-page");
            refreshNuxtData("studio-command-palette-posts");
          }
        }
        savedSnapshot = nextSave.snapshot;
        savingStatus.value = "saved";
        saved = true;
      } catch {
        pendingSave ??= nextSave;
        savingStatus.value = "error";
      } finally {
        activeSave = undefined;
        saveInFlight = undefined;
      }
    })();

    await saveInFlight;
    if (saved && pendingSave) {
      await flushPendingSaves();
    }
  };

  const queueCurrentSave = () => {
    const nextSave = captureSaveRequest();

    if (nextSave.snapshot === savedSnapshot) {
      return;
    }
    if (nextSave.snapshot === activeSave?.snapshot) {
      return;
    }
    if (nextSave.snapshot === pendingSave?.snapshot) {
      if (savingStatus.value === "error") {
        void flushPendingSaves();
      }
      return;
    }

    pendingSave = nextSave;
    void flushPendingSaves();
  };

  const scheduleAutoSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    autoSaveTimer = setTimeout(() => {
      autoSaveTimer = undefined;
      queueCurrentSave();
    }, 600);
  };

  const cancelScheduledAutoSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = undefined;
    }
  };

  const performAutoSave = (() => {
    scheduleAutoSave();
  }) as AutoSave;

  performAutoSave.flush = async () => {
    cancelScheduledAutoSave();
    queueCurrentSave();
    await flushPendingSaves();
  };

  const savePost = async (metadata: PostSelectType["metadata"]) => {
    post.value.metadata = metadata;
    await performAutoSave.flush();
    if (savingStatus.value === "error") {
      throw new Error("Failed to save post");
    }
  };

  return {
    post,
    performAutoSave,
    savePost,
    pending,
    error,
    savingStatus,
  };
};
