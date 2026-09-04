import { describe, expect, it } from "vitest";

import { buildPostGraph } from "../../shared/types/graph";

describe("buildPostGraph", () => {
  it("includes only posts connected by internal links", () => {
    const graph = buildPostGraph([
      { id: "a", slug: "a", title: "A", content: "[[b]]" },
      { id: "b", slug: "b", title: "B", content: "" },
      { id: "c", slug: "c", title: "C", content: "" },
    ]);

    expect(graph.nodes.map((node) => node.slug)).toEqual(["a", "b"]);
    expect(graph.edges).toEqual([{ source: "a", target: "b" }]);
  });
});
