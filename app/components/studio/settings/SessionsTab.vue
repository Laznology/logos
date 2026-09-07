<script setup lang="ts">
import { FetchError } from "ofetch";

interface SessionRow {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isCurrent: boolean;
}

const { $csrfFetch } = useNuxtApp();
const toast = useToast();
function showError(error: unknown) {
  toast.add({
    title: "Something went wrong",
    description:
      error instanceof FetchError ? error.statusMessage : "Unexpected error",
    color: "error",
  });
}

const { data, refresh, pending } = useFetch<{ data: SessionRow[] }>(
  "/api/account/sessions",
  { key: "account-sessions", lazy: true }
);

const isRevokingAll = ref(false);

async function revoke(id: string) {
  try {
    if (data.value?.data.find((s) => s.id === id)?.isCurrent) {
      await $csrfFetch(`/api/account/sessions/${id}`, { method: "DELETE" });
      await navigateTo("/login");
      return;
    }
    await $csrfFetch(`/api/account/sessions/${id}`, { method: "DELETE" });
    await refresh();
    toast.add({ title: "Session revoked", color: "success" });
  } catch (error) {
    showError(error);
  }
}

async function revokeAll() {
  isRevokingAll.value = true;
  try {
    await $csrfFetch("/api/account/sessions", { method: "DELETE" });
    await navigateTo("/login");
  } catch (error) {
    showError(error);
  } finally {
    isRevokingAll.value = false;
  }
}

function deviceLabel(userAgent: string | null) {
  if (!userAgent) {
    return "Unknown device";
  }
  if (/mobile/i.test(userAgent)) {
    return "Mobile";
  }
  if (/mac/i.test(userAgent)) {
    return "macOS";
  }
  if (/windows/i.test(userAgent)) {
    return "Windows";
  }
  if (/linux/i.test(userAgent)) {
    return "Linux";
  }
  return "Device";
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-highlighted text-sm font-semibold">Active sessions</h3>
      <UButton
        size="xs"
        variant="outline"
        color="error"
        icon="i-lucide-log-out"
        :loading="isRevokingAll"
        @click="revokeAll"
      >
        Revoke all
      </UButton>
    </div>

    <div v-if="pending" class="space-y-2">
      <USkeleton
        v-for="i in 2"
        :key="i"
        class="bg-muted h-14 w-full rounded-lg"
      />
    </div>

    <ul v-else class="divide-default divide-y">
      <li
        v-for="session in data?.data"
        :key="session.id"
        class="flex items-center justify-between gap-3 py-3"
      >
        <div class="flex min-w-0 items-center gap-3">
          <UIcon
            name="i-lucide-monitor-smartphone"
            class="text-muted size-5 shrink-0"
          />
          <div class="min-w-0">
            <p
              class="text-highlighted flex items-center gap-2 text-sm font-medium"
            >
              {{ deviceLabel(session.userAgent) }}
              <UBadge
                v-if="session.isCurrent"
                label="This device"
                color="primary"
                variant="subtle"
                size="sm"
              />
            </p>
            <p class="text-muted truncate text-xs">
              {{ session.ipAddress || "unknown IP" }} ·
              <NuxtTime :datetime="session.lastActivity" relative />
            </p>
          </div>
        </div>
        <UButton
          size="xs"
          variant="ghost"
          color="error"
          @click="revoke(session.id)"
        >
          Revoke
        </UButton>
      </li>
    </ul>
  </div>
</template>
