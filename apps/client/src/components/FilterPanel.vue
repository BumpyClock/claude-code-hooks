<template>
  <div class="bg-gradient-to-r from-[var(--theme-bg-primary)]/95 to-[var(--theme-bg-secondary)]/95 backdrop-blur-sm border-b border-[var(--theme-border-primary)]/20 px-4 py-3 mobile:py-2 animate-slideDown">
    <div class="flex flex-wrap gap-3 items-center mobile:flex-col mobile:items-stretch">
      <div class="flex-1 min-w-0 mobile:w-full">
        <label class="block text-sm mobile:text-xs font-medium text-[var(--theme-text-secondary)] mb-1">
          Session ID
        </label>
        <select
          v-model="localFilters.sessionId"
          @change="updateFilters"
          class="w-full px-2.5 py-1.5 mobile:px-2 mobile:py-1.5 text-sm mobile:text-xs border border-[var(--theme-border-primary)]/30 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)]/20 focus:border-[var(--theme-primary)] bg-[var(--theme-bg-primary)]/80 backdrop-blur-sm text-[var(--theme-text-primary)] transition-all duration-150 shadow-sm hover:shadow-md"
        >
          <option value="">All Sessions</option>
          <option v-for="session in filterOptions.session_ids" :key="session" :value="session">
            {{ session.slice(0, 8) }}...
          </option>
        </select>
      </div>
      
      <div class="flex-1 min-w-0 mobile:w-full">
        <label class="block text-sm mobile:text-xs font-medium text-[var(--theme-text-secondary)] mb-1">
          Event Type
        </label>
        <select
          v-model="localFilters.eventType"
          @change="updateFilters"
          class="w-full px-2.5 py-1.5 mobile:px-2 mobile:py-1.5 text-sm mobile:text-xs border border-[var(--theme-border-primary)]/30 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)]/20 focus:border-[var(--theme-primary)] bg-[var(--theme-bg-primary)]/80 backdrop-blur-sm text-[var(--theme-text-primary)] transition-all duration-150 shadow-sm hover:shadow-md"
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
        class="px-2.5 py-1.5 mobile:px-2 mobile:py-1.5 mobile:w-full text-sm mobile:text-xs font-medium text-[var(--theme-text-secondary)] bg-gradient-to-r from-[var(--theme-bg-tertiary)]/80 to-[var(--theme-bg-quaternary)]/80 hover:from-[var(--theme-bg-quaternary)] hover:to-[var(--theme-bg-tertiary)] rounded-lg border border-[var(--theme-border-primary)]/30 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
      >
        Clear Filters
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