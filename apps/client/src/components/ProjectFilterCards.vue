<template>
  <div class="px-2 py-2 overflow-x-auto">
    <div class="flex flex-col gap-1">
      <button
        class="px-2 py-1.5 rounded-md border text-xs text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)] text-left"
        :class="selectedProject === '' ? 'bg-[var(--theme-bg-tertiary)] border-[var(--theme-border-primary)]/60' : 'border-[var(--theme-border-primary)]/40'"
        @click="$emit('update:selectedProject', '')"
      >
        All <span class="ml-1 opacity-70">({{ totalFilteredCount }})</span>
      </button>
      <button
        v-for="p in projectsWithCounts"
        :key="p.name"
        class="px-2 py-1.5 rounded-md border text-xs text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)] text-left"
        :class="selectedProject === p.name ? 'bg-[var(--theme-bg-tertiary)] border-[var(--theme-border-primary)]/60' : 'border-[var(--theme-border-primary)]/40'"
        @click="$emit('update:selectedProject', p.name)"
      >
        {{ p.name }} <span class="ml-1 opacity-70">({{ p.count }})</span>
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
