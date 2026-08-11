import { pageTable } from "@nuxthub/db/schema";
import {
  createInsertSchema,
  createUpdateSchema,
  createSelectSchema,
} from "drizzle-orm/valibot";
import * as v from "valibot";

export const selectPageSchema = createSelectSchema(pageTable);
export const insertPageSchema = createInsertSchema(pageTable, {
  title: v.pipe(v.string(), v.minLength(1, "Title cannot be empty")),
});
export const updatePageSchema = createUpdateSchema(pageTable);

export const pageParamIdSchema = v.uuid();

export type PageSelectType = v.InferOutput<typeof selectPageSchema>;
export type PageInsertType = v.InferOutput<typeof insertPageSchema>;
export type PageUpdateType = v.InferOutput<typeof updatePageSchema>;
