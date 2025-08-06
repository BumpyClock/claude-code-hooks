<template>
  <div class="px-3 py-3 animate-fadeIn border-t border-[var(--theme-border-primary)]/5">
    <div class="flex flex-col gap-3">
      <div>
        <label class="block text-[10px] font-medium text-[var(--theme-text-tertiary)] mb-1">Session</label>
        <select
          v-model="localFilters.sessionId"
          @change="updateFilters"
          class="w-full px-2 py-1.5 text-xs border border-[var(--theme-border-primary)]/40 rounded-md bg-[var(--theme-bg-primary)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]"
        >
          <option value="">All Sessions</option>
          <option v-for="session in filterOptions.session_ids" :key="session" :value="session">
            {{ session.slice(0, 8) }}...
          </option>
        </select>
      </div>
      <div>
        <label class="block text-[10px] font-medium text-[var(--theme-text-tertiary)] mb-1">Event type</label>
        <select
          v-model="localFilters.eventType"
          @change="updateFilters"
          class="w-full px-2 py-1.5 text-xs border border-[var(--theme-border-primary)]/40 rounded-md bg-[var(--theme-bg-primary)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]"
        >
          <option value="">All Types</option>
          <option v-for="type in filterOptions.hook_event_types" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="px-2 py-1.5 text-xs rounded-md border border-[var(--theme-border-primary)]/40 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]"
      >
        Clear filters
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { FilterOptions } from '../types';

const props = defineProps<{
  filters: {
    sessionId: string;
    eventType: string;
  };
}>();

const emit = defineEmits<{
  'update:filters': [filters: typeof props.filters];
}>();

const filterOptions = ref<FilterOptions>({
  source_apps: [],
  session_ids: [],
  hook_event_types: []
});

const localFilters = ref({ ...props.filters });

const hasActiveFilters = computed(() => {
  return localFilters.value.sessionId || localFilters.value.eventType;
});

const updateFilters = () => {
  emit('update:filters', { ...localFilters.value });
};

const clearFilters = () => {
  localFilters.value = {
    sessionId: '',
    eventType: ''
  };
  updateFilters();
};

const fetchFilterOptions = async () => {
  try {
    const response = await fetch('http://localhost:4000/events/filter-options');
    if (response.ok) {
      filterOptions.value = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
  }
};

onMounted(() => {
  fetchFilterOptions();
  // Refresh filter options periodically
  setInterval(fetchFilterOptions, 10000);
});
</script>