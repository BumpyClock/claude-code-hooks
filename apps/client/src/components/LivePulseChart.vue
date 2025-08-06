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
    <div ref="chartContainer" class="relative">
      <canvas
        ref="canvas"
        class="w-full cursor-crosshair"
        :style="{ height: chartHeight + 'px' }"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
        role="img"
        :aria-label="chartAriaLabel"
      ></canvas>
      <!-- Icon overlay for bars -->
      <div 
        v-for="(indicator, index) in iconIndicators" 
        :key="`icon-${index}`"
        class="absolute flex items-center justify-center pointer-events-none"
        :style="{ 
          left: indicator.x + 'px', 
          top: indicator.y + 'px',
          width: '24px',
          height: '24px',
          transform: 'translate(-50%, -50%)'
        }"
      >
        <div class="relative flex items-center justify-center w-6 h-6 bg-black/80 dark:bg-white/90 rounded-md backdrop-blur-sm shadow-lg">
          <component 
            :is="indicator.icon" 
            class="w-4 h-4 text-white dark:text-black"
          />
        </div>
      </div>
      <div
        v-if="tooltip.visible"
        class="absolute bg-gradient-to-br from-[var(--theme-bg-primary)]/95 to-[var(--theme-bg-secondary)]/95 backdrop-blur-md text-[var(--theme-text-primary)] px-2.5 py-1.5 mobile:px-3 mobile:py-2 rounded-lg text-xs mobile:text-sm pointer-events-none z-10 shadow-lg border border-[var(--theme-border-primary)]/30 font-medium animate-scaleIn"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <span class="font-bold text-[var(--theme-primary)]">{{ tooltip.text.split(' ')[0] }}</span>
        <span class="text-[var(--theme-text-secondary)]">{{ tooltip.text.slice(tooltip.text.indexOf(' ')) }}</span>
      </div>
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import type { HookEvent, ChartConfig } from '../types';
import { useChartData } from '../composables/useChartData';
import { createChartRenderer, type ChartDimensions } from '../utils/chartRenderer';
import { useEventEmojis } from '../composables/useEventEmojis';
import { useEventColors } from '../composables/useEventColors';
import { Wrench, CheckCircle, AlertCircle, XCircle, Users, Archive, MessageSquare, Activity } from 'lucide-vue-next';

const props = defineProps<{
  events: HookEvent[];
  filters: {
    sessionId: string;
    eventType: string;
  };
}>();

// const emit = defineEmits<{
//   eventClick: [event: HookEvent];
// }>();

const canvas = ref<HTMLCanvasElement>();
const chartContainer = ref<HTMLDivElement>();
const chartHeight = 80;

const timeRanges = ['15s', '30s', '1m', '3m', '5m'] as const;

const {
  timeRange,
  dataPoints,
  addEvent,
  getChartData,
  setTimeRange,
  cleanup: cleanupChartData
} = useChartData();

let renderer: ReturnType<typeof createChartRenderer> | null = null;
let resizeObserver: ResizeObserver | null = null;
let animationFrame: number | null = null;
const processedEventIds = new Set<string>();

const { formatEventTypeLabel } = useEventEmojis();
const { getHexColorForSession } = useEventColors();

const hasData = computed(() => dataPoints.value.some(dp => dp.count > 0));

const chartAriaLabel = computed(() => {
  const totalEvents = dataPoints.value.reduce((sum, dp) => sum + dp.count, 0);
  const rangeText = timeRange.value === '1m' ? '1 minute' : timeRange.value === '3m' ? '3 minutes' : '5 minutes';
  return `Activity chart showing ${totalEvents} events over the last ${rangeText}`;
});

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  text: ''
});

const iconIndicators = ref<Array<{
  x: number;
  y: number;
  icon: any;
  visible: boolean;
}>>([]);

const getThemeColor = (property: string): string => {
  const style = getComputedStyle(document.documentElement);
  const color = style.getPropertyValue(`--theme-${property}`).trim();
  return color || '#3B82F6'; // fallback
};

const getActiveConfig = (): ChartConfig => {
  const range = timeRange.value as string;
  const seconds = range === '15s' ? 15 : range === '30s' ? 30 : range === '1m' ? 60 : range === '3m' ? 180 : 300;
  return {
    maxDataPoints: seconds,
    animationDuration: 200,
    barWidth: 2,
    barGap: 1,
    colors: {
      primary: getThemeColor('primary'),
      glow: getThemeColor('primary-light'),
      axis: getThemeColor('border-primary'),
      text: getThemeColor('text-tertiary')
    }
  };
};

const getDimensions = (): ChartDimensions => {
  const width = chartContainer.value?.offsetWidth || 800;
  return {
    width,
    height: chartHeight,
    padding: {
      top: 7,
      right: 7,
      bottom: 20,
      left: 7
    }
  };
};

const getIconForEventType = (eventType: string) => {
  const iconMap: Record<string, any> = {
    'PreToolUse': Wrench,
    'PostToolUse': CheckCircle,
    'Notification': AlertCircle,
    'Stop': XCircle,
    'SubagentStop': Users,
    'PreCompact': Archive,
    'UserPromptSubmit': MessageSquare,
    'default': Activity
  };
  return iconMap[eventType] || iconMap.default;
};

const render = () => {
  if (!renderer || !canvas.value || !chartContainer.value) return;

  const data = getChartData();
  const maxValue = Math.max(...data.map(d => d.count), 1);
  const dimensions = getDimensions();
  const chartArea = {
    x: dimensions.padding.left,
    y: dimensions.padding.top,
    width: dimensions.width - dimensions.padding.left - dimensions.padding.right,
    height: dimensions.height - dimensions.padding.top - dimensions.padding.bottom
  };
  
  renderer.clear();
  // Ambient chart: hide background, axes, and labels
  renderer.drawBars(data, maxValue, 1, formatEventTypeLabel, getHexColorForSession);
  
  // Update icon indicators
  const barCount = data.length;
  const totalBarWidth = chartArea.width / barCount;
  const barWidth = 2; // Match the config.barWidth
  
  const newIndicators: typeof iconIndicators.value = [];
  
  data.forEach((point, index) => {
    if (point.count > 0 && point.eventTypes) {
      // Get the dominant event type
      const dominantType = Object.entries(point.eventTypes)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      
      if (dominantType) {
        const x = chartArea.x + (index * totalBarWidth) + (totalBarWidth / 2);
        const barHeight = (point.count / maxValue) * chartArea.height;
        const y = chartArea.y + chartArea.height - (barHeight / 2);
        
        // Show icon if bar is tall enough (lowered threshold for better visibility)
        if (barHeight > 8) {
          // Position icon at the top of the bar for better visibility
          const iconY = chartArea.y + chartArea.height - barHeight - 12;
          newIndicators.push({
            x: x,
            y: Math.max(iconY, chartArea.y + 5), // Ensure icon stays within chart bounds
            icon: getIconForEventType(dominantType),
            visible: true
          });
        }
      }
    }
  });
  
  iconIndicators.value = newIndicators;
};

const animateNewEvent = (x: number, y: number) => {
  let radius = 0;
  let opacity = 0.8;
  
  const animate = () => {
    if (!renderer) return;
    
    render();
    renderer.drawPulseEffect(x, y, radius, opacity);
    
    radius += 2;
    opacity -= 0.02;
    
    if (opacity > 0) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      animationFrame = null;
    }
  };
  
  animate();
};

const handleResize = () => {
  if (!renderer || !canvas.value) return;
  
  const dimensions = getDimensions();
  renderer.resize(dimensions);
  render();
};

const isEventFiltered = (event: HookEvent): boolean => {

  if (props.filters.sessionId && event.session_id !== props.filters.sessionId) {
    return false;
  }
  if (props.filters.eventType && event.hook_event_type !== props.filters.eventType) {
    return false;
  }
  return true;
};

const processNewEvents = () => {
  const currentEvents = props.events;
  const newEventsToProcess: HookEvent[] = [];
  
  // Find events that haven't been processed yet
  currentEvents.forEach(event => {
    const eventKey = `${event.id}-${event.timestamp}`;
    if (!processedEventIds.has(eventKey)) {
      processedEventIds.add(eventKey);
      newEventsToProcess.push(event);
    }
  });
  
  // Process new events
  newEventsToProcess.forEach(event => {
    if (event.hook_event_type !== 'refresh' && event.hook_event_type !== 'initial' && isEventFiltered(event)) {
      addEvent(event);
      
      // Trigger pulse animation for new event
      if (renderer && canvas.value) {
        const chartArea = getDimensions();
        const x = chartArea.width - chartArea.padding.right - 10;
        const y = chartArea.height / 2;
        animateNewEvent(x, y);
      }
    }
  });
  
  // Clean up old event IDs to prevent memory leak
  // Keep only IDs from current events
  const currentEventIds = new Set(currentEvents.map(e => `${e.id}-${e.timestamp}`));
  processedEventIds.forEach(id => {
    if (!currentEventIds.has(id)) {
      processedEventIds.delete(id);
    }
  });
  
  render();
};

// Watch for new events
watch(() => props.events, processNewEvents, { deep: true });

// Watch for filter changes
watch(() => props.filters, () => {
  // Reset and reprocess all events with new filters
  dataPoints.value = [];
  processedEventIds.clear();
  processNewEvents();
}, { deep: true });

// Watch for time range changes
watch(timeRange, () => {
  // Need to re-process all events when time range changes
  // because bucket sizes are different
  render();
});

const handleMouseMove = (event: MouseEvent) => {
  if (!canvas.value || !chartContainer.value) return;
  
  const rect = canvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const data = getChartData();
  const dimensions = getDimensions();
  const chartArea = {
    x: dimensions.padding.left,
    y: dimensions.padding.top,
    width: dimensions.width - dimensions.padding.left - dimensions.padding.right,
    height: dimensions.height - dimensions.padding.top - dimensions.padding.bottom
  };
  
  const barWidth = chartArea.width / data.length;
  const barIndex = Math.floor((x - chartArea.x) / barWidth);
  
  if (barIndex >= 0 && barIndex < data.length && y >= chartArea.y && y <= chartArea.y + chartArea.height) {
    const point = data[barIndex];
    if (point.count > 0) {
      const eventTypesText = Object.entries(point.eventTypes || {})
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
      
      tooltip.value = {
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top - 30,
        text: `${point.count} events${eventTypesText ? ` (${eventTypesText})` : ''}`
      };
      return;
    }
  }
  
  tooltip.value.visible = false;
};

const handleMouseLeave = () => {
  tooltip.value.visible = false;
};

const handleTimeRangeKeyDown = (event: KeyboardEvent, currentIndex: number) => {
  let newIndex = currentIndex;
  
  switch (event.key) {
    case 'ArrowLeft':
      newIndex = Math.max(0, currentIndex - 1);
      break;
    case 'ArrowRight':
      newIndex = Math.min(timeRanges.length - 1, currentIndex + 1);
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = timeRanges.length - 1;
      break;
    default:
      return;
  }
  
  if (newIndex !== currentIndex) {
    event.preventDefault();
    setTimeRange(timeRanges[newIndex]);
    // Focus the new button
    const buttons = (event.currentTarget as HTMLElement)?.parentElement?.querySelectorAll('button');
    if (buttons && buttons[newIndex]) {
      (buttons[newIndex] as HTMLButtonElement).focus();
    }
  }
};

// Watch for theme changes
const themeObserver = new MutationObserver(() => {
  if (renderer) {
    render();
  }
});

onMounted(() => {
  if (!canvas.value || !chartContainer.value) return;
  
  const dimensions = getDimensions();
  const config = getActiveConfig();
  
  renderer = createChartRenderer(canvas.value, dimensions, config);
  
  // Set up resize observer
  resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(chartContainer.value);
  
  // Observe theme changes
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  // Initial render
  render();
  
  // Start optimized render loop with FPS limiting
  let lastRenderTime = 0;
  const targetFPS = 30;
  const frameInterval = 1000 / targetFPS;
  
  const renderLoop = (currentTime: number) => {
    const deltaTime = currentTime - lastRenderTime;
    
    if (deltaTime >= frameInterval) {
      render();
      lastRenderTime = currentTime - (deltaTime % frameInterval);
    }
    
    requestAnimationFrame(renderLoop);
  };
  requestAnimationFrame(renderLoop);
});

onUnmounted(() => {
  cleanupChartData();
  
  if (renderer) {
    renderer.stopAnimation();
  }
  
  if (resizeObserver && chartContainer.value) {
    resizeObserver.disconnect();
  }
  
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  
  themeObserver.disconnect();
});
</script>