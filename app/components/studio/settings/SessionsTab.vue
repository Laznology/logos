<script setup lang="ts">
const { listSessions, revokeSession, revokeSessions } = authClient;
const session = authClient.useSession();
const toast = useToast();

const { data, refresh, pending } = await useAsyncData(
  "account-sessions",
  async () => {
    const result = await listSessions();
    return result?.data ?? [];
  },
  { server: false }
);

const currentToken = computed(() => session.value.data?.session?.token);
const isRevokingAll = ref(false);

async function revoke(token: string) {
  const { error } = await revokeSession({ token });
  if (error) {
    toast.add({
      title: "Could not revoke session",
      description: error.message,
      color: "error",
    });
    return;
  }
  if (token === currentToken.value) {
    await navigateTo("/login");
    return;
  }
  await refresh();
  toast.add({ title: "Session revoked", color: "success" });
}

async function revokeAll() {
  isRevokingAll.value = true;
  const { error } = await revokeSessions();
  isRevokingAll.value = false;
  if (error) {
    toast.add({
      title: "Could not revoke sessions",
      description: error.message,
      color: "error",
    });
    return;
  }
  await navigateTo("/login");
}

function deviceLabel(userAgent: string | null | undefined) {
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
      <UButton size="xs" variant="outline" color="error" icon="i-lucide-log-out" :loading="isRevokingAll"
        @click="revokeAll">
        Revoke all
      </UButton>
    </div>

    <div v-if="pending" class="space-y-2">
      <USkeleton v-for="i in 2" :key="i" class="bg-muted h-14 w-full rounded-lg" />
    </div>

    <ul v-else class="divide-default divide-y">
      <li v-for="item in data" :key="item.id" class="flex items-center justify-between gap-3 py-3">
        <div class="flex min-w-0 items-center gap-3">
          <UIcon name="i-lucide-monitor-smartphone" class="text-muted size-5 shrink-0" />
          <div class="min-w-0">
            <p class="text-highlighted flex items-center gap-2 text-sm font-medium">
              {{ deviceLabel(item.userAgent) }}
              <UBadge v-if="item.token === currentToken" label="This device" color="primary" variant="subtle"
                size="sm" />
            </p>
            <p class="text-muted truncate text-xs">
              {{ item.ipAddress || "unknown IP" }} ·
              <NuxtTime :datetime="item.updatedAt" relative />
            </p>
          </div>
        </div>
        <UButton size="xs" variant="ghost" color="error" @click="revoke(item.token)">
          Revoke
        </UButton>
      </li>
    </ul>
  </div>
</template>
