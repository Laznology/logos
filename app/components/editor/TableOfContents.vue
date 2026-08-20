<script setup lang="ts">
export interface TocItem {
  id: string;
  text: string;
  level: number;
  isActive?: boolean;
}

const { items, activeId = "" } = defineProps<{
  items: TocItem[];
  activeId?: string;
}>();

const emit = defineEmits<{
  (e: "select", item: TocItem): void;
}>();

const isHovered = ref(false);

const { start: startHoverTimeout, stop: stopHoverTimeout } = useTimeoutFn(
  () => {
    isHovered.value = false;
  },
  150,
  { immediate: false }
);

const onMouseEnter = () => {
  stopHoverTimeout();
  isHovered.value = true;
};

const onMouseLeave = () => {
  startHoverTimeout();
};

const onItemClick = (item: TocItem) => {
  emit("select", item);
};
</script>

<template>
  <div
    v-if="items && items.length > 0"
    class="fixed top-24 right-4 z-40 hidden flex-col items-end md:flex lg:right-8"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Notion Mini Lines Indicator -->
    <div
      class="flex flex-col items-end gap-1.5 p-2 transition-opacity duration-200"
      :class="
        isHovered
          ? 'pointer-events-none opacity-0'
          : 'opacity-60 hover:opacity-100'
      "
    >
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="h-1 cursor-pointer rounded-full transition-all duration-200"
        :class="[
          (activeId ? activeId === item.id : item.isActive)
            ? 'bg-primary w-6'
            : item.level === 1
              ? 'w-5 bg-neutral-400 hover:bg-neutral-500 dark:bg-neutral-500 dark:hover:bg-neutral-400'
              : item.level === 2
                ? 'w-3.5 bg-neutral-400/80 hover:bg-neutral-500 dark:bg-neutral-500/80 dark:hover:bg-neutral-400'
                : 'w-2.5 bg-neutral-400/60 hover:bg-neutral-500 dark:bg-neutral-500/60 dark:hover:bg-neutral-400',
        ]"
        :aria-label="item.text"
        @click="onItemClick(item)"
      />
    </div>

    <!-- Notion Floating ToC Drawer -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-x-2 scale-95"
      enter-to-class="opacity-100 translate-x-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-x-0 scale-100"
      leave-to-class="opacity-0 translate-x-2 scale-95"
    >
      <div
        v-if="isHovered"
        class="border-default bg-elevated/95 shadow-elevated absolute top-0 right-0 z-50 flex max-h-[70vh] w-64 flex-col rounded-xl border p-3 backdrop-blur-md"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
      >
        <div
          class="border-default text-highlighted mb-2 flex items-center justify-between border-b pb-2 text-xs font-semibold"
        >
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-list" class="text-primary size-3.5" />
            <span>Table of Contents</span>
          </div>
          <span class="text-muted text-[10px]"
            >{{ items.length }} sections</span
          >
        </div>

        <div class="flex-1 space-y-0.5 overflow-y-auto pr-1">
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            class="line-clamp-1 flex w-full cursor-pointer items-center rounded px-2 py-1 text-left text-xs transition"
            :class="[
              item.level === 1
                ? 'font-medium'
                : item.level === 2
                  ? 'text-muted pl-3'
                  : 'text-muted pl-5',
              (activeId ? activeId === item.id : item.isActive)
                ? 'text-primary bg-primary/10 font-semibold'
                : 'hover:text-highlighted hover:bg-muted/40',
            ]"
            @click="onItemClick(item)"
          >
            <span class="truncate">{{ item.text }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
