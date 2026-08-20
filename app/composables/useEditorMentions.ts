import type { EditorMentionMenuItem } from "@nuxt/ui";

export interface MentionUser {
  name: string;
  color?: string;
  avatar?: string;
}

const FALLBACK_USERS: EditorMentionMenuItem[] = [
  {
    avatar: { src: "https://avatars.githubusercontent.com/u/739984?v=4" },
    label: "benjamincanac",
  },
  {
    avatar: { src: "https://avatars.githubusercontent.com/u/904724?v=4" },
    label: "atinux",
  },
  {
    avatar: { src: "https://avatars.githubusercontent.com/u/71938701?v=4" },
    label: "HugoRCD",
  },
];

export function useEditorMentions(users?: Ref<MentionUser[]>) {
  const items = computed<EditorMentionMenuItem[]>(() => {
    if (!users?.value?.length) {
      return FALLBACK_USERS;
    }

    return users.value.map((user) => ({
      avatar: user.avatar
        ? { src: user.avatar }
        : {
            alt: user.name,
            style: user.color ? { color: user.color } : undefined,
          },
      label: user.name,
    }));
  });

  return {
    items,
  };
}
