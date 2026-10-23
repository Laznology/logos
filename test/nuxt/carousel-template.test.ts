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
  it("uses the white Space Grotesk and Mono treatment", async () => {
    const wrapper = await mountSuspended(CarouselTemplate, {
      props: {
        frame: { kind: "cover", title: "A useful idea" },
      },
      attachTo: document.body,
    });

    const frame = wrapper.find(".carousel-frame");
    const styles = getComputedStyle(frame.element);

    // happy-dom resolves the custom property and serializes #ffffff as #fff.
    expect(styles.backgroundColor).toBe("#fff");
    expect(styles.color).toBe("#151515");

    const css = [...document.querySelectorAll("style")]
      .map((style) => style.textContent ?? "")
      .join("\n");
    expect(css).toContain("Space Grotesk");
    expect(css).toContain("Space Mono");
  });
  it("renders the brand footer and page numbering", async () => {
    const cover = await mountSuspended(CarouselTemplate, {
      props: {
        frame: { kind: "cover", title: "A useful idea" },
      },
      attachTo: document.body,
    });
    const slide = await mountSuspended(CarouselTemplate, {
      props: {
        frame: {
          kind: "slide",
          index: 2,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Slide body" }],
            },
          ],
        },
      },
      attachTo: document.body,
    });

    expect(cover.find(".carousel-logo").attributes("src")).toBe("/AppLogo.png");
    expect(cover.find(".carousel-footer").text()).toContain("pisah.in");
    expect(cover.find(".carousel-footer").text()).toContain("01_");
    expect(slide.find(".carousel-footer").text()).toContain("03_");
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
            {
              type: "table",
              content: [
                {
                  type: "tableRow",
                  content: [
                    {
                      type: "tableHeader",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Feature" }],
                        },
                      ],
                    },
                    {
                      type: "tableHeader",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Status" }],
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "tableRow",
                  content: [
                    {
                      type: "tableCell",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Table" }],
                        },
                      ],
                    },
                    {
                      type: "tableCell",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "Ready" }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      attachTo: document.body,
    });

    expect(wrapper.text()).toContain("Heading");
    expect(wrapper.find('img[src="/images/example.png"]').exists()).toBe(true);
    expect(wrapper.find(".carousel-content table").exists()).toBe(true);
    expect(
      wrapper.findAll(".carousel-content th").map((th) => th.text())
    ).toEqual(["Feature", "Status"]);
    const heading = wrapper.find(".carousel-content h2");
    expect(heading.exists()).toBe(true);
    expect(getComputedStyle(heading.element).fontWeight).toBe("700");
  });
});
