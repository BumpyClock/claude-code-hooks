<template>
  <div class="min-h-screen h-full grid grid-rows-[auto,1fr] bg-[var(--theme-bg-secondary)] relative">
    <div class="absolute inset-0 pointer-events-none"></div>

    <header class="border-b border-[var(--theme-border-primary)]/10 bg-[var(--theme-bg-primary)]">
      <div class="px-4 py-3 flex items-center justify-between">
        <div class="sr-only">App header</div>
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 rounded-md bg-[var(--theme-bg-tertiary)] flex items-center justify-center border border-[var(--theme-border-primary)]/40">
            <svg class="w-4 h-4 text-[var(--theme-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 13h18M5 17h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </div>
          <h1 class="text-sm font-semibold text-[var(--theme-text-secondary)] tracking-wide">Multi‑Agent Observability</h1>
        </div>
        <div class="flex items-center gap-2">
          <!-- Project Filter Dropdown -->
          <div class="hidden md:block">
            <Select v-model="localSelectedProject" @update:model-value="updateSelectedProject">
              <SelectTrigger class="h-8 text-xs w-[160px] bg-[var(--theme-bg-primary)] border-[var(--theme-border-primary)]/40 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent class="bg-[var(--theme-bg-primary)] border-[var(--theme-border-primary)]/40">
                <SelectItem value="__ALL__" class="text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]">
                  <div class="flex items-center justify-between w-full">
                    <span>All Projects</span>
                    <Badge variant="secondary" class="ml-2">{{ totalFilteredCount }}</Badge>
                  </div>
                </SelectItem>
                <SelectSeparator />
                <SelectItem 
                  v-for="project in projectsWithCounts" 
                  :key="project.name" 
                  :value="project.name"
                  class="text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-tertiary)]"
                >
                  <div class="flex items-center justify-between w-full">
                    <span>{{ project.name }}</span>
                    <Badge variant="secondary" class="ml-2">{{ project.count }}</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button size="sm" variant="outline" class="text-xs gap-1">
                <component :is="currentThemeIcon" class="w-3 h-3" />
                {{ themes.autoThemeEnabled.value ? 'Auto' : (themes.state.value.currentTheme === 'dark' ? 'Dark' : 'Light') }}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-44">
              <DropdownMenuItem @select="toggleAutoTheme" class="gap-2">
                <Monitor class="w-3 h-3" />
                Auto theme
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @select="themes.setTheme('light')" class="gap-2">
                <Sun class="w-3 h-3" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem @select="themes.setTheme('dark')" class="gap-2">
                <Moon class="w-3 h-3" />
                Dark
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>

    <main class="h-full grid grid-rows-[auto,1fr] min-w-0">
      <div class="sticky top-0 z-30 px-3 py-3 border-b border-[var(--theme-border-primary)]/10 bg-[var(--theme-bg-primary)]/80 backdrop-blur-xl">
        <div class="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-3 items-stretch">
          <Card class="p-3 transition-all duration-200 hover:shadow-lg">
            <div class="space-y-3">
              <!-- System Status Header -->
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
                <span class="text-xs font-medium text-[var(--theme-text-secondary)]">System Metrics</span>
              </div>

              <!-- System Metrics -->
              <div class="grid grid-cols-2 gap-3 text-center">
                <div class="p-2 rounded-md bg-[var(--theme-bg-tertiary)]/30 border border-[var(--theme-border-primary)]/20">
                  <div class="text-lg font-bold text-[var(--theme-text-secondary)]">{{ events.length }}</div>
                  <div class="text-[9px] text-[var(--theme-text-tertiary)] uppercase tracking-wide">Total Events</div>
                </div>
                <div class="p-2 rounded-md bg-[var(--theme-bg-tertiary)]/30 border border-[var(--theme-border-primary)]/20">
                  <div class="text-lg font-bold text-[var(--theme-text-secondary)]">{{ uniqueSessionsCount }}</div>
                  <div class="text-[9px] text-[var(--theme-text-tertiary)] uppercase tracking-wide">Active Sessions</div>
                </div>
              </div>

              <!-- Mobile Project Filter (hidden on desktop) -->
              <div class="md:hidden border-t border-[var(--theme-border-primary)]/20 pt-3">
                <div class="text-[10px] text-[var(--theme-text-tertiary)] mb-2 uppercase tracking-wide">Filter by Project</div>
                <ProjectFilterCards :events="events" :filters="filters as any" v-model:selectedProject="selectedProject" />
              </div>
            </div>
          </Card>
          <Card class="p-0 overflow-hidden transition-all duration-200 hover:shadow-lg">
            <EventHeaderPulse :events="events" :filters="filters as any" :timeline-scroll="timelineScrollPosition" />
          </Card>
        </div>
      </div>

      <div class="min-h-0 min-w-0">
        <Card class="h-full rounded-none">
          <EventTimeline :events="events" :filters="filters as any" @update:filters="filters = $event" :selected-project="selectedProject" v-model:stick-to-bottom="stickToBottom" @scroll-sync="handleTimelineScroll" />
        </Card>
      </div>
    </main>

    <StickScrollButton :stick-to-bottom="stickToBottom" @toggle="stickToBottom = !stickToBottom" />

    <div v-if="error" class="fixed bottom-4 left-4 right-4 sm:right-auto">
      <Alert variant="destructive" class="text-xs">
        <AlertCircle class="w-4 h-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
    </div>

    <ThemeManager :is-open="showThemeManager" @close="showThemeManager = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Sun, Moon, Monitor } from 'lucide-vue-next';
import { useWebSocket } from './composables/useWebSocket';
import { useThemes } from './composables/useThemes';
import EventTimeline from './components/EventTimeline.vue';
import StickScrollButton from './components/StickScrollButton.vue';
import EventHeaderPulse from './components/EventHeaderPulse.vue';
import ThemeManager from './components/ThemeManager.vue';
import ProjectFilterCards from './components/ProjectFilterCards.vue';

const { events, error } = useWebSocket('ws://localhost:4000/stream');
const themes = useThemes();

const filters = ref({ sessionId: '', eventType: '' });
const stickToBottom = ref(true);
const showThemeManager = ref(false);
const showThemeMenu = ref(false);
const selectedProject = ref<string>('');
const localSelectedProject = ref<string>('__ALL__');

const uniqueSessionsCount = computed(() => {
  const sessions = new Set(events.value.map(e => e.session_id));
  return sessions.size;
});

const currentThemeIcon = computed(() => {
  if (themes.autoThemeEnabled.value) return Monitor;
  return themes.state.value.currentTheme === 'dark' ? Moon : Sun;
});

// Project filter logic (moved from ProjectFilterCards)
const projectOf = (e: any) => e.project || e.payload?.project || e.source_app;

const baseFilteredEvents = computed(() => {
  if (!filters.value) return events.value;
  return events.value.filter(event => {
    if (filters.value.sessionId && event.session_id !== filters.value.sessionId) return false;
    if (filters.value.eventType && event.hook_event_type !== filters.value.eventType) return false;
    return true;
  });
});

const totalFilteredCount = computed(() => baseFilteredEvents.value.length);

const projectsWithCounts = computed(() => {
  const projectCounts = new Map();
  baseFilteredEvents.value.forEach(event => {
    const project = projectOf(event);
    projectCounts.set(project, (projectCounts.get(project) || 0) + 1);
  });
  
  return Array.from(projectCounts.entries()).map(([name, count]) => ({ name, count }));
});

const updateSelectedProject = (value: any) => {
  const stringValue = String(value);
  localSelectedProject.value = stringValue || '__ALL__';
  selectedProject.value = (stringValue === '__ALL__' || !stringValue) ? '' : stringValue;
};

const timelineScrollPosition = ref(0);

const handleTimelineScroll = (scrollTop: number) => {
  timelineScrollPosition.value = scrollTop;
};

const toggleAutoTheme = () => {
  if (themes.autoThemeEnabled.value) themes.disableAutoTheme();
  else themes.enableAutoTheme();
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) showThemeMenu.value = false;
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>
