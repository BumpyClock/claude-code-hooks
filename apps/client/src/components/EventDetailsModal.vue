<template>
  <Teleport to="body">
    <Transition name="modal" @before-enter="lockScroll" @after-leave="unlockScroll">
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>
        <div class="relative z-[101] w-[min(900px,95vw)] max-h-[85vh] overflow-auto rounded-xl border border-[var(--theme-border-primary)]/30 bg-[var(--theme-bg-primary)] shadow-2xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
          <component :is="eventIcon" class="h-6 w-6 text-[var(--theme-primary)]" />
          {{ event.hook_event_type }}
          <span class="text-xs text-[var(--theme-text-tertiary)] ml-2">{{ formatTime(event.timestamp) }}</span>
        </h3>
        <Button @click="$emit('close')" variant="ghost" size="sm" square>
          <X class="h-5 w-5" />
        </Button>
      </div>
      <div class="space-y-4">
        <div class="flex items-center gap-2 text-sm">
          <span class="px-3 py-1 rounded-lg border bg-gradient-to-r from-[var(--theme-bg-tertiary)]/50 to-[var(--theme-bg-quaternary)]/50 text-[var(--theme-text-primary)] font-medium">{{ event.source_app }}</span>
          <span class="px-3 py-1 rounded-lg border bg-[var(--theme-bg-tertiary)]/40 text-[var(--theme-text-secondary)] font-mono text-xs">{{ sessionIdShort }}</span>
        </div>
        
        <div v-if="toolInfo" class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--theme-bg-tertiary)]/30 border border-[var(--theme-border-primary)]/20">
          <component :is="actionIcon" class="h-5 w-5 text-[var(--theme-primary)]" />
          <span class="font-semibold text-[var(--theme-text-primary)]">{{ toolInfo.tool }}</span>
          <span v-if="toolInfo.detail" class="text-[var(--theme-text-secondary)]" :class="{ 'italic': event.hook_event_type === 'UserPromptSubmit' }">{{ toolInfo.detail }}</span>
        </div>
        
        <div v-if="event.summary" class="px-4 py-3 rounded-lg border bg-gradient-to-r from-[var(--theme-primary)]/5 to-[var(--theme-primary)]/10 border-[var(--theme-primary)]/20">
          <div class="flex items-start gap-2">
            <FileText class="h-4 w-4 text-[var(--theme-primary)] mt-0.5" />
            <span class="text-[var(--theme-text-primary)] font-medium">{{ event.summary }}</span>
          </div>
        </div>
        
        <div class="space-y-2">
          <h4 class="text-sm font-bold text-[var(--theme-primary)] flex items-center gap-1.5">
            <Package class="h-4 w-4" />
            Payload
          </h4>
          <pre class="relative group/payload text-sm text-[var(--theme-text-primary)] bg-[var(--theme-bg-tertiary)] p-4 rounded-lg border border-[var(--theme-border-primary)]/40 overflow-x-auto max-h-96 font-mono shadow-inner">
{{ formattedPayload }}
            <Button
              @click.stop="copyPayload"
              variant="ghost"
              size="xs"
              square
              class="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover/payload:opacity-100"
              :title="copyButtonTitle"
            >
              <Copy v-if="copyButtonIcon === 'copy'" class="h-4 w-4" />
              <Check v-else-if="copyButtonIcon === 'check'" class="h-4 w-4 text-green-500" />
              <X v-else class="h-4 w-4 text-red-500" />
            </Button>
          </pre>
        </div>
        
      </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from > div:last-child {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

.modal-leave-to > div:last-child {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}
</style>
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { HookEvent } from '../types'
import { Wrench, Check, Bell, Square, Box, MessageSquare, X, Copy, FileText, Package, Pencil, ListTodo, Files, LogOut } from 'lucide-vue-next'
import { Button } from '@/components/ui'
import { formatTime } from '../utils'

const props = defineProps<{ isOpen: boolean; event: HookEvent }>()
const emit = defineEmits<{ close: [] }>()

const copyButtonText = ref('Copy')
const copyButtonIcon = computed(() => 
  copyButtonText.value === 'Copied!' ? 'check' : 
  copyButtonText.value === 'Failed' ? 'x' : 'copy'
)
const copyButtonTitle = computed(() => copyButtonText.value)

const sessionIdShort = computed(() => props.event.session_id.slice(0, 8))

const formattedPayload = computed(() => {
  return JSON.stringify(props.event.payload, null, 2)
})

const toolInfo = computed(() => {
  const payload = props.event.payload
  
  if (props.event.hook_event_type === 'UserPromptSubmit' && payload.prompt) {
    return {
      tool: 'Prompt:',
      detail: `"${payload.prompt.slice(0, 100)}${payload.prompt.length > 100 ? '...' : ''}"`
    }
  }
  
  if (payload.tool_name) {
    const info: { tool: string; detail?: string } = { tool: payload.tool_name }
    
    if (payload.tool_input) {
      if (payload.tool_input.command) {
        info.detail = payload.tool_input.command.slice(0, 50) + (payload.tool_input.command.length > 50 ? '...' : '')
      } else if (payload.tool_input.file_path) {
        info.detail = payload.tool_input.file_path.split('/').pop()
      } else if (payload.tool_input.pattern) {
        info.detail = payload.tool_input.pattern
      }
    }
    
    return info
  }
  
  return null
})

const actionIcon = computed(() => {
  const tool = toolInfo.value?.tool?.toLowerCase() || ''
  if (tool.includes('read')) return FileText
  if (tool.includes('write') && tool.includes('multi')) return Files
  if (tool.includes('todowrite') || tool.includes('todo')) return ListTodo
  if (tool.includes('write')) return Pencil
  if (tool.includes('exit')) return LogOut
  return Package
})

const copyPayload = async () => {
  try {
    await navigator.clipboard.writeText(formattedPayload.value)
    copyButtonText.value = 'Copied!'
    setTimeout(() => {
      copyButtonText.value = 'Copy'
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    copyButtonText.value = 'Failed'
    setTimeout(() => {
      copyButtonText.value = 'Copy'
    }, 2000)
  }
}

const lockScroll = () => {
  document.body.style.overflow = 'hidden'
}

const unlockScroll = () => {
  document.body.style.overflow = ''
}

onMounted(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      emit('close')
    }
  }
  window.addEventListener('keydown', handleEsc)
  onUnmounted(() => window.removeEventListener('keydown', handleEsc))
})

const eventIcon = computed(() => {
  switch (props.event.hook_event_type) {
    case 'PreToolUse': return Wrench
    case 'PostToolUse': return Check
    case 'Notification': return Bell
    case 'Stop': return Square
    case 'PreCompact': return Box
    default: return MessageSquare
  }
})

</script>
