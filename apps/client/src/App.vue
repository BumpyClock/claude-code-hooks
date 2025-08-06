<template>
  <div class="min-h-screen h-full grid grid-rows-[auto,1fr] bg-[var(--theme-bg-secondary)] relative">
    <div class="absolute inset-0 pointer-events-none"></div>

    <header class="sticky top-0 z-40 border-b border-[var(--theme-border-primary)]/10 bg-[var(--theme-bg-primary)]/80 backdrop-blur-xl">
      <div class="px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 rounded-md bg-[var(--theme-bg-tertiary)] flex items-center justify-center border border-[var(--theme-border-primary)]/40">
            <svg class="w-4 h-4 text-[var(--theme-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 13h18M5 17h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </div>
          <h1 class="text-sm font-semibold text-[var(--theme-text-secondary)] tracking-wide">Multi‑Agent Observability</h1>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--theme-text-tertiary)] border border-[var(--theme-border-primary)]/40 rounded-md px-2 py-1">{{ events.length }} events</span>

          <div class="relative">
            <button @click="showThemeMenu = !showThemeMenu" class="text-xs px-2 py-1 rounded-md border border-[var(--theme-border-primary)]/40 hover:bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)]">
              {{ themes.autoThemeEnabled.value ? 'Auto' : (themes.state.value.currentTheme === 'dark' ? 'Dark' : 'Light') }}
            </button>
            <div v-if="showThemeMenu" class="absolute right-0 mt-2 w-40 rounded-md bg-[var(--theme-bg-primary)] border border-[var(--theme-border-primary)]/40 shadow-xl text-[var(--theme-text-secondary)]">
              <button @click="toggleAutoTheme(); showThemeMenu = false" class="w-full px-3 py-2 text-left text-xs hover:bg-[var(--theme-bg-tertiary)]">Auto theme</button>
              <div class="border-t border-[var(--theme-border-primary)]/40"></div>
              <button @click="themes.setTheme('light'); showThemeMenu = false" class="w-full px-3 py-2 text-left text-xs hover:bg-[var(--theme-bg-tertiary)]">Light</button>
              <button @click="themes.setTheme('dark'); showThemeMenu = false" class="w-full px-3 py-2 text-left text-xs hover:bg-[var(--theme-bg-tertiary)]">Dark</button>

            </div>
          </div>
          <div class="flex items-center gap-1 ml-1">
            <span class="h-2 w-2 rounded-full" :class="isConnected ? 'bg-emerald-500' : 'bg-red-500'"></span>
            <span class="text-[10px] text-[var(--theme-text-tertiary)]">{{ isConnected ? 'Live' : 'Offline' }}</span>
          </div>
        </div>
      </div>
    </header>

    <main class="h-full grid grid-rows-[auto,240px,1fr] min-w-0">
      <div class="px-3 py-3 border-b border-[var(--theme-border-primary)]/10 bg-[var(--theme-bg-primary)]/50">
        <ProjectFilterCards :events="events" :filters="filters as any" v-model:selectedProject="selectedProject" />
      </div>
      <div class="border-b border-[var(--theme-border-primary)]/10 bg-[var(--theme-bg-primary)]/30 min-h-0 min-w-0">
        <LivePulseChart :events="events" :filters="filters as any" />
      </div>
      <div class="min-h-0 min-w-0">
        <EventTimeline :events="events" :filters="filters as any" @update:filters="filters = $event" :selected-project="selectedProject" v-model:stick-to-bottom="stickToBottom" />
      </div>
    </main>

    <StickScrollButton :stick-to-bottom="stickToBottom" @toggle="stickToBottom = !stickToBottom" />

    <div v-if="error" class="fixed bottom-4 left-4 right-4 sm:right-auto text-xs bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-md">
      <AlertCircle class="w-4 h-4 inline mr-2 align-middle" />
      <span class="align-middle">{{ error }}</span>
    </div>

    <ThemeManager :is-open="showThemeManager" @close="showThemeManager = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { AlertCircle } from 'lucide-vue-next';
import { useWebSocket } from './composables/useWebSocket';
import { useThemes } from './composables/useThemes';
import EventTimeline from './components/EventTimeline.vue';
import FilterPanel from './components/FilterPanel.vue';
import StickScrollButton from './components/StickScrollButton.vue';
import LivePulseChart from './components/LivePulseChart.vue';
import ThemeManager from './components/ThemeManager.vue';
import ProjectFilterCards from './components/ProjectFilterCards.vue';

const { events, isConnected, error } = useWebSocket('ws://localhost:4000/stream');
const themes = useThemes();

const filters = ref({ sessionId: '', eventType: '' });
const stickToBottom = ref(true);
const showThemeManager = ref(false);
const showFilters = ref(true);
const showThemeMenu = ref(false);
const selectedProject = ref<string>('');

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
