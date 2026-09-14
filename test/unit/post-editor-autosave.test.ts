import { useDebounceFn } from "@vueuse/core";
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
  vi.stubGlobal("useDebounceFn", useDebounceFn);
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
  it("V1 saves one pasted snapshot while its first request is pending", async () => {
    vi.useFakeTimers();
    const firstSave = Promise.withResolvers<unknown>();
    mocks.fetch.mockReturnValueOnce(firstSave.promise);

    const { post, performAutoSave } = usePostEditor();
    post.value.content = "# Pasted markdown";
    void performAutoSave();
    await vi.advanceTimersByTimeAsync(1000);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);

    void performAutoSave();
    void performAutoSave();
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
    await vi.advanceTimersByTimeAsync(1000);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
});
