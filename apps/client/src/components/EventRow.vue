<template>
  <div class="relative max-w-full w-full">
    <div 
      class="group relative p-2.5 mobile:p-2 rounded-lg border border-[var(--theme-border-primary)]/15 hover:border-[var(--theme-primary)]/25 bg-[var(--theme-bg-primary)]/90 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md w-full overflow-hidden min-h-[100px]"
      @click="toggleExpanded"
    >
      <div class="ml-0">
        <div class="hidden mobile:block mb-1.5">
          <div class="flex items-center justify-between mb-1">
            <UBadge 
              variant="soft"
              size="xs"
              class="font-semibold shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105"
              :style="{ 
                ...appBgStyle, 
                ...appBorderStyle,
                backgroundImage: `linear-gradient(135deg, ${appHexColor}20, ${appHexColor}10)`
              }"
              data-testid="mobile-app-badge"
            >
              {{ event.source_app }}
            </UBadge>
            <span class="text-[10px] text-[var(--theme-text-tertiary)]">{{ formatTime(event.timestamp) }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <UBadge 
              variant="outline"
              size="xs"
              class="text-[var(--theme-text-secondary)] bg-[var(--theme-bg-tertiary)]/50"
              :class="borderColorClass"
              :style="{ borderColor: appHexColor }"
              data-testid="mobile-session-badge"
            >
              {{ sessionIdShort }}
            </UBadge>
            <UBadge 
              variant="solid"
              color="primary"
              size="xs"
              class="font-medium bg-gradient-to-r from-[var(--theme-primary)]/10 to-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/20"
              data-testid="event-type-badge"
            >
              <component :is="eventIcon" class="mr-1 h-3.5 w-3.5" />
              {{ event.hook_event_type }}
            </UBadge>
          </div>
        </div>

        <div class="flex items-center justify-between mb-1 mobile:hidden min-h-[28px]">
          <div class="flex items-center space-x-3 w-full">
            <div class="flex items-center gap-2.5 flex-1 min-w-0">
              <UBadge 
                variant="soft"
                size="sm"
                class="text-[13px] font-semibold text-[var(--theme-text-primary)] bg-[var(--theme-bg-tertiary)]/50"
                :style="appBorderStyle"
                data-testid="desktop-app-badge"
              >
                {{ event.source_app }}
              </UBadge>
              <UBadge 
                variant="outline"
                size="xs"
                class="text-[10px] text-[var(--theme-text-tertiary)] bg-[var(--theme-bg-tertiary)]/40"
                :class="borderColorClass"
                :style="{ borderColor: appHexColor }"
                data-testid="desktop-session-badge"
              >
                {{ sessionIdShort }}
              </UBadge>
            </div>
          </div>
          <div class="ml-3 text-[10px] text-[var(--theme-text-tertiary)] whitespace-nowrap">{{ formatTime(event.timestamp) }}</div>
        </div>
        
        <div class="flex items-center justify-between mb-1.5 mobile:hidden" v-if="!isGroup">
          <div v-if="toolInfo" class="text-[13px] text-[var(--theme-text-secondary)] font-medium space-x-2 flex items-center">
            <component :is="eventIcon" class="h-5 w-5 text-[var(--theme-primary)]" />
            <span class="font-medium">{{ toolInfo.tool }}</span>
            <span v-if="toolInfo.detail" class="ml-2 text-[var(--theme-text-tertiary)]" :class="{ 'italic': event.hook_event_type === 'UserPromptSubmit' }">{{ toolInfo.detail }}</span>
          </div>
          
          <div v-if="event.summary" class="max-w-[55%] md:max-w-[60%] lg:max-w-[68%] xl:max-w-[72%] 2xl:max-w-[78%] px-2.5 py-1.5 bg-[var(--theme-bg-tertiary)]/40 border border-[var(--theme-border-primary)]/25 rounded-md backdrop-blur-sm overflow-hidden text-ellipsis">
            <span class="text-[12px] text-[var(--theme-text-primary)] font-medium flex items-center gap-1.5">
              <FileText class="h-3 w-3 text-[var(--theme-primary)]" />
              {{ event.summary }}
            </span>
          </div>
        </div>
        <div v-else class="mb-1.5 mobile:hidden">
          <div class="text-xs text-[var(--theme-text-secondary)] font-medium mb-2 flex items-center gap-2">
            <component :is="eventIcon" class="h-3 w-3 text-[var(--theme-primary)]" />
            {{ event.hook_event_type }} · {{ groupMeta.tool || actionLabel }} • {{ groupMeta.count }}
          </div>
          <div class="flex flex-wrap gap-1">
            <UBadge 
              v-for="(chip, i) in readFilesUnique.slice(0,8)" 
              :key="chip+i"
              variant="outline"
              size="xs"
              class="border-[var(--theme-border-primary)]/30 bg-gradient-to-r from-[var(--theme-bg-tertiary)]/50 to-[var(--theme-bg-quaternary)]/50 text-[var(--theme-text-secondary)] hover:scale-105 transition-transform duration-150"
              :data-testid="`file-chip-${i}`"
            >
              {{ chip }}
            </UBadge>
            <span v-if="readFilesUnique.length>8" class="text-xs text-[var(--theme-text-tertiary)] flex items-center gap-0.5" data-testid="more-files-indicator">
              <MoreHorizontal class="h-3 w-3" />
              {{ readFilesUnique.length-8 }}
            </span>
          </div>
        </div>

        <div class="space-y-2 hidden mobile:block mb-2">
          <div v-if="toolInfo" class="text-sm text-[var(--theme-text-secondary)] font-semibold w-full">
            <span class="font-medium">{{ toolInfo.tool }}</span>
            <span v-if="toolInfo.detail" class="ml-2 text-[var(--theme-text-tertiary)]" :class="{ 'italic': event.hook_event_type === 'UserPromptSubmit' }">{{ toolInfo.detail }}</span>
          </div>
          
          <div v-if="event.summary" class="w-full px-2 py-1 bg-gradient-to-r from-[var(--theme-primary)]/5 to-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 rounded-lg shadow-sm backdrop-blur-sm">
            <span class="text-xs text-[var(--theme-text-primary)] font-semibold flex items-center gap-1">
              <FileText class="h-3 w-3 text-[var(--theme-primary)]" />
              {{ event.summary }}
            </span>
          </div>
        </div>
        
      </div>
    </div>
    <ChatTranscriptModal 
      v-if="frozenChatData.length > 0"
      :key="`chat-modal-${event.session_id}-${event.timestamp}`"
      :is-open="showChatModal"
      :chat="frozenChatData"
      @close="showChatModal = false; frozenChatData = [];"
    />
    <EventDetailsModal 
      v-if="showDetailsModal && !(event.hook_event_type === 'Stop' && event.chat && event.chat.length > 0)" 
      :is-open="showDetailsModal" 
      :event="event" 
      @close="showDetailsModal = false" 
    />
  </div>
</template>

<style scoped>
.node:hover .dot { 
  transform: scale(1.25); 
  filter: brightness(1.2);
}

.expand-enter-active,
.expand-leave-active {
  transition: opacity 220ms cubic-bezier(0.2, 0.7, 0.2, 1),
              transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1),
              max-height 260ms cubic-bezier(0.2, 0.7, 0.2, 1),
              padding 200ms ease;
  will-change: max-height, transform, opacity;
}

.expand-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
  max-height: 1000px;
}

.expand-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  max-height: 1000px;
}

.expand-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* Smooth layout when rows change height */
:global(.event-move) { 
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1); 
}

/* Hover lift effect */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px) scale(1.01);
}
</style>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Check, MessageSquare, Wrench, Bell, Square, Box, FileText, MoreHorizontal } from 'lucide-vue-next';
import type { HookEvent } from '../types';
import ChatTranscriptModal from './ChatTranscriptModal.vue';
import EventDetailsModal from './EventDetailsModal.vue';
// UBadge component will be globally available via plugin

const props = defineProps<{
  event: HookEvent;
  gradientClass: string;
  colorClass: string;
  appGradientClass: string;
  appColorClass: string;
  appHexColor: string;
}>();

const showChatModal = ref(false);
const showDetailsModal = ref(false);

// Store a frozen copy of chat data to prevent re-renders
const frozenChatData = ref<any[]>([]);

const toggleExpanded = () => {
  // For Stop events with chat data, open chat modal directly
  if (props.event.hook_event_type === 'Stop' && props.event.chat && props.event.chat.length > 0) {
    // Create a deep frozen copy of the chat data to prevent re-renders
    frozenChatData.value = JSON.parse(JSON.stringify(props.event.chat));
    showChatModal.value = true;
  } else {
    showDetailsModal.value = true;
  }
};

const sessionIdShort = computed(() => {
  return props.event.session_id.slice(0, 8);
});

const eventIcon = computed(() => {
  switch (props.event.hook_event_type) {
    case 'PreToolUse':
      return Wrench;
    case 'PostToolUse':
      return Check;
    case 'Notification':
      return Bell;
    case 'Stop':
      return Square;
    case 'PreCompact':
      return Box;
    default:
      return MessageSquare;
  }
});

const actionLabel = computed(() => {
  const t = (groupMeta.value.tool || '').toLowerCase();
  if (t.includes('read')) return 'Read';
  if (t.includes('write') && t.includes('multi')) return 'MultiWrite';
  if (t.includes('todowrite') || t.includes('todo')) return 'ToDoWrite';
  if (t.includes('write')) return 'Write';
  if (t.includes('exit')) return 'ExitPlanMode';
  return 'Action';
});

// actionIcon computed property removed as it's no longer used

const borderColorClass = computed(() => {
  // Convert bg-color-500 to border-color-500
  return props.colorClass.replace('bg-', 'border-');
});


const appBorderStyle = computed(() => {
  return {
    borderColor: props.appHexColor
  };
});

const appBgStyle = computed(() => {
  // Use the hex color with 20% opacity
  return {
    backgroundColor: props.appHexColor + '33' // Add 33 for 20% opacity in hex
  };
});

const isGroup = computed(() => (props.event as any).meta?.group === 'aggregate');
const groupMeta = computed(() => (props.event as any).meta || {});
const readFiles = computed<string[]>(() => groupMeta.value.chips || []);
const readFilesUnique = computed<string[]>(() => Array.from(new Set(readFiles.value)));

// formattedPayload removed as copy functionality was removed with UBadge migration

const toolInfo = computed(() => {
  const payload = props.event.payload;
  
  // Handle UserPromptSubmit events
  if (props.event.hook_event_type === 'UserPromptSubmit' && payload.prompt) {
    return {
      tool: 'Prompt:',
      detail: `"${payload.prompt.slice(0, 100)}${payload.prompt.length > 100 ? '...' : ''}"`
    };
  }
  
  // Handle tool-based events
  if (payload.tool_name) {
    const info: { tool: string; detail?: string } = { tool: payload.tool_name };
    
    if (payload.tool_input) {
      if (payload.tool_input.command) {
        info.detail = payload.tool_input.command.slice(0, 50) + (payload.tool_input.command.length > 50 ? '...' : '');
      } else if (payload.tool_input.file_path) {
        info.detail = payload.tool_input.file_path.split('/').pop();
      } else if (payload.tool_input.pattern) {
        info.detail = payload.tool_input.pattern;
      }
    }
    
    return info;
  }
  
  return null;
});

const formatTime = (timestamp?: number) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

// Copy functions removed as they're no longer used after UBadge migration
</script>