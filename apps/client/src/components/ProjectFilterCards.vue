<template>
  <div class="px-3 py-3 bg-gradient-to-r from-[var(--theme-bg-primary)]/95 to-[var(--theme-bg-secondary)]/95 backdrop-blur-sm border-b border-[var(--theme-border-primary)]/20">
    <div class="flex flex-wrap gap-2 animate-fadeIn">
      <button
        class="px-3 py-2 rounded-lg border transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md hover:scale-105"
        :class="selectedProject === '' 
          ? 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-dark)] text-white border-[var(--theme-primary-dark)] shadow-md scale-105' 
          : 'bg-[var(--theme-bg-tertiary)]/80 text-[var(--theme-text-primary)] border-[var(--theme-border-primary)]/30 hover:border-[var(--theme-primary)]/50'"
        @click="$emit('update:selectedProject', '')"
      >
        All <span class="ml-1 text-xs opacity-80">({{ totalFilteredCount }})</span>
      </button>
      <button
        v-for="p in projectsWithCounts"
        :key="p.name"
        class="px-3 py-2 rounded-lg border transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md hover:scale-105"
        :class="selectedProject === p.name 
          ? 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-dark)] text-white border-[var(--theme-primary-dark)] shadow-md scale-105' 
          : 'bg-[var(--theme-bg-tertiary)]/80 text-[var(--theme-text-primary)] border-[var(--theme-border-primary)]/30 hover:border-[var(--theme-primary)]/50'"
        @click="$emit('update:selectedProject', p.name)"
      >
        {{ p.name }} <span class="ml-1 text-xs opacity-80">({{ p.count }})</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HookEvent } from '../types'

const props = defineProps<{
  events: HookEvent[];
  selectedProject: string;
  filters?: {
    sessionId: string;
    eventType: string;
  };
}>()

const projectOf = (e: HookEvent) => (e as any).project || (e as any).payload?.project || e.source_app

const baseFilteredEvents = computed(() => {
  if (!props.filters) return props.events
  return props.events.filter(event => {
    if (props.filters!.sessionId && event.session_id !== props.filters!.sessionId) return false
    if (props.filters!.eventType && event.hook_event_type !== props.filters!.eventType) return false
    return true
  })
})

const totalFilteredCount = computed(() => baseFilteredEvents.value.length)

const projectsWithCounts = computed(() => {
  const map = new Map<string, number>()
  for (const e of baseFilteredEvents.value) {
    const p = projectOf(e)
    map.set(p, (map.get(p) || 0) + 1)
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
})
</script>
