import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref, watchEffect } from "vue";

import { usePostEditor } from "../../app/composables/usePostEditor";

const mocks = {
  fetch: vi.fn(),
  refresh: vi.fn(),
  route: { params: { slug: "untitled" } },
  router: { replace: vi.fn() },
};

beforeEach(() => {
  vi.stubGlobal("computed", computed);
  vi.stubGlobal("ref", ref);
  vi.stubGlobal("watchEffect", watchEffect);
  vi.stubGlobal("useAsyncData", () => ({
    data: { value: null },
    error: { value: null },
    pending: { value: false },
  }));
  vi.stubGlobal("useNuxtApp", () => ({ $csrfFetch: mocks.fetch }));
  vi.stubGlobal("useRequestFetch", () => vi.fn());
  vi.stubGlobal("useRoute", () => mocks.route);
  vi.stubGlobal("useRouter", () => mocks.router);
  vi.stubGlobal("refreshNuxtData", mocks.refresh);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("post editor autosave", () => {
  it("V1 coalesces identical snapshots while a save is pending", async () => {
    vi.useFakeTimers();
    const firstSave = Promise.withResolvers<unknown>();
    mocks.fetch.mockReturnValueOnce(firstSave.promise);

    const { post, performAutoSave } = usePostEditor();
    post.value.content = "# Pasted markdown";
    performAutoSave();
    expect(mocks.fetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(600);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);

    performAutoSave();
    performAutoSave();
    await vi.advanceTimersByTimeAsync(1000);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);

    firstSave.resolve({
      data: {
        id: "post-id",
        slug: "pasted-markdown",
        metadata: { status: "draft" },
        updatedAt: new Date(),
      },
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });

  it("V2 preserves edits made while an earlier save is in flight", async () => {
    vi.useFakeTimers();
    const firstSave = Promise.withResolvers<unknown>();
    const secondSave = Promise.withResolvers<unknown>();
    mocks.fetch
      .mockReturnValueOnce(firstSave.promise)
      .mockReturnValueOnce(secondSave.promise);

    const { post, performAutoSave } = usePostEditor();
    post.value.id = "post-id";
    post.value.slug = "existing-post";
    post.value.content = "first paste";
    performAutoSave();
    expect(mocks.fetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(600);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);

    post.value.content = "second paste";
    performAutoSave();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(600);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);

    firstSave.resolve({
      data: {
        id: "post-id",
        title: "Untitled",
        slug: "existing-post",
        content: "first paste",
        metadata: { status: "draft" },
        updatedAt: new Date(),
      },
    });
    await vi.advanceTimersByTimeAsync(0);

    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.fetch.mock.calls[1]?.[1].body.content).toBe("second paste");

    secondSave.resolve({
      data: {
        id: "post-id",
        title: "Untitled",
        slug: "existing-post",
        content: "second paste",
        metadata: { status: "draft" },
        updatedAt: new Date(),
      },
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(post.value.content).toBe("second paste");
  });

  it("V3 saves the final title once after rapid typing stops", async () => {
    vi.useFakeTimers();
    mocks.fetch.mockResolvedValue({
      data: {
        id: "post-id",
        title: "Final title",
        slug: "existing-post",
        content: "",
        metadata: { status: "draft" },
        updatedAt: new Date(),
      },
    });

    const { post, performAutoSave } = usePostEditor();
    post.value.id = "post-id";
    post.value.slug = "existing-post";
    post.value.title = "F";
    performAutoSave();
    await vi.advanceTimersByTimeAsync(300);

    post.value.title = "Final title";
    performAutoSave();
    await vi.advanceTimersByTimeAsync(599);
    expect(mocks.fetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.fetch.mock.calls[0]?.[1].body.title).toBe("Final title");
  });
});
