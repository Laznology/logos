import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import {
  createCarouselZip,
  renderCarouselFrames,
} from "../../server/utils/carousel-export";

describe("carousel ZIP export", () => {
  it("keeps stable PNG names and bytes", () => {
    const zip = createCarouselZip([
      { name: "cover.png", data: new Uint8Array([1, 2]) },
      { name: "slide-01.png", data: new Uint8Array([3, 4]) },
    ]);
    const files = unzipSync(zip);

    expect(Object.keys(files)).toEqual(["cover.png", "slide-01.png"]);
    expect([...files["slide-01.png"]]).toEqual([3, 4]);
  });

  it("renders a fixed-size PNG frame", async () => {
    const [png] = await renderCarouselFrames(
      [{ kind: "cover", title: "Render me" }],
      ""
    );

    expect([...png.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });
});
