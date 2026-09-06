import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";

import CarouselTemplate from "~/components/editor/CarouselTemplate.vue";

describe("CarouselTemplate", () => {
  it("renders the title cover at the fixed ratio", async () => {
    const wrapper = await mountSuspended(CarouselTemplate, {
      props: {
        frame: { kind: "cover", title: "A useful idea" },
      },
    });

    expect(wrapper.text()).toContain("A useful idea");
    expect(wrapper.find('[data-carousel-frame="cover"]').exists()).toBe(true);
  });

  it("renders rich body content and media", async () => {
    const wrapper = await mountSuspended(CarouselTemplate, {
      props: {
        frame: {
          kind: "slide",
          index: 1,
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Heading" }],
            },
            {
              type: "image",
              attrs: { src: "/images/example.png", alt: "Example" },
            },
          ],
        },
      },
    });

    expect(wrapper.text()).toContain("Heading");
    expect(wrapper.find('img[src="/images/example.png"]').exists()).toBe(true);
  });
});
