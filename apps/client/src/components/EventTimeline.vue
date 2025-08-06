<template>
  <div class="flex-1 mobile:h-[50vh] flex flex-col overflow-hidden">
    <!-- Fixed Header -->
    <div class="px-3 py-2.5 mobile:py-2 bg-gradient-to-r from-[var(--theme-bg-primary)]/95 to-[var(--theme-bg-secondary)]/95 backdrop-blur-lg relative z-10 border-b border-[var(--theme-border-primary)]/20">
      <div class="flex items-center justify-between">
        <h2 class="text-sm mobile:text-xs font-medium text-[var(--theme-text-secondary)] flex items-center gap-2">
          <Activity class="w-4 h-4 text-[var(--theme-primary)]" />
          Event Stream
        </h2>
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--theme-text-tertiary)]">
            {{ filteredEvents.length }} {{ filteredEvents.length === 1 ? 'event' : 'events' }}
          </span>
          <span class="w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse"></span>
        </div>
      </div>
    </div>
    
    <!-- Scrollable Event List -->
    <div 
      ref="scrollContainer"
      class="flex-1 overflow-y-auto px-4 py-3 mobile:px-2 mobile:py-2 relative bg-gradient-to-b from-transparent via-[var(--theme-bg-secondary)]/50 to-transparent"
      @scroll="handleScroll"
    >
      <div class="relative">
        <div class="absolute left-32 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--theme-border-primary)]/10 via-[var(--theme-border-primary)]/30 to-[var(--theme-border-primary)]/10"></div>
        <TransitionGroup name="event" tag="div" class="space-y-3 mobile:space-y-2">
          <EventRow
            v-for="event in filteredEvents"
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
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--theme-bg-tertiary)] to-[var(--theme-bg-quaternary)] flex items-center justify-center shadow-inner">
          <svg class="w-8 h-8 text-[var(--theme-text-quaternary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
        </div>
        <p class="text-base mobile:text-sm font-semibold text-[var(--theme-text-secondary)] mb-1">No events yet</p>
        <p class="text-sm mobile:text-xs text-[var(--theme-text-tertiary)]">Events will appear here as they stream in</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { Activity } from 'lucide-vue-next';
import type { HookEvent } from '../types';
import EventRow from './EventRow.vue';
import { useEventColors } from '../composables/useEventColors';

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
}>();

const scrollContainer = ref<HTMLElement>();
const { getGradientForSession, getColorForSession, getGradientForApp, getColorForApp, getHexColorForApp } = useEventColors();

const projectOf = (e: HookEvent) => (e as any).project || (e as any).payload?.project || e.source_app;

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
    // Aggregate chips from all children at finalize time
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
  return out;
});

const filteredEvents = computed(() => {
  return groupedEvents.value.filter(event => {
    if (props.selectedProject && projectOf(event) !== props.selectedProject) return false;
    if (props.filters.sessionId && event.session_id !== props.filters.sessionId) return false;
    if (props.filters.eventType && event.hook_event_type !== props.filters.eventType) return false;
    return true;
  });
});

const scrollToBottom = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
  }
};

const handleScroll = () => {
  if (!scrollContainer.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value;
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
  
  if (isAtBottom !== props.stickToBottom) {
    emit('update:stickToBottom', isAtBottom);
  }
};

watch(() => props.events.length, async () => {
  if (props.stickToBottom) {
    await nextTick();
    scrollToBottom();
  }
});

watch(() => props.stickToBottom, (shouldStick) => {
  if (shouldStick) {
    scrollToBottom();
  }
});
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