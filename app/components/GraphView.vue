<script setup lang="ts">
import type { GraphNode, PostGraph } from "#shared/types/graph";

const { graph, activeSlug = "" } = defineProps<{
  graph: PostGraph;
  activeSlug?: string;
}>();
const emit = defineEmits<{ select: [slug: string] }>();
const width = 720;
const height = 480;
const graphSvg = useTemplateRef<SVGSVGElement>("graphSvg");
const {
  left: graphLeft,
  top: graphTop,
  width: graphWidth,
  height: graphHeight,
  update: updateGraphBounds,
} = useElementBounding(graphSvg, { immediate: false });

const view = reactive({ x: 0, y: 0, scale: 1 });

interface Point {
  x: number;
  y: number;
}

type DragKind = "canvas" | "node" | null;

const nodePositions = reactive(new Map<string, Point>());
const drag = reactive({
  kind: null as DragKind,
  nodeId: undefined as string | undefined,
  x: 0,
  y: 0,
  originX: 0,
  originY: 0,
  moved: false,
});
const center: Point = { x: width / 2, y: height / 2 };
const basePositions = computed(() => {
  const result = new Map<string, Point>();
  const active =
    graph.nodes.find((node) => node.slug === activeSlug) ?? graph.nodes[0];
  if (!active) {
    return result;
  }
  result.set(active.id, center);
  const otherNodes = graph.nodes.filter((node) => node.id !== active.id);
  const radius = Math.min(width, height) * 0.34;
  otherNodes.forEach((node, index) => {
    const angle = (index / otherNodes.length) * Math.PI * 2 - Math.PI / 2;
    result.set(node.id, {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  });
  return result;
});
const positions = computed(() => {
  const result = new Map(basePositions.value);
  nodePositions.forEach((point, nodeId) => result.set(nodeId, point));
  return result;
});
const edgePoints = computed(() =>
  graph.edges.flatMap((edge) => {
    const sourcePoint = positions.value.get(edge.source);
    const targetPoint = positions.value.get(edge.target);
    return sourcePoint && targetPoint
      ? [{ ...edge, sourcePoint, targetPoint }]
      : [];
  })
);
const zoom = (amount: number) => {
  view.scale = Math.min(2.5, Math.max(0.55, view.scale + amount));
};
const reset = () => {
  nodePositions.clear();
  Object.assign(view, { x: 0, y: 0, scale: 1 });
  Object.assign(drag, {
    kind: null,
    nodeId: undefined,
    x: 0,
    y: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });
};
const startCanvasDrag = (event: PointerEvent) => {
  Object.assign(drag, {
    kind: "canvas",
    nodeId: undefined,
    x: event.clientX,
    y: event.clientY,
    originX: event.clientX,
    originY: event.clientY,
    moved: false,
  });
  (event.currentTarget as SVGSVGElement).setPointerCapture?.(event.pointerId);
};
const startNodeDrag = (event: PointerEvent, node: GraphNode) => {
  Object.assign(drag, {
    kind: "node",
    nodeId: node.id,
    x: event.clientX,
    y: event.clientY,
    originX: event.clientX,
    originY: event.clientY,
    moved: false,
  });
  (event.currentTarget as SVGGElement).setPointerCapture?.(event.pointerId);
};
const moveDrag = (event: PointerEvent) => {
  if (drag.kind === "canvas") {
    view.x += event.clientX - drag.x;
    view.y += event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    return;
  }
  if (drag.kind !== "node" || !drag.nodeId) {
    return;
  }
  if (
    Math.hypot(event.clientX - drag.originX, event.clientY - drag.originY) > 4
  ) {
    drag.moved = true;
  }
  updateGraphBounds();
  const scale = Math.min(graphWidth.value / width, graphHeight.value / height);
  if (scale === 0) {
    return;
  }
  const x =
    (event.clientX - graphLeft.value - (graphWidth.value - width * scale) / 2) /
    scale;
  const y =
    (event.clientY - graphTop.value - (graphHeight.value - height * scale) / 2) /
    scale;
  nodePositions.set(drag.nodeId, {
    x: (x - view.x) / view.scale,
    y: (y - view.y) / view.scale,
  });
  drag.x = event.clientX;
  drag.y = event.clientY;
};
const stopDrag = () => {
  drag.kind = null;
  drag.nodeId = undefined;
};
const selectNode = (node: GraphNode) => {
  if (drag.moved) {
    drag.moved = false;
    return;
  }
  emit("select", node.slug);
};
const handleWheel = (event: WheelEvent) => {
  event.preventDefault();
  zoom(event.deltaY > 0 ? -0.08 : 0.08);
};
const nodeLabel = (node: GraphNode) => node.title || node.slug;
</script>

<template>
  <div class="border-default bg-elevated/30 relative min-h-72 overflow-hidden rounded-xl border">
    <div v-if="!graph.nodes.length" class="text-muted flex h-72 items-center justify-center text-sm">
      No linked posts yet.
    </div>
    <svg v-else ref="graphSvg" :viewBox="`0 0 ${width} ${height}`" class="h-full min-h-72 w-full touch-none select-none"
      role="img" aria-label="Post relationship graph" @pointerdown.self="startCanvasDrag" @pointermove="moveDrag"
      @pointerup="stopDrag" @pointercancel="stopDrag" @wheel="handleWheel">
      <g :transform="`translate(${view.x} ${view.y}) scale(${view.scale})`">
        <defs>
          <marker id="graph-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" class="text-muted fill-current" />
          </marker>
        </defs>
        <line v-for="edge in edgePoints" :key="`${edge.source}-${edge.target}`" :x1="edge.sourcePoint.x"
          :y1="edge.sourcePoint.y" :x2="edge.targetPoint.x" :y2="edge.targetPoint.y" class="text-muted"
          stroke="currentColor" stroke-width="1.5" marker-end="url(#graph-arrow)" />
        <g v-for="node in graph.nodes" :key="node.id"
          :transform="`translate(${positions.get(node.id)?.x || 0} ${positions.get(node.id)?.y || 0})`"
          class="cursor-pointer outline-none" role="button" tabindex="0" :aria-label="`Open ${nodeLabel(node)}`"
          @pointerdown.stop="startNodeDrag($event, node)" @click="selectNode(node)" @keydown.enter="selectNode(node)"
          @keydown.space.prevent="selectNode(node)">
          <circle r="10" :class="node.slug === activeSlug
            ? 'fill-primary stroke-primary'
            : 'fill-default stroke-primary/60'
            " stroke-width="2" />
          <text y="26" text-anchor="middle" class="text-highlighted fill-current text-[11px]">
            {{ nodeLabel(node) }}
          </text>
        </g>
      </g>
    </svg>
    <div class="absolute top-3 right-3 flex gap-1">
      <UButton icon="i-lucide-minus" size="xs" color="neutral" variant="soft" aria-label="Zoom out"
        @click="zoom(-0.15)" />
      <UButton icon="i-lucide-plus" size="xs" color="neutral" variant="soft" aria-label="Zoom in" @click="zoom(0.15)" />
      <UButton icon="i-lucide-rotate-ccw" size="xs" color="neutral" variant="soft" aria-label="Reset graph"
        @click="reset" />
    </div>
  </div>
</template>
