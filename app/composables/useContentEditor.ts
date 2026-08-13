type SavingStatus = "idle" | "saving" | "saved" | "error";

const route = useRoute();
const router = useRouter();

const { $csrfFetch } = useNuxtApp();

export const useContentEditor = () => {
  const savingStatus = ref<SavingStatus>("idle");
  const slug = computed(() => route.params.slug as string);
  const isNew = computed(() => slug.value === "untitled");
  const {
    data: page,
    error,
    pending,
  } = useCsrfFetch<PageSelectType>(`/api/pages/${slug.value}`, {
    immediate: !isNew.value,
    default: () =>
      ({
        title: "untitled",
        content: undefined,
      }) as unknown as PageSelectType,
  });

  const performAutoSave = useDebounceFn(async () => {
    if (!page.value) {
      return;
    }
    savingStatus.value = "saving";
    try {
      if (isNew.value) {
        const response = await $csrfFetch<{
          success: boolean;
          data: PageSelectType;
        }>("/api/pages", {
          method: "POST",
          body: {
            title: page.value.title,
            content: page.value.content,
          },
        });

        const newSlug = response.data.slug;

        router.replace({ params: { slug: newSlug } });
      } else {
        await $csrfFetch<PageUpdateType>(`/api/pages/${slug.value}`, {
          method: "PUT",
          body: {
            title: page.value.title,
            content: page.value.content,
          },
        });
      }

      savingStatus.value = "saved";
    } catch (error) {
      savingStatus.value = "error";
      console.error("Gagal autosave:", error);
    }
  }, 1000);

  return {
    page,
    performAutoSave,
    pending,
    error,
    savingStatus,
  };
};
