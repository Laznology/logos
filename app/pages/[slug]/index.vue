<script setup lang="ts">
import type { JSONContent } from "@tiptap/core";

const { page, error, pending, performAutoSave, savingStatus } =
  useContentEditor();

const statusColor = computed(() => {
  switch (savingStatus.value) {
    case "saving": {
      return "warning";
    }
    case "saved": {
      return "success";
    }
    case "error": {
      return "error";
    }
    default: {
      return "neutral";
    }
  }
});

const statusText = computed(() => {
  switch (savingStatus.value) {
    case "saving": {
      return "Saving ...";
    }
    case "saved": {
      return "Saved";
    }
    case "error": {
      return "Error";
    }
    default: {
      return "Draft";
    }
  }
});
</script>

<template>
  <UContainer class="max-w-4xl py-8">
    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-64 w-full" />
    </div>
    <UAlert
      v-else-if="error"
      icon="i-heroicons-exclamation-triangle"
      color="error"
      variant="soft"
      title="Gagal memuat halaman"
      :description="error.message"
    />

    <div v-else-if="page">
      <UInput
        v-model="page.title"
        variant="none"
        size="xl"
        placeholder="Untitled"
        @update:model-value="performAutoSave"
      />
      <UBadge :color="statusColor" variant="subtle">
        {{ statusText }}
      </UBadge>
      <UEditor
        v-slot="{ editor }"
        v-model="page.content as JSONContent"
        :ui="{
          base: 'p-4 sm:p-14',
          content: 'max-w-4xl mx-auto',
        }"
        :starter-kit="true"
        class="min-h-screen"
        autofocus
        placeholder="Write, type '/' for suggestion"
        @update:model-value="performAutoSave"
      >
        <UEditorDragHandle :editor="editor" />
        <UEditorToolbar
          :editor="editor"
          layout="bubble"
          :items="editorToolbarItems"
        />
        <UEditorSuggestionMenu
          :editor="editor"
          :items="editorSuggestionItems"
        />
      </UEditor>
    </div>
  </UContainer>
</template>
