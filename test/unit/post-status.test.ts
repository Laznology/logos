import * as v from "valibot";
import { describe, expect, it } from "vitest";

import {
  bulkPostActionSchema,
  postStatus,
  setPostStatus,
} from "../../shared/types/post-status";

describe("post status", () => {
  it("recognizes draft, published, private, and archive", () => {
    expect(postStatus({ metadata: { status: "draft" } })).toBe("draft");
    expect(postStatus({ metadata: { status: "published" } })).toBe("published");
    expect(postStatus({ metadata: { status: "private" } })).toBe("private");
    expect(postStatus({ metadata: { status: "archive" } })).toBe("archive");
  });

  it("falls back to draft for missing or unknown metadata", () => {
    expect(postStatus({ metadata: null })).toBe("draft");
    expect(postStatus({ metadata: { status: "unknown" } })).toBe("draft");
  });

  it("changes status without dropping existing metadata", () => {
    expect(
      setPostStatus({ tags: ["essay"], status: "draft" }, "private")
    ).toEqual({
      tags: ["essay"],
      status: "private",
    });
  });
});

describe("bulk post actions", () => {
  it("accepts status actions and delete for non-empty ids", () => {
    for (const action of ["published", "private", "archive", "delete"]) {
      expect(
        v.safeParse(bulkPostActionSchema, { ids: ["post-1"], action }).success
      ).toBe(true);
    }
  });

  it("rejects empty ids and unsupported actions", () => {
    expect(
      v.safeParse(bulkPostActionSchema, { ids: [], action: "archive" }).success
    ).toBe(false);
    expect(
      v.safeParse(bulkPostActionSchema, { ids: ["post-1"], action: "draft" })
        .success
    ).toBe(false);
  });
});
