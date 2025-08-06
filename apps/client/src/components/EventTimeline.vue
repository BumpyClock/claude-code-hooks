<template>
  <div class="flex-1 mobile:h-[50vh] flex flex-col overflow-hidden bg-[var(--theme-bg-secondary)]">
    
    <!-- Scrollable Event List -->
    <div 
      ref="scrollContainer"
      class="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 mobile:px-2 mobile:py-2 relative min-w-0"
      @scroll="handleScroll"
    >
      <div class="relative overflow-x-hidden min-w-0">
        <div class="absolute left-32 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--theme-border-primary)]/0 via-[var(--theme-border-primary)]/10 to-[var(--theme-border-primary)]/0"></div>
        <TransitionGroup name="event" tag="div" class="space-y-3 mobile:space-y-2 min-w-0">
          <EventRow
            v-for="event in filteredEventsSorted"
            :key="`${event.id}-${event.timestamp}`"
            :event="event"
            :gradient-class="getGradientForSession(event.session_id)"
            :color-class="getColorForSession(event.session_id)"
            :app-gradient-class="getGradientForApp(event.source_app)"
            :app-color-class="getColorForApp(event.source_app)"
            :app-hex-color="getHexColorForApp(event.source_app)"
          />
        </TransitionGroup>
      </div>
      
      <div v-if="filteredEvents.length === 0" class="text-center py-12 mobile:py-8 text-[var(--theme-text-tertiary)] animate-fadeIn">
        <div class="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[var(--theme-bg-tertiary)] via-[var(--theme-bg-quaternary)] to-[var(--theme-bg-tertiary)] flex items-center justify-center shadow-inner border border-[var(--theme-border-primary)]/20">
          <div class="relative">
            <Activity class="w-8 h-8 text-[var(--theme-text-quaternary)]" />
            <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse"></div>
          </div>
        </div>
        <p class="text-lg mobile:text-base font-semibold text-[var(--theme-text-secondary)] mb-2">Waiting for events...</p>
        <p class="text-sm mobile:text-xs text-[var(--theme-text-tertiary)] max-w-sm mx-auto">Your live event stream will appear here as activities are detected from your applications</p>
        <div class="mt-6 flex justify-center">
          <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-bg-tertiary)]/30 border border-[var(--theme-border-primary)]/20">
            <div class="w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse"></div>
            <span class="text-xs text-[var(--theme-text-tertiary)]">Live monitoring active</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { Activity } from 'lucide-vue-next';
import type { HookEvent, FilterOptions } from '../types';
import EventRow from './EventRow.vue';
import { useEventColors } from '../composables/useEventColors';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const props = defineProps<{
  events: HookEvent[];
  filters: {
    sessionId: string;
    eventType: string;
  };
  stickToBottom: boolean;
  selectedProject?: string;
}>();

const emit = defineEmits<{
  'update:stickToBottom': [value: boolean];
  'update:filters': [filters: typeof props.filters];
  'scroll-sync': [scrollTop: number];
}>();

const scrollContainer = ref<HTMLElement>();
const { getGradientForSession, getColorForSession, getGradientForApp, getColorForApp, getHexColorForApp } = useEventColors();

const projectOf = (e: HookEvent) => (e as any).project || (e as any).payload?.project || e.source_app;

const filterOptions = ref<FilterOptions>({ source_apps: [], session_ids: [], hook_event_types: [] });
const localFilters = ref({ 
  sessionId: props.filters.sessionId || '__ALL_SESSIONS__',
  eventType: props.filters.eventType || '__ALL_TYPES__'
});

// Watch for changes in parent filters to keep local state in sync
watch(() => props.filters, (newFilters) => {
  localFilters.value = { 
    sessionId: newFilters.sessionId || '__ALL_SESSIONS__',
    eventType: newFilters.eventType || '__ALL_TYPES__'
  };
}, { deep: true });

const hasActiveFilters = computed(() => 
  (localFilters.value.sessionId && localFilters.value.sessionId !== '__ALL_SESSIONS__') || 
  (localFilters.value.eventType && localFilters.value.eventType !== '__ALL_TYPES__')
);
const emitFilters = () => emit('update:filters', { 
  sessionId: localFilters.value.sessionId === '__ALL_SESSIONS__' ? '__ALL_SESSIONS__' : localFilters.value.sessionId,
  eventType: localFilters.value.eventType === '__ALL_TYPES__' ? '__ALL_TYPES__' : localFilters.value.eventType
});
const clearLocalFilters = () => { 
  localFilters.value = { sessionId: '__ALL_SESSIONS__', eventType: '__ALL_TYPES__' }; 
  emitFilters(); 
};

const fetchFilterOptions = async () => {
  try {
    const res = await fetch('http://localhost:4000/events/filter-options');
    if (res.ok) filterOptions.value = await res.json();
  } catch {}
};

const updateSessionFilter = (value: any) => {
  localFilters.value.sessionId = (value === '__ALL__' || !value) ? '__ALL_SESSIONS__' : String(value);
  emitFilters();
};

const updateEventTypeFilter = (value: any) => {
  localFilters.value.eventType = (value === '__ALL__' || !value) ? '__ALL_TYPES__' : String(value);
  emitFilters();
};

onMounted(() => { fetchFilterOptions(); setInterval(fetchFilterOptions, 10000); });

type AnyEvent = HookEvent & { meta?: any };

type GroupMeta = {
  group: 'aggregate';
  count: number;
  timeRange: [number, number];
  key: string;
  tool?: string;
  chips: string[];
  children: HookEvent[];
};

const summarizeChip = (e: HookEvent): string | null => {
  const p: any = (e as any).payload || {};
  const fp = p.tool_input?.file_path as string | undefined;
  if (fp) return String(fp).split('/').pop() as string;
  const cmd = p.tool_input?.command as string | undefined;
  if (cmd) return String(cmd).slice(0, 40);
  const s = (e as any).summary as string | undefined;
  if (s) {
    const m = s.match(/^read\s+(.+)$/i);
    if (m) return m[1].trim();
    return s.slice(0, 40);
  }
  return null;
};

const groupKey = (e: HookEvent): string => {
  const tool = (e as any).payload?.tool_name || '';
  return [e.session_id, e.source_app, e.hook_event_type, tool].join('|');
};

const WINDOW_MS = 3000;

const groupedEvents = computed<AnyEvent[]>(() => {
  const out: AnyEvent[] = [];
  let open: { [key: string]: { start: number; last: number; key: string; base: HookEvent; chips: string[]; children: HookEvent[]; tool?: string } } = {};
  const push = (g: typeof open[string]) => {
    const aggChips: string[] = [];
    for (const child of g.children) {
      const chip = summarizeChip(child);
      if (chip) aggChips.push(chip);
    }
    const chips = Array.from(new Set(aggChips));

    const evt: AnyEvent = {
      ...(g.base as any),
      meta: {
        group: 'aggregate',
        count: g.children.length,
        timeRange: [g.start, g.last],
        key: g.key,
        tool: g.tool,
        chips,
        children: g.children
      } satisfies GroupMeta
    };
    out.push(evt);
  };

  const events = [...props.events];
  console.log('[EventTimeline] Processing events for grouping:', {
    totalEvents: events.length,
    eventsWithSummary: events.filter(e => e.summary).length,
    sampleEventsWithSummary: events.filter(e => e.summary).slice(0, 3).map(e => ({
      id: e.id,
      summary: e.summary,
      hook_event_type: e.hook_event_type
    }))
  });
  
  for (const e of events) {
    const ts = e.timestamp || 0;
    const k = groupKey(e);
    const tool = (e as any).payload?.tool_name;
    const chip = summarizeChip(e);
    const g = open[k];
    if (g && ts - g.last <= WINDOW_MS) {
      g.last = ts;
      g.children.push(e);
      if (chip) g.chips.push(chip);
    } else {
      if (g) {
        push(g);
        delete open[k];
      }
      open[k] = { start: ts, last: ts, key: k, base: e, chips: chip ? [chip] : [], children: [e], tool };
    }
  }
  Object.values(open).forEach(push);
  
  console.log('[EventTimeline] Grouped events result:', {
    totalGroupedEvents: out.length,
    groupedEventsWithSummary: out.filter(e => e.summary).length,
    sampleGroupedEventsWithSummary: out.filter(e => e.summary).slice(0, 3).map(e => ({
      id: e.id,
      summary: e.summary,
      hook_event_type: e.hook_event_type,
      isGroup: !!e.meta?.group
    }))
  });
  
  return out;
});

const filteredEvents = computed(() => {
  return groupedEvents.value.filter(event => {
    if (props.selectedProject && projectOf(event) !== props.selectedProject) return false;
    if (props.filters.sessionId && props.filters.sessionId !== '__ALL_SESSIONS__' && event.session_id !== props.filters.sessionId) return false;
    if (props.filters.eventType && props.filters.eventType !== '__ALL_TYPES__' && event.hook_event_type !== props.filters.eventType) return false;
    return true;
  });
});

const filteredEventsSorted = computed(() => {
  return [...filteredEvents.value].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
});

const scrollToTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0;
  }
};

const handleScroll = () => {
  if (!scrollContainer.value) return;
  const { scrollTop } = scrollContainer.value;
  const isAtTop = scrollTop < 50;
  if (isAtTop !== props.stickToBottom) emit('update:stickToBottom', isAtTop);
  
  // Emit scroll position for activity timeline synchronization
  emit('scroll-sync', scrollTop);
};

watch(() => props.events.length, async () => {
  if (props.stickToBottom) { await nextTick(); scrollToTop(); }
});

watch(() => props.events, (newEvents) => {
  console.log('[EventTimeline] Events prop changed:', {
    count: newEvents.length,
    latestEvents: newEvents.slice(0, 3).map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      hook_event_type: e.hook_event_type,
      session_id: e.session_id?.slice(0, 8),
      summary: e.summary,
      source_app: e.source_app
    }))
  });
}, { deep: true });

watch(() => props.stickToBottom, (shouldStick) => { if (shouldStick) { scrollToTop(); } });
</script>

<style scoped>
.event-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.event-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.event-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.event-enter-from {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

.event-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}
</style>