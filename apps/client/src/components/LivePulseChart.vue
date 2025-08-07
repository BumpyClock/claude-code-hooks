<template>
  <div class="bg-gradient-to-r from-[var(--theme-bg-primary)]/95 to-[var(--theme-bg-secondary)]/95 backdrop-blur-sm px-3 py-2 mobile:py-2 border-b border-[var(--theme-border-primary)]/20">
    <div class="flex items-center justify-between mb-3 mobile:flex-col mobile:space-y-2 mobile:items-start">
      <h3 class="text-xs mobile:text-xs font-medium text-[var(--theme-text-secondary)] flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse"></span>
        Live Activity
      </h3>
      <div class="flex gap-1 mobile:w-full mobile:justify-center" role="tablist" aria-label="Time range selector">
        <button
          v-for="(range, index) in timeRanges"
          :key="range"
          @click="setTimeRange(range)"
          @keydown="handleTimeRangeKeyDown($event, index)"
          :class="[
            'px-2 py-0.5 text-xs rounded-md transition-all duration-150 min-w-[28px] min-h-[24px] flex items-center justify-center border shadow-sm',
            timeRange === range
              ? 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-dark)] text-white border-[var(--theme-primary-dark)] shadow-md scale-105'
              : 'bg-[var(--theme-bg-tertiary)]/80 text-[var(--theme-text-primary)] border-[var(--theme-border-primary)]/30 hover:bg-[var(--theme-bg-quaternary)] hover:scale-105 hover:shadow-md'
          ]"
          role="tab"
          :aria-selected="timeRange === range"
          :aria-label="`Show ${range}`"
          :tabindex="timeRange === range ? 0 : -1"
        >
          {{ range }}
        </button>
      </div>
    </div>
    <div class="relative transition-transform will-change-transform overflow-hidden"
         :style="{ 
           transform: `translate3d(-${(timelineScroll || 0) * 0.05}px, 0, 0)`
         }"
    >
      <LineChart
        v-if="hasData && chartData.length > 0"
        :data="chartData"
        :categories="seriesCategories"
        index="time"
        :colors="seriesColors"
        :show-legend="true"
        :show-tooltip="true"
        :show-x-axis="false"
        :show-y-axis="false"
        :show-grid-line="false"
        :curve-type="CurveType.MonotoneX"
        :margin="{ left: 10, right: 10, top: 20, bottom: 20 }"
        :custom-tooltip="CustomChartTooltip"
        class="h-[140px] w-full overflow-hidden"
      >
        <template #default>
          <div />
        </template>
      </LineChart>
      <div
        v-if="!hasData"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="flex flex-col items-center gap-2 animate-fadeIn">
          <div class="w-8 h-8 rounded-full border-2 border-[var(--theme-border-primary)]/30 border-t-[var(--theme-primary)] animate-spin"></div>
          <p class="text-[var(--theme-text-tertiary)] text-xs font-medium">Waiting for events...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { HookEvent, TimeRange } from '../types';
import { LineChart } from '@/components/ui/chart-line';
import { defaultColors as uiDefaultColors } from '@/components/ui/chart'
import { CurveType } from '@unovis/ts';
import { useEventColors } from '../composables/useEventColors';

const defaultFallbackColor = (i: number) => uiDefaultColors(8)[i % 8]
import CustomChartTooltip from './CustomChartTooltip.vue';

const props = defineProps<{
  events: HookEvent[];
  filters: {
    sessionId: string;
    eventType: string;
  };
  timelineScroll?: number;
}>();

const timeRanges: TimeRange[] = ['15s', '30s', '1m', '3m', '5m'];
const timeRange = ref<TimeRange>('1m');

// Use the centralized event color system
const { getHexColorForApp } = useEventColors();

// Events are already filtered by the parent component (EventHeaderPulse gets fullyFilteredEvents from App.vue)
const filteredEvents = computed(() => props.events);

const projectColors = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const e of props.events) {
    const app = e.source_app || 'Unknown'
    const hex = getHexColorForApp(app)
    if (!map[app] && hex) map[app] = hex
  }
  return map
})

const seriesCategories = computed(() => {
  const set = new Set<string>()
  // include known colors first
  Object.keys(projectColors.value).forEach(k => set.add(k))
  // also add any source_app present in window range to ensure keys match data
  for (const e of filteredEvents.value) set.add(e.source_app || 'Unknown')
  return Array.from(set)
})
const seriesColors = computed(() => seriesCategories.value.map((app, i) => projectColors.value[app] || defaultFallbackColor(i)))

const chartData = computed(() => {
  const now = Date.now();
  const timeRangeMs = {
    '15s': 15 * 1000,
    '30s': 30 * 1000, 
    '1m': 60 * 1000,
    '3m': 3 * 60 * 1000,
    '5m': 5 * 60 * 1000
  }[timeRange.value];

  const startTime = now - timeRangeMs;
  const recentEvents = filteredEvents.value.filter(event => 
    (event.timestamp || 0) >= startTime
  );

  const intervalMs = timeRangeMs / 20;
  const intervals: Record<number, Record<string, number>> = {};

  for (let i = 0; i < 20; i++) {
    const intervalStart = startTime + (i * intervalMs);
    intervals[intervalStart] = {};
  }

  recentEvents.forEach(event => {
    const eventTime = event.timestamp || 0;
    const intervalIndex = Math.floor((eventTime - startTime) / intervalMs);
    const intervalStart = startTime + (intervalIndex * intervalMs);
    const app = event.source_app || 'Unknown';
    if (intervals[intervalStart] !== undefined) {
      intervals[intervalStart][app] = (intervals[intervalStart][app] || 0) + 1;
    }
  });

  return Object.entries(intervals).map(([time, counts]) => ({
    time: new Date(parseInt(time)).toLocaleTimeString('en-US', { minute: '2-digit', second: '2-digit' }),
    ...seriesCategories.value.reduce((acc, app) => { acc[app] = counts[app] || 0; return acc }, {} as Record<string, number>)
  }));
});

const hasData = computed(() => props.events.length > 0);

// Time range selection
const setTimeRange = (range: TimeRange) => {
  timeRange.value = range;
};

const handleTimeRangeKeyDown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'ArrowLeft' && index > 0) {
    timeRange.value = timeRanges[index - 1];
  } else if (event.key === 'ArrowRight' && index < timeRanges.length - 1) {
    timeRange.value = timeRanges[index + 1];
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    setTimeRange(timeRanges[index]);
  }
};
</script>