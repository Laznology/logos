<script setup lang="ts">
const {
  title = "Logos Publication",
  description = "A clean, distraction-free space for essays, stories, and ideas.",
  author = "Logos Publication",
  publishedAt,
} = defineProps<{
  title?: string;
  description?: string;
  author?: string;
  publishedAt?: string;
}>();
</script>

<template>
  <div class="og-card">
    <div class="og-accent" />

    <div class="og-content">
      <div class="og-header">
        <div class="og-icon-wrapper">
          <svg
            class="og-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
            />
            <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
          </svg>
        </div>
        <p class="og-eyebrow">LOGOS PUBLICATION</p>
      </div>

      <h1 class="og-title">{{ title }}</h1>
      <p v-if="description" class="og-description">{{ description }}</p>
    </div>

    <div class="og-footer">
      <span>{{ author }}</span>
      <span v-if="publishedAt" class="og-dot" />
      <span v-if="publishedAt">{{ publishedAt }}</span>
    </div>
  </div>
</template>

<style scoped>
.og-card {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 76px;
  background: linear-gradient(135deg, #111317 0%, #171b22 50%, #1f2630 100%);
  color: #f8fafc;
  font-family:
    "Public Sans",
    system-ui,
    -apple-system,
    sans-serif;
}

.og-accent {
  position: absolute;
  top: -160px;
  right: -120px;
  width: 420px;
  height: 420px;
  border: 2px solid rgba(45, 212, 191, 0.35);
  border-radius: 50%;
}

.og-content {
  display: flex;
  max-width: 980px;
  flex-direction: column;
}

.og-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 24px;
}

.og-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(45, 212, 191, 0.14);
  border: 1.5px solid rgba(45, 212, 191, 0.4);
  color: #2dd4bf;
}

.og-icon {
  width: 24px;
  height: 24px;
}

.og-eyebrow {
  margin: 0;
  color: #2dd4bf;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.og-title {
  margin: 0;
  font-size: 72px;
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.og-description {
  max-width: 860px;
  margin: 28px 0 0;
  color: #cbd5e1;
  font-size: 28px;
  line-height: 1.35;
}

.og-footer {
  display: flex;
  align-items: center;
  color: #cbd5e1;
  font-size: 22px;
  font-weight: 600;
}

.og-dot {
  width: 8px;
  height: 8px;
  margin: 0 16px;
  border-radius: 50%;
  background: #2dd4bf;
}
</style>
