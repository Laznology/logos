import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";

import GraphView from "~/components/GraphView.vue";

const graph = {
  nodes: [
    { id: "first", slug: "first", title: "First" },
    { id: "third", slug: "third", title: "Third" },
    { id: "active", slug: "active", title: "Active" },
  ],
  edges: [{ source: "active", target: "first" }],
};

describe("GraphView", () => {
  it("places active node at center regardless of input order", async () => {
    const wrapper = await mountSuspended(GraphView, {
      props: { graph, activeSlug: "active" },
    });
    const activeNode = wrapper
      .findAll('g[role="button"]')
      .find((node) => node.attributes("aria-label") === "Open Active");

    expect(activeNode?.attributes("transform")).toBe("translate(360 240)");
  });

  it("moves a node and its connected edge during drag", async () => {
    const wrapper = await mountSuspended(GraphView, {
      props: { graph, activeSlug: "active" },
    });
    const svg = wrapper.find("svg");
    Object.defineProperty(svg.element, "getBoundingClientRect", {
      value: () => new DOMRect(0, 0, 720, 480),
    });
    const firstNode = wrapper
      .findAll('g[role="button"]')
      .find((node) => node.attributes("aria-label") === "Open First");

    await firstNode?.trigger("pointerdown", {
      pointerId: 1,
      clientX: 120,
      clientY: 120,
    });
    await svg.trigger("pointermove", {
      pointerId: 1,
      clientX: 480,
      clientY: 300,
    });
    await svg.trigger("pointerup", {
      pointerId: 1,
      clientX: 480,
      clientY: 300,
    });

    expect(firstNode?.attributes("transform")).toBe("translate(480 300)");
    expect(wrapper.find("line").attributes("x2")).toBe("480");
  });

  it("does not emit selection after drag but emits for click", async () => {
    const dragWrapper = await mountSuspended(GraphView, {
      props: { graph, activeSlug: "active" },
    });
    const svg = dragWrapper.find("svg");
    Object.defineProperty(svg.element, "getBoundingClientRect", {
      value: () => new DOMRect(0, 0, 720, 480),
    });
    const draggedNode = dragWrapper
      .findAll('g[role="button"]')
      .find((node) => node.attributes("aria-label") === "Open First");

    await draggedNode?.trigger("pointerdown", {
      pointerId: 1,
      clientX: 120,
      clientY: 120,
    });
    await svg.trigger("pointermove", {
      pointerId: 1,
      clientX: 480,
      clientY: 300,
    });
    await svg.trigger("pointerup", {
      pointerId: 1,
      clientX: 480,
      clientY: 300,
    });
    await draggedNode?.trigger("click");
    expect(dragWrapper.emitted("select")).toBeUndefined();

    const clickWrapper = await mountSuspended(GraphView, {
      props: { graph, activeSlug: "active" },
    });
    const clickedNode = clickWrapper
      .findAll('g[role="button"]')
      .find((node) => node.attributes("aria-label") === "Open First");

    await clickedNode?.trigger("click");
    expect(clickWrapper.emitted("select")).toEqual([["first"]]);
  });

  it("restores base positions on reset", async () => {
    const wrapper = await mountSuspended(GraphView, {
      props: { graph, activeSlug: "active" },
    });
    const svg = wrapper.find("svg");
    Object.defineProperty(svg.element, "getBoundingClientRect", {
      value: () => new DOMRect(0, 0, 720, 480),
    });
    const firstNode = wrapper
      .findAll('g[role="button"]')
      .find((node) => node.attributes("aria-label") === "Open First");
    const originalTransform = firstNode?.attributes("transform");

    await firstNode?.trigger("pointerdown", {
      pointerId: 1,
      clientX: 120,
      clientY: 120,
    });
    await svg.trigger("pointermove", {
      pointerId: 1,
      clientX: 480,
      clientY: 300,
    });
    await svg.trigger("pointerup", {
      pointerId: 1,
      clientX: 480,
      clientY: 300,
    });
    expect(firstNode?.attributes("transform")).not.toBe(originalTransform);

    await wrapper.find('button[aria-label="Reset graph"]').trigger("click");
    expect(firstNode?.attributes("transform")).toBe(originalTransform);
  });
});

it("keeps node movement aligned in a letterboxed SVG viewport", async () => {
  const wrapper = await mountSuspended(GraphView, {
    props: { graph, activeSlug: "active" },
  });
  const svg = wrapper.find("svg");
  Object.defineProperty(svg.element, "getBoundingClientRect", {
    value: () => new DOMRect(0, 0, 318, 288),
  });
  const firstNode = wrapper
    .findAll('g[role="button"]')
    .find((node) => node.attributes("aria-label") === "Open First");

  await firstNode?.trigger("pointerdown", {
    pointerId: 1,
    clientX: 159,
    clientY: 71.92,
  });
  await svg.trigger("pointermove", {
    pointerId: 1,
    clientX: 212,
    clientY: 170.5,
  });

  expect(firstNode?.attributes("transform")).toBe("translate(480 300)");
});
