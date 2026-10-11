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
      attachTo: document.body,
    });

    const frame = wrapper.find(".carousel-frame");
    const styles = getComputedStyle(frame.element);

    // happy-dom serializes authored colors as-is (hex/hsl), not rgb().
    expect(styles.backgroundColor).toBe("#0a0a0a");
    expect(styles.color).toBe("#faf8f5");
    // happy-dom omits background-image from both computed style and CSSOM, so
    // read the authored .carousel-frame rule text and assert its noise texture.
    const css = [...document.querySelectorAll("style")]
      .map((style) => style.textContent ?? "")
      .join("\n");
    const frameRule = css.slice(css.indexOf(".carousel-frame"));
    expect(frameRule.slice(0, frameRule.indexOf("}"))).toContain(
      "feTurbulence"
    );
  });
  it("uses the logo and divider in both frame footers", async () => {
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
    ).toBe("hsla(36, 33%, 97%, .18)");
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
      attachTo: document.body,
    });

    expect(wrapper.text()).toContain("Heading");
    expect(wrapper.find('img[src="/images/example.png"]').exists()).toBe(true);
    const heading = wrapper.find(".carousel-content h2");
    expect(heading.exists()).toBe(true);
    expect(getComputedStyle(heading.element).fontWeight).toBe("700");
  });
});
