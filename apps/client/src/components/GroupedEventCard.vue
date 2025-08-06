<template>
  <div class="relative max-w-full w-full px-1.5 md:px-2">
    <Card 
      class="group relative cursor-pointer transition-all duration-200 hover:shadow-lg border border-border/30 hover:border-primary/30 bg-card w-full overflow-visible hover-lift focus-within:ring-2 focus-within:ring-primary/40"
      @click="toggleExpanded"
    >
      <!-- App Color Bar -->
      <div class="absolute left-0 top-0 bottom-0 w-1.5" :style="{ backgroundColor: appHexColor }"></div>
      
      <div class="pl-4 pr-4 py-2.5 ml-2">
        <!-- Header -->
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="text-[13px] font-semibold tracking-tight text-[var(--theme-text-primary)] truncate max-w-[40%]" title="Project">
              {{ event.source_app }}
            </span>
            <Badge variant="outline" class="font-mono text-[10px] px-1.5 py-0.5 rounded-sm shrink-0" title="Session">
              {{ sessionIdShort }}
            </Badge>
            <Badge variant="soft" class="text-[11px] px-2 py-0.5" :title="`${groupMeta.count} events grouped`">
              <LayersIcon class="h-3 w-3 mr-1" />
              {{ groupMeta.count }}
            </Badge>
          </div>
          <div class="flex items-center gap-2">
            <!-- Time Range -->
            <span class="text-[11px] text-[var(--theme-text-tertiary)] whitespace-nowrap">
              {{ formatTimeRange(groupMeta.timeRange) }}
            </span>
            <!-- Expand Toggle -->
            <Button
              variant="ghost"
              size="sm"
              @click.stop="toggleGroupExpanded"
              class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronDown 
                :class="[
                  'h-3 w-3 transition-transform text-[var(--theme-text-tertiary)]',
                  isGroupExpanded && 'rotate-180'
                ]"
              />
            </Button>
          </div>
        </div>

        <!-- Group Summary -->
        <div class="flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <!-- Event Type and Tool -->
            <div class="flex items-center gap-2 mb-1">
              <Badge variant="soft" class="gap-1 px-2 py-0.5 text-[11px] leading-4">
                <component :is="eventIcon" class="h-3.5 w-3.5 text-primary" />
                <span class="font-medium text-[var(--theme-text-primary)]">{{ event.hook_event_type }}</span>
              </Badge>
              <span v-if="groupMeta.tool" class="text-[12px] text-[var(--theme-text-secondary)]">
                {{ groupMeta.tool }}
              </span>
            </div>

            <!-- Group Description -->
            <div class="text-[13px] font-medium text-[var(--theme-text-primary)] mb-2">
              {{ groupSummary }}
            </div>

            <!-- Time Range Visualization -->
            <div class="mb-3">
              <div class="flex items-center gap-2 text-xs text-[var(--theme-text-tertiary)] mb-1">
                <Clock class="h-3 w-3" />
                <span>{{ formatDuration(groupMeta.timeRange) }} duration</span>
                <span>•</span>
                <span>{{ formatTime(groupMeta.timeRange[0]) }} - {{ formatTime(groupMeta.timeRange[1]) }}</span>
              </div>
              
              <!-- Progress bar showing time span -->
              <div class="w-full h-1.5 bg-[var(--theme-bg-tertiary)] rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-300"
                  :style="{
                    background: `linear-gradient(90deg, ${appHexColor}66, ${appHexColor})`,
                    width: '100%'
                  }"
                ></div>
              </div>
            </div>

            <!-- File/Command Chips -->
            <div class="flex flex-wrap gap-1.5 mb-2">
              <Badge 
                v-for="(chip, i) in displayChips" 
                :key="chip + i"
                variant="outline"
                class="text-[10px] px-1.5 py-0.5 rounded-sm hover:scale-105 transition-transform cursor-pointer"
                @click.stop="copyToClipboard(chip)"
                :title="`Click to copy: ${chip}`"
              >
                {{ chip }}
              </Badge>
              <Badge
                v-if="groupMeta.chips.length > maxDisplayChips"
                variant="outline"
                class="text-[10px] px-1.5 py-0.5 rounded-sm text-[var(--theme-text-tertiary)]"
                @click.stop="showAllChips = !showAllChips"
              >
                {{ showAllChips ? 'show less' : `+${groupMeta.chips.length - maxDisplayChips}` }}
              </Badge>
            </div>

            <!-- AI Summary (if available) -->
            <div v-if="groupMeta.summary" class="text-[12.5px] text-[var(--theme-text-secondary)] leading-5 line-clamp-2 italic">
              {{ groupMeta.summary }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-1">
            <Button 
              variant="ghost"
              size="sm"
              class="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)] p-1 rounded-md hover:bg-[var(--theme-hover-bg)]"
              @click.stop="copyGroupSummary"
              title="Copy group summary"
            >
              <Copy class="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              class="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)] p-1 rounded-md hover:bg-[var(--theme-hover-bg)]"
              aria-label="More options"
            >
              <MoreHorizontal class="w-3 h-3" />
            </Button>
          </div>
        </div>

        <!-- Expanded Individual Events -->
        <div v-if="isGroupExpanded" class="mt-4 border-t border-[var(--theme-border-primary)]/20 pt-3">
          <div class="space-y-2">
            <div class="text-xs font-medium text-[var(--theme-text-secondary)] mb-2 flex items-center gap-2">
              <List class="h-3 w-3" />
              Individual Events ({{ groupMeta.children.length }})
            </div>
            
            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div 
                v-for="(childEvent, index) in groupMeta.children"
                :key="childEvent.id || index"
                class="flex items-start gap-3 p-2 rounded-md bg-[var(--theme-bg-tertiary)]/30 hover:bg-[var(--theme-bg-tertiary)]/50 transition-colors cursor-pointer"
                @click.stop="openChildEvent(childEvent)"
              >
                <div class="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" :style="{ backgroundColor: getColorForSession(childEvent.session_id) }"></div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] mb-1">
                    <span class="font-mono">{{ formatTime(childEvent.timestamp) }}</span>
                    <span>•</span>
                    <span class="truncate">{{ getChildEventDetail(childEvent) }}</span>
                  </div>
                  
                  <div v-if="childEvent.summary" class="text-xs text-[var(--theme-text-tertiary)] line-clamp-1">
                    {{ childEvent.summary }}
                  </div>
                </div>

                <ExternalLink class="h-3 w-3 text-[var(--theme-text-quaternary)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Child Event Modals -->
    <EventDetailsModal 
      v-if="selectedChildEvent && showChildModal"
      :is-open="showChildModal"
      :event="selectedChildEvent"
      @close="showChildModal = false; selectedChildEvent = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  ChevronDown, 
  LayersIcon, 
  Clock, 
  Copy, 
  MoreHorizontal, 
  List, 
  ExternalLink,
  Wrench,
  Check,
  Bell,
  Square,
  Box,
  MessageSquare
} from 'lucide-vue-next'
import type { HookEvent } from '../types'
import type { GroupedEvent } from '../types/grouping'
import EventDetailsModal from './EventDetailsModal.vue'
import { Button } from '@/components/ui/button'
import { Badge, Card } from '@/components/ui'
import { useEventColors } from '../composables/useEventColors'

const props = defineProps<{
  event: GroupedEvent
  gradientClass: string
  colorClass: string
  appGradientClass: string
  appColorClass: string
  appHexColor: string
}>()

const isGroupExpanded = ref(false)
const showAllChips = ref(false)
const selectedChildEvent = ref<HookEvent | null>(null)
const showChildModal = ref(false)

const { getColorForSession } = useEventColors()

const maxDisplayChips = 6

const sessionIdShort = computed(() => {
  return props.event.session_id.slice(0, 8)
})

const groupMeta = computed(() => {
  return props.event.groupMeta
})

const eventIcon = computed(() => {
  switch (props.event.hook_event_type) {
    case 'PreToolUse':
      return Wrench
    case 'PostToolUse':
      return Check
    case 'Notification':
      return Bell
    case 'Stop':
      return Square
    case 'PreCompact':
      return Box
    default:
      return MessageSquare
  }
})

const displayChips = computed(() => {
  if (showAllChips.value) {
    return groupMeta.value.chips
  }
  return groupMeta.value.chips.slice(0, maxDisplayChips)
})

const groupSummary = computed(() => {
  if (groupMeta.value.summary) {
    return groupMeta.value.summary
  }
  
  const tool = groupMeta.value.tool
  const count = groupMeta.value.count
  
  if (tool) {
    switch (tool.toLowerCase()) {
      case 'read':
        return `Read ${count} files`
      case 'write':
        return `Write operations across ${count} files`
      case 'edit':
      case 'multiedit':
        return `Edit operations on ${count} files`
      case 'bash':
        return `Execute ${count} commands`
      case 'task':
        return `Run ${count} agent tasks`
      default:
        return `${tool} operations (${count})`
    }
  }
  
  return `${props.event.hook_event_type} operations (${count})`
})

const formatTimeRange = (timeRange: [number, number]) => {
  const start = new Date(timeRange[0])
  const end = new Date(timeRange[1])
  return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const formatTime = (timestamp?: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const formatDuration = (timeRange: [number, number]) => {
  const durationMs = timeRange[1] - timeRange[0]
  const seconds = Math.round(durationMs / 1000)
  
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

const getChildEventDetail = (event: HookEvent) => {
  const payload = event.payload as any
  
  if (payload?.tool_input?.file_path) {
    return payload.tool_input.file_path.split('/').pop()
  }
  
  if (payload?.tool_input?.command) {
    return payload.tool_input.command.slice(0, 50) + (payload.tool_input.command.length > 50 ? '...' : '')
  }
  
  if (payload?.tool_name) {
    return payload.tool_name
  }
  
  return event.hook_event_type
}

const toggleExpanded = () => {
  // For grouped events, toggle the group expansion instead of opening modal
  toggleGroupExpanded()
}

const toggleGroupExpanded = () => {
  isGroupExpanded.value = !isGroupExpanded.value
}

const openChildEvent = (childEvent: HookEvent) => {
  selectedChildEvent.value = childEvent
  showChildModal.value = true
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // Could add a toast notification here
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

const copyGroupSummary = async () => {
  const summary = `${groupSummary.value}\n\nFiles: ${groupMeta.value.chips.join(', ')}\nTime: ${formatTimeRange(groupMeta.value.timeRange)}\nDuration: ${formatDuration(groupMeta.value.timeRange)}`
  
  await copyToClipboard(summary)
}
</script>

<style scoped>
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px) scale(1.005);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>