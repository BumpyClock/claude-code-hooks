<template>
  <div 
    v-if="data && data.length > 0 && hasEvents"
    class="rounded-lg px-3 py-2 shadow-lg text-xs font-medium relative z-[9999]"
    style="background: hsl(var(--card)) !important; border: 1px solid hsl(var(--border)) !important; color: hsl(var(--card-foreground)) !important; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25) !important; position: relative !important; z-index: 9999 !important;"
  >
    <div class="mb-2" style="color: hsl(var(--muted-foreground)) !important;">{{ title || data[0]?.time }}</div>
    
    <!-- Event type breakdown -->
    <div v-if="eventTypeEntries.length > 0" class="space-y-1.5">
      <div 
        v-for="([eventType, count], index) in eventTypeEntries" 
        :key="eventType"
        class="flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2 min-w-0">
          <div 
            class="w-2 h-2 rounded-full flex-shrink-0"
            :class="getEventTypeColor(eventType, index)"
          ></div>
          <span class="truncate text-xs" style="color: hsl(var(--foreground)) !important;">{{ eventType }}</span>
        </div>
        <span class="font-medium flex-shrink-0" style="color: hsl(var(--foreground)) !important;">{{ count }}</span>
      </div>
    </div>
    
    <!-- Tool breakdown -->
    <div v-if="toolEntries.length > 0" class="mt-3">
      <div class="text-[10px] font-medium mb-1.5" style="color: hsl(var(--muted-foreground)) !important;">Tools Used</div>
      
      <!-- Compact layout for many tools (more than 4) -->
      <div v-if="toolEntries.length > 4" class="grid grid-cols-2 gap-1">
        <div 
          v-for="([toolName, count], index) in toolEntries.slice(0, 6)" 
          :key="toolName"
          class="flex items-center gap-1.5"
        >
          <component 
            :is="getToolIcon(toolName)" 
            class="w-2.5 h-2.5 flex-shrink-0" 
            :style="{ color: getToolIconColor(toolName, index) }"
          />
          <span class="truncate text-[10px]" style="color: hsl(var(--foreground)) !important;">{{ toolName }}</span>
          <span class="text-[10px] font-medium ml-auto" style="color: hsl(var(--foreground)) !important;">{{ count }}</span>
        </div>
        <div v-if="toolEntries.length > 6" class="col-span-2 text-center">
          <span class="text-[9px]" style="color: hsl(var(--muted-foreground)) !important;">
            +{{ toolEntries.length - 6 }} more tools
          </span>
        </div>
      </div>
      
      <!-- Regular layout for few tools (4 or less) -->
      <div v-else class="space-y-1">
        <div 
          v-for="([toolName, count], index) in toolEntries" 
          :key="toolName"
          class="flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-2 min-w-0">
            <component 
              :is="getToolIcon(toolName)" 
              class="w-3 h-3 flex-shrink-0" 
              :style="{ color: getToolIconColor(toolName, index) }"
            />
            <span class="truncate text-xs font-medium" style="color: hsl(var(--foreground)) !important;">{{ toolName }}</span>
          </div>
          <span class="font-medium flex-shrink-0" style="color: hsl(var(--foreground)) !important;">{{ count }}</span>
        </div>
      </div>
    </div>
    
    <!-- Total if multiple types or tools -->
    <div 
      v-if="eventTypeEntries.length > 1 || toolEntries.length > 0" 
      class="mt-3 pt-1.5 flex items-center justify-between"
      style="border-top: 1px solid hsl(var(--border)) !important;"
    >
      <span class="text-xs" style="color: hsl(var(--muted-foreground)) !important;">Total Events</span>
      <span class="font-medium" style="color: hsl(var(--foreground)) !important;">{{ totalEvents }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { 
  FileText, Edit3, PenTool, Search, Terminal, Settings, 
  FolderOpen, Eye, Globe, Database, CheckSquare, Code,
  Zap, Play, Hash, List, Wrench, BookOpen
} from 'lucide-vue-next';

const props = defineProps<{
  title?: string;
  data?: Array<{
    time?: string;
    events?: number;
    value?: number;
    name?: string;
    color?: string;
    eventTypes?: Record<string, number>;
    tools?: Record<string, number>;
  }>;
}>();

const hasEvents = computed(() => {
  const item = props.data?.[0];
  return (item?.events || item?.value || 0) > 0;
});

const eventTypeEntries = computed(() => {
  const item = props.data?.[0];
  const eventTypes = item?.eventTypes || {};
  return Object.entries(eventTypes)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a); // Sort by count descending
});

const toolEntries = computed(() => {
  const item = props.data?.[0];
  const tools = item?.tools || {};
  
  return Object.entries(tools)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a); // Sort by count descending
});

const totalEvents = computed(() => {
  const item = props.data?.[0];
  return item?.events || item?.value || 0;
});

const getEventTypeColor = (eventType: string, index: number) => {
  const colors = [
    'bg-[var(--theme-primary)]',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
  ];
  
  // Use consistent color for common event types
  const typeColorMap: Record<string, string> = {
    'PreToolUse': 'bg-blue-500',
    'PostToolUse': 'bg-green-500',
    'UserPromptSubmit': 'bg-[var(--theme-primary)]',
    'PrePromptCompletion': 'bg-yellow-500',
    'PostPromptCompletion': 'bg-purple-500',
  };
  
  return typeColorMap[eventType] || colors[index % colors.length];
};

const getToolColor = (toolName: string, index: number) => {
  const colors = [
    'bg-gradient-to-br from-purple-400 to-blue-500',
    'bg-gradient-to-br from-green-400 to-teal-500',
    'bg-gradient-to-br from-orange-400 to-red-500',
    'bg-gradient-to-br from-cyan-400 to-blue-500',
    'bg-gradient-to-br from-pink-400 to-purple-500',
    'bg-gradient-to-br from-yellow-400 to-orange-500',
    'bg-gradient-to-br from-indigo-400 to-purple-500',
    'bg-gradient-to-br from-teal-400 to-green-500',
  ];
  
  // Use consistent color for common tool names
  const toolColorMap: Record<string, string> = {
    'Read': 'bg-gradient-to-br from-blue-400 to-blue-600',
    'Write': 'bg-gradient-to-br from-green-400 to-green-600',
    'Edit': 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    'MultiEdit': 'bg-gradient-to-br from-orange-400 to-orange-600',
    'Bash': 'bg-gradient-to-br from-gray-400 to-gray-600',
    'Task': 'bg-gradient-to-br from-purple-400 to-purple-600',
    'TodoWrite': 'bg-gradient-to-br from-pink-400 to-pink-600',
    'Grep': 'bg-gradient-to-br from-cyan-400 to-cyan-600',
    'Glob': 'bg-gradient-to-br from-indigo-400 to-indigo-600',
    'LS': 'bg-gradient-to-br from-teal-400 to-teal-600',
  };
  
  return toolColorMap[toolName] || colors[index % colors.length];
};

const getToolIcon = (toolName: string) => {
  const toolIconMap: Record<string, any> = {
    'Read': FileText,
    'Write': PenTool,
    'Edit': Edit3,
    'MultiEdit': Edit3,
    'Bash': Terminal,
    'Task': Settings,
    'TodoWrite': CheckSquare,
    'Grep': Search,
    'Glob': Search,
    'LS': FolderOpen,
    'WebFetch': Globe,
    'WebSearch': Globe,
    'mcp': Database,
    'ExitPlanMode': Play,
    'NotebookEdit': BookOpen,
    'NotebookRead': Eye,
    'Code': Code,
    'Hash': Hash,
    'List': List,
  };
  
  return toolIconMap[toolName] || Wrench;
};

const getToolIconColor = (toolName: string, index: number) => {
  const toolColorMap: Record<string, string> = {
    'Read': '#3b82f6',       // Blue
    'Write': '#10b981',      // Green  
    'Edit': '#f59e0b',       // Yellow
    'MultiEdit': '#ea580c',  // Orange
    'Bash': '#6b7280',       // Gray
    'Task': '#8b5cf6',       // Purple
    'TodoWrite': '#ec4899',  // Pink
    'Grep': '#06b6d4',       // Cyan
    'Glob': '#6366f1',       // Indigo
    'LS': '#059669',         // Teal
    'WebFetch': '#3b82f6',   // Blue
    'WebSearch': '#06b6d4',  // Cyan
    'mcp': '#8b5cf6',        // Purple
    'ExitPlanMode': '#10b981', // Green
    'NotebookEdit': '#f59e0b', // Yellow
    'NotebookRead': '#3b82f6', // Blue
  };
  
  const fallbackColors = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4', '#6366f1', '#059669'];
  return toolColorMap[toolName] || fallbackColors[index % fallbackColors.length];
};
</script>