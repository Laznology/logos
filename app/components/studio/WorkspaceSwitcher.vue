<script setup lang="ts">
const { organization } = authClient;
const organizations = authClient.useListOrganizations();
const active = authClient.useActiveOrganization();
const toast = useToast();

const isCreating = ref(false);
const newName = ref("");
const isCreatingOpen = ref(false);

const switchTo = async (organizationId: string) => {
  if (organizationId === active.value.data?.id) {
    return;
  }
  const { error } = await organization.setActive({ organizationId });
  if (error) {
    toast.add({
      title: "Could not switch workspace",
      description: error.message,
      color: "error",
    });
    return;
  }
  // Posts are scoped per workspace, so reload the route data.
  await refreshNuxtData();
  await navigateTo("/studio");
};

const createWorkspace = async () => {
  const name = newName.value.trim();
  if (!name) {
    return;
  }
  isCreating.value = true;
  const slug = `${name
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, "")
    .replaceAll(/[\s_-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await organization.create({ name, slug });
  isCreating.value = false;
  if (error) {
    toast.add({
      title: "Could not create workspace",
      description: error.message,
      color: "error",
    });
    return;
  }
  isCreatingOpen.value = false;
  await organization.setActive({ organizationId: data.id });
  await navigateTo("/studio");
};

const items = computed(() => [
  (organizations.value.data ?? []).map((org) => ({
    label: org.name,
    icon:
      active.value.data?.id === org.id ? "i-lucide-check" : "i-lucide-building-2",
    onSelect: () => switchTo(org.id),
  })),
  [
    {
      label: "New workspace",
      icon: "i-lucide-plus",
      onSelect: () => {
        newName.value = "";
        isCreatingOpen.value = true;
      },
    },
  ],
]);
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'start' }">
    <UButton variant="ghost" color="neutral" size="sm" class="max-w-full justify-start" icon="i-lucide-building-2"
      :label="active.data?.name || 'Workspace'" trailing-icon="i-lucide-chevrons-up-down" />
  </UDropdownMenu>

  <UModal v-model:open="isCreatingOpen" title="New workspace">
    <template #body>
      <UFormField label="Name">
        <UInput v-model="newName" placeholder="My Workspace" class="w-full" autofocus
          @keydown.enter="createWorkspace" />
      </UFormField>
    </template>
    <template #footer>
      <UButton label="Create" :loading="isCreating" :disabled="!newName.trim()" @click="createWorkspace" />
    </template>
  </UModal>
</template>
