<template>
  <div class="relative pl-32">
    <div class="absolute left-0 top-4 w-28 pr-4 text-right">
      <div class="text-[10px] leading-3 font-mono tracking-tight text-[var(--theme-text-quaternary)] select-none opacity-50 hover:opacity-100 transition-opacity duration-200">
        {{ formatTime(event.timestamp) }}
      </div>
    </div>
    <div class="absolute left-32 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[var(--theme-border-primary)]/30 to-transparent"></div>
    <div 
      class="absolute left-[calc(8rem-5px)] top-4 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--theme-bg-secondary)] transition-all duration-300 ease-out"
      :class="{ 'scale-150 shadow-lg': isExpanded }"
      :style="{ 
        background: `linear-gradient(135deg, ${appHexColor}, ${appHexColor}dd)`,
        boxShadow: isExpanded ? `0 0 16px ${appHexColor}50` : `0 0 8px ${appHexColor}20`
      }"
    ></div>
    <div 
      class="group ml-8 relative p-3 mobile:p-2 rounded-lg border border-[var(--theme-border-primary)]/20 hover:border-[var(--theme-primary)]/40 bg-[var(--theme-bg-primary)]/95 backdrop-blur-sm transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
      :class="{ 
        'ring-1 ring-[var(--theme-primary)]/20 border-[var(--theme-primary)]/40 shadow-lg bg-[var(--theme-bg-primary)]': isExpanded
      }"
      @click="toggleExpanded"
    >
      <div class="ml-0">
        <div class="hidden mobile:block mb-2">
          <div class="flex items-center justify-between mb-1">
            <span 
              class="text-xs font-semibold text-[var(--theme-text-primary)] px-1.5 py-0.5 rounded-full border-2 bg-gradient-to-br shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105"
              :style="{ 
                ...appBgStyle, 
                ...appBorderStyle,
                backgroundImage: `linear-gradient(135deg, ${appHexColor}20, ${appHexColor}10)`
              }"
            >
              {{ event.source_app }}
            </span>
            <span class="sr-only">
              {{ formatTime(event.timestamp) }}
            </span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs text-[var(--theme-text-secondary)] px-1.5 py-0.5 rounded-full border bg-[var(--theme-bg-tertiary)]/50" :class="borderColorClass">
              {{ sessionIdShort }}
            </span>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-[var(--theme-primary)]/10 to-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/20">
              <component :is="eventIcon" class="mr-1 h-3.5 w-3.5" />
              {{ event.hook_event_type }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between mb-1.5 mobile:hidden">
          <div class="flex items-center space-x-4">
            <span 
              class="text-base font-bold text-[var(--theme-text-primary)] px-2 py-0.5 rounded-full border-2 bg-gradient-to-br shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
              :style="{ 
                ...appBgStyle, 
                ...appBorderStyle,
                backgroundImage: `linear-gradient(135deg, ${appHexColor}20, ${appHexColor}10)`
              }"
            >
              {{ event.source_app }}
            </span>
            <span class="text-xs text-[var(--theme-text-secondary)] px-2 py-0.5 rounded border bg-[var(--theme-bg-tertiary)]/50" :class="borderColorClass">
              {{ sessionIdShort }}
            </span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gradient-to-r from-[var(--theme-primary)]/10 to-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/20">
              <component :is="eventIcon" class="mr-1 h-3.5 w-3.5" />
              {{ event.hook_event_type }}
            </span>
          </div>
          <span class="sr-only">
            {{ formatTime(event.timestamp) }}
          </span>
        </div>
        
        <div class="flex items-center justify-between mb-1.5 mobile:hidden" v-if="!isGroup">
          <div v-if="toolInfo" class="text-base text-[var(--theme-text-secondary)] font-semibold">
            <span class="font-medium">{{ toolInfo.tool }}</span>
            <span v-if="toolInfo.detail" class="ml-2 text-[var(--theme-text-tertiary)]" :class="{ 'italic': event.hook_event_type === 'UserPromptSubmit' }">{{ toolInfo.detail }}</span>
          </div>
          
          <div v-if="event.summary" class="max-w-[50%] px-2.5 py-1 bg-gradient-to-r from-[var(--theme-primary)]/5 to-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 rounded-lg backdrop-blur-sm">
            <span class="text-xs text-[var(--theme-text-primary)] font-medium flex items-center gap-1">
              <FileText class="h-3 w-3 text-[var(--theme-primary)]" />
              {{ event.summary }}
            </span>
          </div>
        </div>
        <div v-else class="mb-1.5 mobile:hidden">
          <div class="text-xs text-[var(--theme-text-secondary)] font-medium mb-1 flex items-center gap-1">
            <component :is="actionIcon" class="h-3 w-3 text-[var(--theme-primary)]" />
            {{ event.hook_event_type }} · {{ groupMeta.tool || 'Read' }} • {{ groupMeta.count }}
          </div>
          <div class="flex flex-wrap gap-1">
            <span v-for="(chip, i) in readFilesUnique.slice(0,8)" :key="chip+i" class="px-2 py-0.5 rounded-md border border-[var(--theme-border-primary)]/30 bg-gradient-to-r from-[var(--theme-bg-tertiary)]/50 to-[var(--theme-bg-quaternary)]/50 text-[var(--theme-text-secondary)] text-xs hover:scale-105 transition-transform duration-150">
              {{ chip }}
            </span>
            <span v-if="readFilesUnique.length>8" class="text-xs text-[var(--theme-text-tertiary)] flex items-center gap-0.5">
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
        
        <Transition name="expand">
          <div v-if="isExpanded" class="mt-2 pt-2 border-t-2 border-[var(--theme-primary)] bg-gradient-to-r from-[var(--theme-bg-primary)] to-[var(--theme-bg-secondary)] rounded-b-lg p-3 space-y-3">
            <div>
              <div class="flex items-center justify-between mb-2 pr-10" v-if="isGroup && !isExpanded">
              <h4 class="text-sm mobile:text-xs font-medium text-[var(--theme-text-primary)] flex items-center gap-1.5">
                <component :is="actionIcon" class="h-4 w-4" />
                {{ props.event.hook_event_type }}<span> · {{ groupMeta.tool || actionLabel }}</span> • {{ groupMeta.count }}
              </h4>
            </div>
            <div class="flex items-center justify-between mb-2 pr-10" v-else>
              <h4 class="text-base mobile:text-sm font-bold text-[var(--theme-primary)] drop-shadow-sm flex items-center">
                <PackageIcon class="mr-1.5 h-4 w-4" />
                Payload
              </h4>
            </div>
            <pre v-if="!isGroup" class="relative group/payload text-sm mobile:text-xs text-[var(--theme-text-primary)] bg-[var(--theme-bg-tertiary)] p-3 mobile:p-2 rounded-lg overflow-x-auto max-h-64 overflow-y-auto font-mono border border-[var(--theme-primary)]/30 shadow-md hover:shadow-lg transition-shadow duration-200">
{{ formattedPayload }}
              <button
                @click.stop="copyPayload"
                class="absolute top-1.5 right-1.5 h-6 w-6 p-0 grid place-items-center text-[11px] rounded bg-[var(--theme-bg-primary)]/60 hover:bg-[var(--theme-bg-primary)] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border-primary)]/40 hover:border-[var(--theme-border-primary)] transition-colors duration-150 shadow-sm opacity-0 group-hover/payload:opacity-100"
                :title="copyButtonTitle"
              >
                <Copy v-if="copyButtonIcon === 'copy'" class="h-3.5 w-3.5" />
                <Check v-else-if="copyButtonIcon === 'check'" class="h-3.5 w-3.5" />
                <X v-else class="h-3.5 w-3.5" />
              </button>
            </pre>
            <div v-else class="text-sm mobile:text-xs text-[var(--theme-text-primary)] bg-[var(--theme-bg-tertiary)] p-3 mobile:p-2 rounded-lg border border-[var(--theme-primary)]/30">
              <div class="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                <span v-for="(f,i) in readFiles.slice(0,6)" :key="f+i" class="px-2 py-0.5 rounded border border-[var(--theme-border-primary)]/50 bg-[var(--theme-bg-primary)] text-[var(--theme-text-secondary)] text-xs">
                  {{ f }}
                </span>
                <span v-if="readFiles.length>6" class="text-xs text-[var(--theme-text-tertiary)]">+{{ readFiles.length-6 }} more</span>
              </div>
              <div class="space-y-2">
                <pre v-for="(child, idx) in groupMeta.children" :key="idx" class="relative group/child text-xs text-[var(--theme-text-primary)] bg-[var(--theme-bg-primary)] p-2 rounded border border-[var(--theme-border-primary)]/40 overflow-x-auto">
{{ JSON.stringify(child.payload, null, 2) }}
                  <button
                    @click.stop="copyChild(idx)"
                    class="absolute top-1.5 right-1.5 h-6 w-6 p-0 grid place-items-center text-[11px] rounded bg-[var(--theme-bg-primary)]/60 hover:bg-[var(--theme-bg-primary)] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border-primary)]/40 hover:border-[var(--theme-border-primary)] transition-colors duration-150 shadow-sm opacity-0 group-hover/child:opacity-100"
                    title="Copy payload"
                  >
                    <Copy v-if="childCopyState(idx) === 'copy'" class="h-3.5 w-3.5" />
                    <Check v-else-if="childCopyState(idx) === 'check'" class="h-3.5 w-3.5" />
                    <X v-else class="h-3.5 w-3.5" />
                  </button>
                </pre>
              </div>
            </div>
          </div>
          
          <div v-if="event.chat && event.chat.length > 0" class="flex justify-end">
            <button
              @click.stop="!isMobile && (showChatModal = true)"
              :class="[
                'px-4 py-2 mobile:px-3 mobile:py-1.5 font-bold rounded-lg transition-all duration-200 flex items-center space-x-1.5 shadow-md hover:shadow-lg',
                isMobile 
                  ? 'bg-[var(--theme-bg-quaternary)] cursor-not-allowed opacity-50 text-[var(--theme-text-quaternary)] border border-[var(--theme-border-tertiary)]' 
                  : 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-light)] hover:from-[var(--theme-primary-dark)] hover:to-[var(--theme-primary)] text-white border border-[var(--theme-primary-dark)] transform hover:scale-105'
              ]"
              :disabled="isMobile"
            >
              <MessageSquare class="h-4 w-4" />
              <span class="text-sm mobile:text-xs font-bold drop-shadow-sm">
                {{ isMobile ? 'Not available in mobile' : `View Chat Transcript (${event.chat.length} messages)` }}
              </span>
            </button>
          </div>
          </div>
        </Transition>
      </div>
    </div>
    <ChatTranscriptModal 
      v-if="event.chat && event.chat.length > 0"
      :is-open="showChatModal"
      :chat="event.chat"
      @close="showChatModal = false"
    />
  </div>
</template>

<style scoped>
.node:hover .dot { 
  transform: scale(1.25); 
  filter: brightness(1.2);
}

.expand-enter-active { 
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1); 
}

.expand-leave-active { 
  transition: all 200ms cubic-bezier(0.4, 0, 1, 1); 
}

.expand-enter-from { 
  opacity: 0; 
  transform: translateY(-10px) scale(0.95); 
}

.expand-leave-to { 
  opacity: 0; 
  transform: translateY(-5px) scale(0.95); 
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
import { Copy, Check, X, MessageSquare, Package as PackageIcon, Wrench, Bell, Square, Box, FileText, Pencil, ListTodo, Files, LogOut, MoreHorizontal } from 'lucide-vue-next';
import type { HookEvent } from '../types';
import { useMediaQuery } from '../composables/useMediaQuery';
import ChatTranscriptModal from './ChatTranscriptModal.vue';

const props = defineProps<{
  event: HookEvent;
  gradientClass: string;
  colorClass: string;
  appGradientClass: string;
  appColorClass: string;
  appHexColor: string;
}>();

const isExpanded = ref(false);
const showChatModal = ref(false);
const copyButtonText = ref('Copy');
const copyButtonIcon = computed(() => (copyButtonText.value.includes('Copied') ? 'check' : copyButtonText.value.includes('Failed') ? 'x' : 'copy'));
const copyButtonTitle = computed(() => copyButtonText.value);

// Media query for responsive design
const { isMobile } = useMediaQuery();

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
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

const actionIcon = computed(() => {
  const label = actionLabel.value;
  switch (label) {
    case 'Read':
      return FileText;
    case 'Write':
      return Pencil;
    case 'ToDoWrite':
      return ListTodo;
    case 'MultiWrite':
      return Files;
    case 'ExitPlanMode':
      return LogOut;
    default:
      return PackageIcon;
  }
});

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

const formattedPayload = computed(() => {
  return JSON.stringify(props.event.payload, null, 2);
});

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

const copyPayload = async () => {
  try {
    await navigator.clipboard.writeText(formattedPayload.value);
    copyButtonText.value = 'Copied!';
    setTimeout(() => {
      copyButtonText.value = 'Copy';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    copyButtonText.value = 'Failed';
    setTimeout(() => {
      copyButtonText.value = 'Copy';
    }, 2000);
  }
};

const childCopyStates = ref<Map<number, 'copy' | 'check' | 'x'>>(new Map());
const childCopyState = (idx: number) => childCopyStates.value.get(idx) || 'copy';
const copyChild = async (idx: number) => {
  try {
    const child = groupMeta.value.children[idx];
    await navigator.clipboard.writeText(JSON.stringify(child.payload, null, 2));
    childCopyStates.value.set(idx, 'check');
    childCopyStates.value = new Map(childCopyStates.value);
    setTimeout(() => {
      childCopyStates.value.delete(idx);
      childCopyStates.value = new Map(childCopyStates.value);
    }, 1500);
  } catch (e) {
    childCopyStates.value.set(idx, 'x');
    childCopyStates.value = new Map(childCopyStates.value);
    setTimeout(() => {
      childCopyStates.value.delete(idx);
      childCopyStates.value = new Map(childCopyStates.value);
    }, 1500);
  }
};
</script>