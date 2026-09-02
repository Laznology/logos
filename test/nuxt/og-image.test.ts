import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";

import Publication from "~/components/OgImage/Publication.takumi.vue";

describe("Publication OG image", () => {
  it("renders the supplied post context", async () => {
    const card = await mountSuspended(Publication, {
      props: {
        title: "Rendering at the edge",
        description: "A card rendered by Takumi.",
        author: "Logos Publication",
        publishedAt: "March 2026",
      },
    });

    expect(card.text()).toContain("Rendering at the edge");
    expect(card.text()).toContain("A card rendered by Takumi.");
    expect(card.text()).toContain("Logos Publication");
    expect(card.text()).toContain("March 2026");
    expect(card.find(".og-icon-wrapper").exists()).toBe(true);
    expect(card.find("svg.og-icon").exists()).toBe(true);
  });

  it("renders with default props without requiring title or description", async () => {
    const card = await mountSuspended(Publication);

    expect(card.text()).toContain("Logos Publication");
    expect(card.text()).toContain(
      "A clean, distraction-free space for essays, stories, and ideas."
    );
  });
});
