import { postTable } from "@nuxthub/db/schema";
import {
  createInsertSchema,
  createUpdateSchema,
  createSelectSchema,
} from "drizzle-orm/valibot";
import * as v from "valibot";

export const selectPostSchema = createSelectSchema(postTable);
export const insertPostSchema = createInsertSchema(postTable, {
  title: v.pipe(v.string(), v.minLength(1, "Title cannot be empty")),
});

export const postWithAuthorSchema = v.intersect([
  selectPostSchema,
  v.object({
    author: v.object({
      name: v.nullable(v.string()),
      avatar: v.nullable(v.string()),
    }),
  }),
]);

export const postListItemSchema = v.intersect([
  v.omit(selectPostSchema, ["content"]),
  v.object({
    author: v.object({
      id: v.nullable(v.string()),
      name: v.nullable(v.string()),
      avatar: v.nullable(v.string()),
    }),
  }),
]);

export const listPostSchema = v.array(postListItemSchema);

export const postSearchItemSchema = v.intersect([
  postListItemSchema,
  v.object({
    snippet: v.string(),
  }),
]);
export const searchPostSchema = v.array(postSearchItemSchema);

export const apiCreatePostSchema = v.omit(insertPostSchema, [
  "slug",
  "id",
  "createdAt",
  "updatedAt",
  "userId",
]);
export const updatePostSchema = createUpdateSchema(postTable);

export const postParamIdSchema = v.uuid();

export type PostSelectType = v.InferOutput<typeof selectPostSchema>;
export type PostInsertType = v.InferOutput<typeof insertPostSchema>;
export type PostUpdateType = v.InferOutput<typeof updatePostSchema>;

export type PostWithAuthorType = v.InferOutput<typeof postWithAuthorSchema>;
export type PostListType = v.InferOutput<typeof listPostSchema>;
export type PostSearchItemType = v.InferOutput<typeof postSearchItemSchema>;
export type PostSearchListType = v.InferOutput<typeof searchPostSchema>;
