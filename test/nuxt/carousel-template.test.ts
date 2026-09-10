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
  it("uses the noctarian dark textured treatment", async () => {
    const wrapper = await mountSuspended(CarouselTemplate, {
      props: {
        frame: { kind: "cover", title: "A useful idea" },
      },
    });

    const frame = wrapper.find(".carousel-frame");
    const styles = getComputedStyle(frame.element);

    expect(styles.backgroundColor).toBe("rgb(10, 10, 10)");
    expect(styles.color).toBe("rgb(250, 248, 245)");
    expect(styles.backgroundImage).toContain("data:image/svg+xml");
  });
  it("uses the logo and divider in both frame footers", async () => {
    const cover = await mountSuspended(CarouselTemplate, {
      props: {
        frame: { kind: "cover", title: "A useful idea" },
      },
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
    });

    expect(cover.find(".carousel-cover-footer").text()).not.toContain(
      "Carousel"
    );
    expect(
      cover
        .find('.carousel-cover-footer img[src="/noctarian-logo.png"]')
        .exists()
    ).toBe(true);
    expect(
      slide
        .find('.carousel-slide-footer img[src="/noctarian-logo.png"]')
        .exists()
    ).toBe(true);
    expect(
      getComputedStyle(cover.find(".carousel-cover-footer").element)
        .borderTopWidth
    ).toBe("1px");
    expect(
      getComputedStyle(slide.find(".carousel-slide-footer").element)
        .borderTopWidth
    ).toBe("1px");
    expect(
      getComputedStyle(slide.find(".carousel-slide-footer").element).width
    ).toBe("auto");
    expect(
      getComputedStyle(slide.find(".carousel-slide-footer").element)
        .borderTopColor
    ).toBe("rgba(250, 248, 245, 0.18)");
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
    const heading = wrapper.find(".carousel-content h2");
    expect(heading.exists()).toBe(true);
    expect(getComputedStyle(heading.element).fontWeight).toBe("700");
  });
});
