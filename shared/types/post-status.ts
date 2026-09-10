import * as v from "valibot";

export const POST_STATUS_VALUES = [
  "draft",
  "published",
  "private",
  "archive",
] as const;
export type PostStatus = (typeof POST_STATUS_VALUES)[number];

export const POST_BULK_ACTION_VALUES = [
  "published",
  "private",
  "archive",
  "delete",
] as const;
export type PostBulkAction = (typeof POST_BULK_ACTION_VALUES)[number];

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  published: "Published",
  private: "Private",
  archive: "Archive",
};

export const postStatusSchema = v.picklist(POST_STATUS_VALUES);
export const bulkPostActionSchema = v.object({
  ids: v.pipe(
    v.array(v.pipe(v.string(), v.minLength(1))),
    v.minLength(1),
    v.maxLength(100)
  ),
  action: v.picklist(POST_BULK_ACTION_VALUES),
});

export function postStatus(post: { metadata?: unknown | null }): PostStatus {
  const metadata = post.metadata;
  const value =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>).status
      : undefined;
  return POST_STATUS_VALUES.includes(value as PostStatus)
    ? (value as PostStatus)
    : "draft";
}

export function setPostStatus(
  metadata: unknown,
  status: PostStatus
): Record<string, unknown> {
  const current =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};
  return { ...current, status };
}
