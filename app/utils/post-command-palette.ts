export interface PalettePost {
  id: string;
  title: string;
  slug: string;
  metadata: unknown;
  createdAt: Date | string;
  author: {
    id?: string | null;
    name: string | null;
    avatar: string | null;
  };
}

interface PaletteFilters {
  query: string;
  titleOnly: boolean;
  status: "all" | "draft" | "published";
  authorId: string;
}

export function postStatus(post: PalettePost): "draft" | "published" {
  const metadata = post.metadata as Record<string, unknown> | null;
  return metadata?.status === "published" ? "published" : "draft";
}

export function filterPalettePosts<T extends PalettePost>(
  posts: T[],
  filters: PaletteFilters
): T[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return posts
    .filter((post) => {
      if (
        filters.status !== "all" &&
        postStatus(post) !== filters.status
      ) {
        return false;
      }
      if (filters.authorId && post.author.id !== filters.authorId) {
        return false;
      }
      return (
        !filters.titleOnly ||
        !query ||
        post.title.toLocaleLowerCase().includes(query)
      );
    })
    .slice(0, 20);
}

export function groupPostsByDate<T extends PalettePost>(
  posts: T[],
  now = new Date()
): { id: string; label: string; items: T[] }[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const groups = [
    { id: "today", label: "Today", items: [] as T[] },
    { id: "yesterday", label: "Yesterday", items: [] as T[] },
    { id: "past-week", label: "Past week", items: [] as T[] },
    { id: "older", label: "Older", items: [] as T[] },
  ];

  for (const post of posts) {
    const createdAt = new Date(post.createdAt);
    const date = new Date(
      createdAt.getFullYear(),
      createdAt.getMonth(),
      createdAt.getDate()
    );
    const days = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
    let groupIndex = 3;
    if (days <= 0) {
      groupIndex = 0;
    } else if (days === 1) {
      groupIndex = 1;
    } else if (days <= 7) {
      groupIndex = 2;
    }
    groups[groupIndex]!.items.push(post);
  }

  return groups.filter((group) => group.items.length > 0);
}

export function postHref(post: PalettePost): string {
  return postStatus(post) === "published"
    ? `/posts/${post.slug}`
    : `/admin/posts/${post.slug}`;
}
